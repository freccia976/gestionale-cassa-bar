/* =====================================================
   AZIONI MOVIMENTI (ELIMINA / MODIFICA)
===================================================== */
import {
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = getFirestore();

/* =====================================================
   ELIMINA MOVIMENTO
===================================================== */
export async function eliminaMovimento(movimentoId) {
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
export async function modificaMovimento(movimentoId, datiAggiornati) {
  const user = getCurrentUser();
  if (!user) {
    alert("Utente non loggato");
    return;
  }

  await updateDoc(
    doc(db, "users", user.uid, "movimenti", movimentoId),
    datiAggiornati
  );
}

