/* =====================================================
   IMPORT
===================================================== */
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";
import { FRIGORIFERI, generaTemperatura } from "./registro-temperature-utils.js";

/* =====================================================
   SETUP
===================================================== */
const db = getFirestore();

/* =====================================================
   CARICA TEMPERATURE DI UN MESE
===================================================== */
export async function caricaTemperatureMese(anno, mese) {
  const user = getCurrentUser();
  if (!user) return {};

  const ref = collection(db, "users", user.uid, "registro_temperature");
  const snap = await getDocs(ref);

  const dati = {};

  snap.forEach(docSnap => {
    const id = docSnap.id; // formato YYYY-MM-DD
    const [y, m] = id.split("-").map(Number);

    if (y === anno && m === mese) {
      dati[id] = docSnap.data();
    }
  });

  return dati;
}

/* =====================================================
   ULTIMA DATA REGISTRATA (ANTI BUCHI)
===================================================== */
export async function getUltimaDataRegistrata() {
  const user = getCurrentUser();
  if (!user) return null;

  const ref = collection(db, "users", user.uid, "registro_temperature");

  const q = query(ref, orderBy("data", "desc"), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  return snap.docs[0].id; // YYYY-MM-DD
}

/* =====================================================
   CREA GIORNO TEMPERATURE (AUTOMATICO)
   ⚠️ NON sovrascrive se esiste già
===================================================== */
export async function creaGiornoTemperature(dataISO) {
  const user = getCurrentUser();
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "registro_temperature",
    dataISO
  );

  // 🔒 controllo esistenza
  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("⏭️ Giorno già presente, salto:", dataISO);
    return;
  }

  const frigoriferiData = {};

  FRIGORIFERI.forEach(f => {
    frigoriferiData[f.id] = {
      mattina: generaTemperatura(f),
      pomeriggio: generaTemperatura(f),
      automatico: true
    };
  });

  await setDoc(ref, {
    data: dataISO,
    frigoriferi: frigoriferiData,
    createdAt: new Date()
  });

  console.log("✅ Creato giorno temperature:", dataISO);
}
