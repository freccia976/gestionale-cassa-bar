/* =====================================================
   IMPORT FIREBASE
===================================================== */
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser }
  from "./firebase-db.js";

/* =====================================================
   SETUP
===================================================== */
const db = getFirestore();

/* =====================================================
   CREA EVENTO AGENDA
===================================================== */
export async function creaEventoAgenda({
  titolo,
  descrizione = "",
  tipo = "nota",
  data,
  ora = "",
  priorita = "media",
  promemoria = false
}) {

  const user = getCurrentUser();
  if (!user) return;

  const ref = collection(
    db,
    "users",
    user.uid,
    "agenda"
  );

  await addDoc(ref, {

    titolo,
    descrizione,

    tipo,
    data,
    ora,

    priorita,
    promemoria,

    stato: "attivo",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  console.log("📅 Evento agenda creato");
}

/* =====================================================
   CARICA EVENTO SINGOLO
===================================================== */
export async function getEventoAgenda(id) {

  const user = getCurrentUser();
  if (!user) return null;

  const ref = doc(
    db,
    "users",
    user.uid,
    "agenda",
    id
  );

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id, ...snap.data() };
}

/* =====================================================
   AGGIORNA EVENTO
===================================================== */
export async function aggiornaEventoAgenda(
  id,
  dati
) {

  const user = getCurrentUser();
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "agenda",
    id
  );

  await updateDoc(ref, {
    ...dati,
    updatedAt: serverTimestamp()
  });

  console.log("✏️ Evento aggiornato");
}

/* =====================================================
   ELIMINA EVENTO
===================================================== */
export async function eliminaEventoAgenda(id) {

  const user = getCurrentUser();
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "agenda",
    id
  );

  await deleteDoc(ref);

  console.log("🗑 Evento eliminato");
}

/* =====================================================
   EVENTI PROSSIMI (BANNER HOME)
===================================================== */
export async function caricaProssimiEventi(
  limite = 3
) {

  const user = getCurrentUser();
  if (!user) return [];

  const oggi =
    new Date().toISOString().split("T")[0];

  const ref = collection(
    db,
    "users",
    user.uid,
    "agenda"
  );

  const q = query(
    ref,
    where("data", ">=", oggi),
    orderBy("data"),
  );

  const snap = await getDocs(q);

  const eventi = [];

  snap.forEach(docSnap => {
    eventi.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return eventi.slice(0, limite);
}

/* =====================================================
   EVENTI MESE
===================================================== */
export async function caricaEventiMese(
  anno,
  mese
) {

  const user = getCurrentUser();
  if (!user) return [];

  const start =
    `${anno}-${String(mese).padStart(2,"0")}-01`;

  const end =
    `${anno}-${String(mese).padStart(2,"0")}-31`;

  const ref = collection(
    db,
    "users",
    user.uid,
    "agenda"
  );

  const q = query(
    ref,
    where("data", ">=", start),
    where("data", "<=", end),
    orderBy("data")
  );

  const snap = await getDocs(q);

  const eventi = [];

  snap.forEach(docSnap => {
    eventi.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return eventi;
}

/* =====================================================
   SEGNA COMPLETATO
===================================================== */
export async function completaEventoAgenda(
  id
) {

  await aggiornaEventoAgenda(id, {
    stato: "completato"
  });

}
