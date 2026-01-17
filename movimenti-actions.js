/* =====================================================
   AZIONI MOVIMENTI (ELIMINA / MODIFICA)
===================================================== */

import {
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getCurrentUser } from "./firebase-db.js";

/* =====================================================
   INIT FIRESTORE
===================================================== */
const db = getFirestore();

/* =====================================================
   ELIMINA MOVIMENTO
===================================================== */
export async function eliminaMovimento(movimentoId) {
  if (!movimentoId) {
    console.error("ID movimento mancante");
    alert("Errore: movimento non valido");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert("Utente non loggato");
    return;
  }

  const conferma = confirm("Vuoi eliminare questo movimento?");
  if (!conferma) return;

  await deleteDoc(
    doc(db, "users", user.uid, "movimenti", movimentoId)
  );
}

/* =====================================================
   MODIFICA MOVIMENTO
===================================================== */
export async function modificaMovimento(movimentoId, dati) {
  if (!movimentoId) {
    console.error("ID movimento mancante", dati);
    alert("Errore: ID movimento non valido");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    alert("Utente non loggato");
    return;
  }

  const ref = doc(db, "users", user.uid, "movimenti", movimentoId);

  await updateDoc(ref, {
    ...dati,
    updatedAt: new Date()
  });
}
