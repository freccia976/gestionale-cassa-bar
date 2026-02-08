/* =====================================================
   IMPORT (DEVONO STARE IN CIMA)
===================================================== */
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";

/* =====================================================
   SETUP FIREBASE
===================================================== */
const db = getFirestore();

/* =====================================================
   POPUP NUOVA TASSA
===================================================== */
const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");

/* ===== APERTURA / CHIUSURA POPUP ===== */
if (btnNuovaTassa && popupNuovaTassa) {
  btnNuovaTassa.addEventListener("click", () => {
    popupNuovaTassa.classList.remove("hidden");
  });
}

if (chiudiNuovaTassa && popupNuovaTassa) {
  chiudiNuovaTassa.addEventListener("click", () => {
    popupNuovaTassa.classList.add("hidden");
  });
}

/* =====================================================
   SELEZIONE BOX (UNO SOLO ATTIVO)
===================================================== */
function initBoxToggle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const boxes = container.querySelectorAll(".box-toggle");

  boxes.forEach(box => {
    box.addEventListener("click", () => {
      boxes.forEach(b => b.classList.remove("attivo"));
      box.classList.add("attivo");
    });
  });
}

initBoxToggle("tassa-riferita");   // BAR / LORENZO / ELISA
initBoxToggle("tassa-pagamento");  // CONTANTI / BONIFICO / ecc.

/* =====================================================
   SALVATAGGIO NUOVA TASSA
===================================================== */
const btnSalvaTassa = document.getElementById("salva-tassa");

if (btnSalvaTassa) {
  btnSalvaTassa.addEventListener("click", async () => {
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

    const tipoInput = document.getElementById("tassa-tipo");
    const importoInput = document.getElementById("tassa-importo");
    const dataInput = document.getElementById("tassa-data");

    const tipo = tipoInput?.value.trim();
    const importo = parseFloat(importoInput?.value);
    const dataPagamento = dataInput?.value;

    if (!soggetto || !pagamento || !tipo || !importo || !dataPagamento) {
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

    popupNuovaTassa.classList.add("hidden");

    // reset campi (opzionale ma consigliato)
    tipoInput.value = "";
    importoInput.value = "";
    dataInput.value = "";
    document
      .querySelectorAll(".box-toggle.attivo")
      .forEach(b => b.classList.remove("attivo"));

    caricaAnniTasse();
  });
}

/* =====================================================
   RIEPILOGO ANNI TASSE
===================================================== */
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
  if (!cont) return;

  cont.innerHTML = "";

  [...anni]
    .sort((a, b) => b - a)
    .forEach(anno => {
      const box = document.createElement("div");
      box.className = "box-toggle";
      box.textContent = `Tasse ${anno}`;
      box.addEventListener("click", () => {
        window.location.href = `tasse-anno.html?anno=${anno}`;
      });
      cont.appendChild(box);
    });
}

caricaAnniTasse();
