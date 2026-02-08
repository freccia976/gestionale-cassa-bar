/* =====================
   POPUP NUOVA TASSA
===================== */

const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");

/* ===== APERTURA / CHIUSURA ===== */
if (btnNuovaTassa) {
  btnNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.remove("hidden");
  };
}

if (chiudiNuovaTassa) {
  chiudiNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.add("hidden");
  };
}

/* =====================
   SELEZIONE A BOX (SOLO UNO ATTIVO)
===================== */
function initBoxToggle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll(".box-toggle").forEach(box => {
    box.onclick = () => {
      container
        .querySelectorAll(".box-toggle")
        .forEach(b => b.classList.remove("attivo"));

      box.classList.add("attivo");
    };
  });
}

initBoxToggle("tassa-riferita");
initBoxToggle("tassa-pagamento");

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";

const db = getFirestore();

const btnSalvaTassa = document.getElementById("salva-tassa");

if (btnSalvaTassa) {
  btnSalvaTassa.onclick = async () => {
    const user = getCurrentUser();
    if (!user) {
      alert("Utente non loggato");
      return;
    }

    const soggetto = document.querySelector(
      "#tassa-riferita .box-toggle.attivo"
    )?.dataset.soggetto;

    const pagamento = document.querySelector(
      "#tassa-pagamento .box-toggle.attivo"
    )?.dataset.pagamento;

    const tipo = document.getElementById("tassa-tipo").value.trim();
    const importo = parseFloat(
      document.getElementById("tassa-importo").value
    );
    const dataPagamento = document.getElementById("tassa-data").value;

    if (!tipo || !importo || !dataPagamento) {
      alert("Compila tutti i campi");
      return;
    }

    const anno = new Date(dataPagamento).getFullYear();

    const dati = {
      anno,
      soggetto,
      tipo,
      pagamento,
      importo,
      dataPagamento,
      createdAt: serverTimestamp()
    };

    await addDoc(
      collection(db, "users", user.uid, "tasse"),
      dati
    );

    alert("✅ Tassa salvata correttamente");

    document.getElementById("popup-nuova-tassa").classList.add("hidden");
  };
}
import {
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

async function caricaAnniTasse() {
  const user = getCurrentUser();
  if (!user) return;

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "tasse")
  );

  const anni = new Set();

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.anno) anni.add(d.anno);
  });

  const cont = document.getElementById("lista-anni-tasse");
  cont.innerHTML = "";

  [...anni]
    .sort((a, b) => b - a)
    .forEach(anno => {
      const box = document.createElement("div");
      box.className = "box-toggle";
      box.textContent = `Tasse ${anno}`;
      box.onclick = () => {
        window.location.href = `tasse-anno.html?anno=${anno}`;
      };
      cont.appendChild(box);
    });
}

caricaAnniTasse();
