import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";
import { FRIGORIFERI, generaTemperatura } from "./registro-temperature-utils.js";

const db = getFirestore();

/* =====================================================
   ULTIMA DATA REGISTRATA
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

  const datiFrigo = {};

  FRIGORIFERI.forEach(f => {
    datiFrigo[f.id] = {
      mattina: generaTemperatura(f),
      pomeriggio: generaTemperatura(f),
      automatico: true
    };
  });

  await setDoc(ref, {
    data: dataISO,
    frigoriferi: datiFrigo,
    createdAt: new Date()
  });

  console.log("✅ Creato giorno temperature:", dataISO);
}
