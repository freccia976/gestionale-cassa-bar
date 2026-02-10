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
import { valoreDefault } from "./registro-sanificazione-utils.js";

const db = getFirestore();

/* =====================================================
   ULTIMA DATA REGISTRATA
===================================================== */
export async function getUltimaDataSanificazione() {
  const user = getCurrentUser();
  if (!user) return null;

  const ref = collection(db, "users", user.uid, "registro_sanificazione");
  const q = query(ref, orderBy("data", "desc"), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) return null;
  return snap.docs[0].id; // YYYY-MM-DD
}

/* =====================================================
   CREA GIORNO SANIFICAZIONE (SE NON ESISTE)
===================================================== */
export async function creaGiornoSanificazione(dataISO) {
  const user = getCurrentUser();
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "registro_sanificazione",
    dataISO
  );

  const snap = await getDoc(ref);
  if (snap.exists()) {
    console.log("⏭️ Giorno già presente:", dataISO);
    return;
  }

  await setDoc(ref, {
    data: dataISO,
    sanificazione: {
      giornaliera: valoreDefault(),
      settimanale: valoreDefault(),
      mensile: valoreDefault()
    },
    infestanti: {
      giornaliero: valoreDefault(),
      semestrale: valoreDefault()
    },
    automatico: true,
    createdAt: new Date()
  });

  console.log("🧼 Sanificazione creata:", dataISO);
}

/* =====================================================
   CARICA SANIFICAZIONE MESE
===================================================== */
export async function caricaSanificazioneMese(anno, mese) {
  const user = getCurrentUser();
  if (!user) return {};

  const ref = collection(db, "users", user.uid, "registro_sanificazione");
  const snap = await getDocs(ref);

  const dati = {};

  snap.forEach(docSnap => {
    const [y, m] = docSnap.id.split("-").map(Number);
    if (y === anno && m === mese) {
      dati[docSnap.id] = docSnap.data();
    }
  });

  return dati;
}

/* =====================================================
   AGGIORNA VALORE (SPUNTA)
===================================================== */
export async function aggiornaValoreSanificazione({
  dataISO,
  gruppo,   // "sanificazione" | "infestanti"
  campo,    // es. "giornaliera"
  valore    // true / false
}) {
  const user = getCurrentUser();
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "registro_sanificazione",
    dataISO
  );

  await setDoc(
    ref,
    {
      [gruppo]: {
        [campo]: valore
      },
      updatedAt: new Date()
    },
    { merge: true }
  );

  console.log(
    "✅ Sanificazione aggiornata:",
    dataISO,
    gruppo,
    campo,
    valore
  );
}
