import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";
import {
  FRIGORIFERI,
  generaTemperatura
} from "./registro-temperature-utils.js";

const db = getFirestore();

/* =====================================================
   LEGGE ULTIMA DATA PRESENTE
===================================================== */
export async function getUltimaDataRegistrata(anno, mese) {
  const user = getCurrentUser();
  if (!user) return null;

  const ref = collection(
    db,
    "users",
    user.uid,
    "registro_temperature",
    `${anno}-${mese}`
  );

  const snap = await getDocs(ref);

  let ultima = null;

  snap.forEach(d => {
    if (!ultima || d.id > ultima) ultima = d.id;
  });

  return ultima;
}

/* =====================================================
   CREA GIORNO COMPLETO
===================================================== */
export async function creaGiornoTemperature(anno, mese, dataISO) {
  const user = getCurrentUser();
  if (!user) return;

  const payload = {
    data: dataISO,
    frigoriferi: {}
  };

  FRIGORIFERI.forEach(f => {
    payload.frigoriferi[f.id] = {
      mattina: generaTemperatura(f),
      pomeriggio: generaTemperatura(f)
    };
  });

  await setDoc(
    doc(
      db,
      "users",
      user.uid,
      "registro_temperature",
      `${anno}-${mese}`,
      dataISO
    ),
    payload
  );

  console.log("AUTO-COMPILATO:", dataISO);
}
