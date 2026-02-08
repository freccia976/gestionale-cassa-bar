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

/* =====================
   POPUP NUOVA TASSA
===================== */
const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");

/* ===== APERTURA / CHIUSURA ===== */
if (btnNuovaTassa && popupNuovaTassa) {
  btnNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.remove("hidden");
  };
}

if (chiudiNuovaTassa && popupNuovaTassa) {
  chiudiNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.add("hidden");
  };
}

/* =====================
   SELEZIONE A BOX (UNO SOLO ATTIVO)
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

/* =====================
   SALVATAGGIO TASSA
===================== */
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

    const tipo = document.getElementById("tassa-tipo")?.value.trim();
    const importo = parseFloat(
      document.getElementById("tassa-importo")?.value
    );
    const dataPagamento = document.getElementById("tassa-data")?.value;

    if (!soggetto || !pagamento || !tipo || !importo || !dataPagamento) {
      alert("Compila tutti i campi");
      return;
    }

    const anno = new Date(dataPagamento).getFullYear();

    await addDoc(
      collection(db, "users", user.uid, "tasse"),
      {
        anno,
        soggetto,
        tipo,
        pagamento,
        importo,
        dataPagamento,
        createdAt: serverTimestamp()
      }
    );

    alert("✅ Tassa salvata correttamente");

    popupNuovaTassa.classList.add("hidden");
  };
}

/* =====================
   RIEPILOGO ANNI TASSE
===================== */
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
      box.onclick = () => {
        window.location.href = `tasse-anno.html?anno=${anno}`;
      };
      cont.appendChild(box);
    });
}

caricaAnniTasse();
