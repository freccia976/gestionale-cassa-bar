/* =====================================================
   IMPORT (TUTTI IN CIMA)
===================================================== */
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser, onUserChanged } from "./firebase-db.js";

/* =====================================================
   SETUP FIREBASE
===================================================== */
const db = getFirestore();

/* =====================================================
   ELEMENTI DOM
===================================================== */
const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");
const btnSalvaTassa = document.getElementById("salva-tassa");
const listaAnni = document.getElementById("lista-anni-tasse");

/* =====================================================
   POPUP APERTURA / CHIUSURA
===================================================== */
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

/* =====================================================
   BOX TOGGLE (UNO SOLO ATTIVO)
===================================================== */
function initBoxToggle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const boxes = container.querySelectorAll(".box-toggle");

  boxes.forEach(box => {
    box.onclick = () => {
      boxes.forEach(b => b.classList.remove("attivo"));
      box.classList.add("attivo");
    };
  });
}

initBoxToggle("tassa-riferita");
initBoxToggle("tassa-pagamento");

/* =====================================================
   SALVATAGGIO TASSA (NUOVA o MODIFICA)
===================================================== */
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

    if (!soggetto || !pagamento || !tipo || !importo || !dataPagamento) {
      alert("Compila tutti i campi");
      return;
    }

    const anno = new Date(dataPagamento).getFullYear();
    const tassaId = document.getElementById("tassa-id").value;

    const payload = {
      anno,
      soggetto,
      tipo,
      pagamento,
      importo,
      dataPagamento
    };

    if (tassaId) {
      await updateDoc(
        doc(db, "users", user.uid, "tasse", tassaId),
        payload
      );
    } else {
      await addDoc(
        collection(db, "users", user.uid, "tasse"),
        {
          ...payload,
          createdAt: serverTimestamp()
        }
      );
    }

    popupNuovaTassa.classList.add("hidden");
    document.getElementById("tassa-id").value = "";

    caricaAnniTasse();
    alert("✅ Tassa salvata correttamente");
  };
}

/* =====================================================
   RIEPILOGO ANNI
===================================================== */
async function caricaAnniTasse() {
  const user = getCurrentUser();
  if (!user || !listaAnni) return;

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "tasse")
  );

  const anni = new Set();

  snapshot.forEach(d => {
    if (d.data().anno) anni.add(d.data().anno);
  });

  listaAnni.innerHTML = "";

  [...anni]
    .sort((a, b) => b - a)
    .forEach(anno => {
      const box = document.createElement("div");
      box.className = "box-toggle";
      box.textContent = `Tasse ${anno}`;
      box.onclick = () => {
        window.location.href = `tasse-anno.html?anno=${anno}`;
      };
      listaAnni.appendChild(box);
    });
}

/* =====================================================
   MODIFICA TASSA DA URL
===================================================== */
function getIdModificaDaUrl() {
  return new URLSearchParams(window.location.search).get("modifica");
}

async function caricaTassaDaModificare() {
  const tassaId = getIdModificaDaUrl();
  if (!tassaId) return;

  const user = getCurrentUser();
  if (!user) return;

  const snap = await getDoc(
    doc(db, "users", user.uid, "tasse", tassaId)
  );

  if (!snap.exists()) return;

  const t = snap.data();

  popupNuovaTassa.classList.remove("hidden");
  document.querySelector("#popup-nuova-tassa h2").textContent =
    "Modifica tassa / imposta";

  document.getElementById("tassa-id").value = tassaId;
  document.getElementById("tassa-tipo").value = t.tipo;
  document.getElementById("tassa-importo").value = t.importo;
  document.getElementById("tassa-data").value = t.dataPagamento;

  document
    .querySelectorAll("#tassa-riferita .box-toggle")
    .forEach(b =>
      b.classList.toggle("attivo", b.dataset.soggetto === t.soggetto)
    );

  document
    .querySelectorAll("#tassa-pagamento .box-toggle")
    .forEach(b =>
      b.classList.toggle("attivo", b.dataset.pagamento === t.pagamento)
    );
}

/* =====================================================
   AUTH + INIT
===================================================== */
onUserChanged(user => {
  if (!user) return;
  caricaAnniTasse();
  caricaTassaDaModificare();
});
