/* =====================================================
   IMPORT
===================================================== */
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";
import { initAuth } from "./auth.js";

/* =====================================================
   SETUP
===================================================== */
const db = getFirestore();

const lista = document.getElementById("lista-tasse");
const totaleBox = document.getElementById("totale-tasse");
const titoloAnno = document.getElementById("titolo-anno");

/* =====================================================
   UTILS
===================================================== */
function getAnnoFromUrl() {
  return parseInt(new URLSearchParams(window.location.search).get("anno"));
}

function formatEuro(n) {
  return n.toFixed(2);
}

function formatData(d) {
  return new Date(d).toLocaleDateString("it-IT");
}

/* =====================================================
   CARICAMENTO TASSE
===================================================== */
async function caricaTasseAnno() {
  const user = getCurrentUser();
  if (!user) return;

  const anno = getAnnoFromUrl();
  if (!anno) return;

  titoloAnno.textContent = `Tasse ${anno}`;

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "tasse")
  );

  const tasse = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.anno === anno) {
      tasse.push({
        id: docSnap.id,
        ...d
      });
    }
  });

  tasse.sort(
    (a, b) => new Date(a.dataPagamento) - new Date(b.dataPagamento)
  );

  renderLista(tasse);
}

/* =====================================================
   RENDER LISTA + ELIMINAZIONE
===================================================== */
function renderLista(tasse) {
  lista.innerHTML = "";
  let totale = 0;

  if (!tasse.length) {
    lista.innerHTML = "<p>Nessuna tassa per questo anno</p>";
    totaleBox.textContent = "0.00";
    return;
  }

  tasse.forEach(t => {
    totale += t.importo;

    const riga = document.createElement("div");
    riga.className = "riga-tassa";
    riga.dataset.soggetto = t.soggetto;

    riga.innerHTML = `
      <div class="tassa-sx">
        <div class="tassa-titolo">${t.tipo}</div>
        <div class="tassa-meta">
          ${formatData(t.dataPagamento)} • ${t.soggetto} • ${t.pagamento}
        </div>
      </div>

      <div class="tassa-dx">
        <div class="tassa-importo">€ ${formatEuro(t.importo)}</div>
        <button class="btn-azione btn-modifica">✏️</button>
        <button class="btn-azione btn-elimina">🗑️</button>
      </div>
    `;

    // MODIFICA → redirect
    riga.querySelector(".btn-modifica").onclick = () => {
      window.location.href = `tasse.html?modifica=${t.id}`;
    };

    // ELIMINAZIONE
    riga.querySelector(".btn-elimina").onclick = async () => {
      const conferma = confirm(
        `Vuoi eliminare la tassa "${t.tipo}" del ${formatData(t.dataPagamento)}?`
      );

      if (!conferma) return;

      const user = getCurrentUser();
      if (!user) return;

      await deleteDoc(
        doc(db, "users", user.uid, "tasse", t.id)
      );

      caricaTasseAnno();
    };

    lista.appendChild(riga);
  });

  totaleBox.textContent = formatEuro(totale);
}

/* =====================================================
   FILTRI
===================================================== */
function initFiltri() {
  const container = document.getElementById("filtro-soggetto");
  if (!container) return;

  const boxes = container.querySelectorAll(".box-toggle");

  boxes.forEach(box => {
    box.onclick = () => {
      boxes.forEach(b => b.classList.remove("attivo"));
      box.classList.add("attivo");
      filtraTasse(box.dataset.soggetto);
    };
  });
}

function filtraTasse(soggetto) {
  document.querySelectorAll(".riga-tassa").forEach(riga => {
    riga.style.display =
      soggetto === "ALL" || riga.dataset.soggetto === soggetto
        ? "flex"
        : "none";
  });
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  caricaTasseAnno();
  initFiltri();
});
