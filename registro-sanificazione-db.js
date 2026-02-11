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
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";

import {
  VALORE_OK,
  isSettimanaAttiva,
  isMensileAttiva,
  isSemestraleAttiva
} from "./registro-sanificazione-utils.js";

/* =====================================================
   SETUP
===================================================== */
const db = getFirestore();

/* =====================================================
   CREA GIORNO SANIFICAZIONE
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

  if (snap.exists()) return; // anti-sovrascrittura

  await setDoc(ref, {
    data: dataISO,

    sanificazione: {
      giornaliera: VALORE_OK,

      settimanale: isSettimanaAttiva(dataISO)
        ? VALORE_OK
        : "",

      mensile: isMensileAttiva(dataISO)
        ? VALORE_OK
        : "",

      semestrale: isSemestraleAttiva(dataISO)
        ? VALORE_OK
        : ""
    },

    infestanti: {
      giornaliero: VALORE_OK
    },

    automatico: true,
    createdAt: serverTimestamp()
  });
}

/* =====================================================
   AUTOCOMPILAZIONE FINO A OGGI
===================================================== */
export async function autoCompilaFinoOggi() {
  const user = getCurrentUser();
  if (!user) return;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const ref = collection(
    db,
    "users",
    user.uid,
    "registro_sanificazione"
  );

  const snap = await getDocs(ref);

  const esistenti = new Set();
  snap.forEach(d => esistenti.add(d.id));

  const inizioAnno = new Date(oggi.getFullYear(), 0, 1);

  for (
    let d = new Date(inizioAnno);
    d <= oggi;
    d.setDate(d.getDate() + 1)
  ) {
    const iso = d.toISOString().split("T")[0];

    if (!esistenti.has(iso)) {
      await creaGiornoSanificazione(iso);
    }
  }
}

/* =====================================================
   CREA IERI AUTOMATICO
===================================================== */
export async function creaIeriSeManca() {
  const ieri = new Date();
  ieri.setDate(ieri.getDate() - 1);

  const iso = ieri.toISOString().split("T")[0];

  await creaGiornoSanificazione(iso);
}

/* =====================================================
   CARICA MESE (QUERY CORRETTA)
===================================================== */
export async function caricaSanificazioneMese(anno, mese) {
  const user = getCurrentUser();
  if (!user) return {};

  const start = `${anno}-${String(mese).padStart(2, "0")}-01`;
  const end = `${anno}-${String(mese).padStart(2, "0")}-31`;

  const ref = collection(
    db,
    "users",
    user.uid,
    "registro_sanificazione"
  );

  const q = query(
    ref,
    where("data", ">=", start),
    where("data", "<=", end)
  );

  const snap = await getDocs(q);

  const dati = {};
  snap.forEach(d => (dati[d.id] = d.data()));

  return dati;
}

/* =====================================================
   AGGIORNA SPUNTA
===================================================== */
export async function aggiornaValoreSanificazione({
  dataISO,
  gruppo,
  campo,
  valore
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
        [campo]: valore ? VALORE_OK : ""
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
