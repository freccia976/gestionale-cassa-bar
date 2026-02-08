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

  let tasse = [];

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.anno === anno) {
      tasse.push(d);
    }
  });

  // ordine cronologico
  tasse.sort(
    (a, b) => new Date(a.dataPagamento) - new Date(b.dataPagamento)
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

    riga.innerHTML = `
      <strong>${formatData(t.dataPagamento)}</strong> |
      ${t.tipo} |
      ${t.soggetto} |
      ${t.pagamento} |
      € ${formatEuro(t.importo)}
    `;

    lista.appendChild(riga);
  });

  totaleBox.textContent = formatEuro(totale);
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  caricaTasseAnno();
});
