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
const btnPdfAnno = document.getElementById("btn-pdf-anno");

let tasseAnnoCorrente = [];

/* =====================================================
   UTILS
===================================================== */
function getAnnoFromUrl() {
  return parseInt(new URLSearchParams(window.location.search).get("anno"));
}

function formatEuro(n) {
  return Number(n || 0).toFixed(2);
}

function formatData(d) {
  if (!d) return "-";
  const data = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
  return data.toLocaleDateString("it-IT");
}

function getDataRiferimento(t) {
  return t.pagata ? t.dataPagamento : t.dataScadenza;
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

  // 👉 ordinamento per data VISIBILE
  tasse.sort(
    (a, b) =>
      new Date(getDataRiferimento(a)) -
      new Date(getDataRiferimento(b))
  );

  tasseAnnoCorrente = tasse;

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
    riga.className = `riga-tassa ${
      t.pagata ? "tassa-pagata" : "tassa-da-pagare"
    }`;

    riga.dataset.soggetto = t.soggetto;

    const dataLabel = formatData(getDataRiferimento(t));

    riga.innerHTML = `
      <div class="tassa-sx">
        <div class="tassa-titolo">${t.tipo}</div>
        <div class="tassa-meta">
          ${dataLabel} • ${t.soggetto} • ${t.pagamento}
        </div>
      </div>

      <div class="tassa-dx">
        <div class="tassa-importo">€ ${formatEuro(t.importo)}</div>
        <button class="btn-azione btn-modifica">✏️</button>
        <button class="btn-azione btn-elimina">🗑️</button>
      </div>
    `;

    // MODIFICA
    riga.querySelector(".btn-modifica").onclick = () => {
      window.location.href = `tasse.html?modifica=${t.id}`;
    };

    // ELIMINA
    riga.querySelector(".btn-elimina").onclick = async () => {
      const conferma = confirm(
        `Vuoi eliminare la tassa "${t.tipo}" del ${dataLabel}?`
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
   PDF TASSE ANNO
===================================================== */
function generaPDFTasseAnno() {
  if (!tasseAnnoCorrente.length) {
    alert("Nessuna tassa da esportare");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const anno = tasseAnnoCorrente[0].anno;

  doc.setFontSize(16);
  doc.text(`Tasse & Imposte ${anno}`, 14, 16);

  const righe = tasseAnnoCorrente.map(t => [
    t.tipo,
    t.soggetto,
    t.pagata ? "PAGATA" : "DA PAGARE",
    formatData(getDataRiferimento(t)),
    `€ ${formatEuro(t.importo)}`
  ]);

  doc.autoTable({
    startY: 24,
    head: [["Tipo", "Soggetto", "Stato", "Data", "Importo"]],
    body: righe,
    styles: { fontSize: 10 },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.textColor =
          data.cell.raw === "DA PAGARE"
            ? [220, 38, 38]   // rosso
            : [22, 163, 74]; // verde
      }
    }
  });

  doc.save(`tasse-${anno}.pdf`);
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  caricaTasseAnno();
  initFiltri();

  btnPdfAnno?.addEventListener("click", generaPDFTasseAnno);
});
