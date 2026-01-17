/* =====================================================
   CHIUSURA CASSA SETTIMANALE
===================================================== */
import { getFirestore, collection, addDoc } from
  "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getCurrentUser } from "./firebase-db.js";

const db = getFirestore();

/* =====================================================
   INIT
===================================================== */
export function initChiusuraCassa() {
  const btn = document.getElementById("btn-chiusura-cassa");
  if (!btn) return;

  btn.onclick = () => {
    document
      .getElementById("popup-chiusura-cassa")
      .classList.remove("hidden");
  };
}

/* =====================================================
   SALVA CHIUSURA
===================================================== */
export async function salvaChiusuraCassa(dati) {
  const user = getCurrentUser();
  if (!user) {
    alert("Utente non loggato");
    return;
  }

  if (!dati.settimana?.lunedi || !dati.settimana?.sabato) {
    console.error("Settimana mancante", dati);
    alert("Errore: settimana non valida");
    return;
  }

  await addDoc(
    collection(db, "users", user.uid, "chiusure_settimanali"),
    {
      settimana: {
        lunedi: dati.settimana.lunedi,
        sabato: dati.settimana.sabato
      },
      contantiEffettivi: dati.contantiEffettivi,
      versamento: dati.versamento,
      lorenzo: dati.lorenzo,
      elisa: dati.elisa,
      bonus: dati.bonus,
      fondoCassa: dati.fondoCassa,
      createdAt: new Date()
    }
  );
}

/* =====================================================
   SALVA CHIUSURA CASSA (VERSIONE REALE)
===================================================== */
export function initSalvaChiusuraCassa(getSettimanaCorrente) {
  const btnSalva = document.getElementById("btn-salva-chiusura");
  if (!btnSalva) return;

  btnSalva.onclick = async () => {
    const settimana = getSettimanaCorrente();

    if (!settimana) {
      console.error("Settimana mancante");
      return;
    }

    const dati = {
      settimana: {
        lunedi: settimana.lunedi,
        sabato: settimana.sabato
      },
      contantiEffettivi: +document.getElementById("cc-contanti-effettivi").value || 0,
      versamento: +document.getElementById("cc-versamento").value || 0,
      lorenzo: +document.getElementById("cc-lorenzo").value || 0,
      elisa: +document.getElementById("cc-elisa").value || 0,
      bonus: +document.getElementById("cc-bonus").value || 0,
      fondoCassa: +document.getElementById("cc-fondo-cassa").value || 0
    };

    console.log("CHIUSURA CASSA:", dati);

   await salvaChiusuraCassa(dati);

alert("✅ Chiusura cassa salvata correttamente");

  };
}
