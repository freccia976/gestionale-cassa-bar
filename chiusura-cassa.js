/* =====================================================
   CHIUSURA CASSA SETTIMANALE
===================================================== */
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";

const db = getFirestore();

/* =====================================================
   INIT SALVA CHIUSURA CASSA
===================================================== */
export function initSalvaChiusuraCassa(
  getSettimanaCorrente,
  getTotaliSettimana
) {
  const btnSalva = document.getElementById("btn-salva-chiusura");
  if (!btnSalva) return;

  btnSalva.onclick = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert("Utente non loggato");
      return;
    }

    const settimana = getSettimanaCorrente();
    if (!settimana?.lunedi || !settimana?.sabato) {
      alert("Errore: settimana non valida");
      return;
    }

    // 🔹 Totali certificati dalla settimana
    const totali = getTotaliSettimana();

    // 🔹 Valori base
    const contantiEffettivi =
      +document.getElementById("cc-contanti-effettivi").value || 0;

    const versamentoBase =
      +document.getElementById("cc-versamento").value || 0;
    const lorenzoBase =
      +document.getElementById("cc-lorenzo").value || 0;
    const elisaBase =
      +document.getElementById("cc-elisa").value || 0;

    // 🔹 Bonus (solo informativi)
    const bonusVersamento =
      +document.getElementById("cc-bonus-versamento").value || 0;
    const bonusLorenzo =
      +document.getElementById("cc-bonus-lorenzo").value || 0;
    const bonusElisa =
      +document.getElementById("cc-bonus-elisa").value || 0;

    // 🔹 Fondo cassa (NON influenzato dai bonus)
    const fondoCassa =
      +document.getElementById("cc-fondo-cassa").value || 0;

    const datiChiusura = {
      settimana: {
        lunedi: settimana.lunedi,
        sabato: settimana.sabato
      },

      contantiEffettivi,

      // base + bonus (solo per destinazione)
      versamento: versamentoBase + bonusVersamento,
      lorenzo: lorenzoBase + bonusLorenzo,
      elisa: elisaBase + bonusElisa,

      fondoCassa,

      // totali settimanali CERTIFICATI
      totaleContantiSettimana: totali.totaleContanti,
      totalePOSSettimana: totali.totalePOS,
      totaleUsciteSettimana: totali.totaleUscite,

      // bonus solo storico
      bonus: {
        versamento: bonusVersamento,
        lorenzo: bonusLorenzo,
        elisa: bonusElisa
      },

      createdAt: serverTimestamp()
    };

    console.log("CHIUSURA CASSA SALVATA:", datiChiusura);

    await addDoc(
      collection(db, "users", user.uid, "chiusure_settimanali"),
      datiChiusura
    );

    alert("✅ Chiusura cassa salvata correttamente");
    location.reload();
  };
}
