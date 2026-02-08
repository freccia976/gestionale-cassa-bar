/* =====================================================
   IMPORT
===================================================== */
import {
  getFirestore,
  collection,
  getDocs
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

let tutteLeTasse = [];

/* =====================================================
   UTILS
===================================================== */
function getAnnoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("anno"));
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

  // ✅ QUESTA RIGA MANCAVA
  let tasse = [];

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.anno === anno) {
      tasse.push({
        id: doc.id,
        ...d
      });
    }
  });

  // ordine cronologico
  tasse.sort(
    (a, b) =>
      new Date(a.dataPagamento) - new Date(b.dataPagamento)
  );

  renderLista(tasse);
}

/* =====================================================
   RENDER LISTA
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

riga.querySelector(".btn-modifica").onclick = () => {
  window.location.href = `tasse.html?modifica=${t.id}`;
};



    riga.querySelector(".btn-elimina").onclick = () => {
      alert("Elimina tassa (step successivo)");
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
  const righe = document.querySelectorAll(".riga-tassa");

  righe.forEach(riga => {
    if (soggetto === "ALL") {
      riga.style.display = "flex";
    } else {
      riga.style.display =
        riga.dataset.soggetto === soggetto ? "flex" : "none";
    }
  });
}

function apriPopupModificaTassa(tassa) {
  const popup = document.getElementById("popup-nuova-tassa");
  popup.classList.remove("hidden");

  document.querySelector("#popup-nuova-tassa h2").textContent =
    "Modifica tassa / imposta";

  document.getElementById("tassa-id").value = tassa.id;
  document.getElementById("tassa-tipo").value = tassa.tipo;
  document.getElementById("tassa-importo").value = tassa.importo;
  document.getElementById("tassa-data").value = tassa.dataPagamento;

  // soggetto
  document
    .querySelectorAll("#tassa-riferita .box-toggle")
    .forEach(b => {
      b.classList.toggle(
        "attivo",
        b.dataset.soggetto === tassa.soggetto
      );
    });

  // pagamento
  document
    .querySelectorAll("#tassa-pagamento .box-toggle")
    .forEach(b => {
      b.classList.toggle(
        "attivo",
        b.dataset.pagamento === tassa.pagamento
      );
    });
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  caricaTasseAnno();
  initFiltri();
});
