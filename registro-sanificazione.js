/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";

import {
  SANIFICAZIONE_COLONNE,
  VALORE_OK,
  VALORE_NO
} from "./registro-sanificazione-utils.js";

import {
  getUltimaDataSanificazione,
  creaGiornoSanificazione,
  caricaSanificazioneMese,
  aggiornaValoreSanificazione
} from "./registro-sanificazione-db.js";

/* =====================================================
   DOM
===================================================== */
const listaAnni = document.getElementById("lista-anni");
const listaMesi = document.getElementById("lista-mesi");

const cardMesi = document.getElementById("card-mesi");
const cardTabella = document.getElementById("card-tabella");

const titoloAnno = document.getElementById("titolo-anno");
const titoloMese = document.getElementById("titolo-mese");

const thead = document.getElementById("thead-sanificazione");
const tbody = document.getElementById("tbody-sanificazione");
const MESI = [
  "Gennaio","Febbraio","Marzo","Aprile",
  "Maggio","Giugno","Luglio","Agosto",
  "Settembre","Ottobre","Novembre","Dicembre"
];
function renderAnni() {
  listaAnni.innerHTML = "";

  const anno = 2026;

  const box = document.createElement("div");
  box.className = "box-toggle";
  box.textContent = `📁 ${anno}`;
  box.onclick = () => apriAnno(anno);

  listaAnni.appendChild(box);
}
function apriAnno(anno) {
  titoloAnno.textContent = `Anno ${anno}`;
  listaMesi.innerHTML = "";

  cardMesi.classList.remove("hidden");
  cardTabella.classList.add("hidden");

  MESI.forEach((nome, index) => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.textContent = nome;
    box.onclick = () => apriMese(anno, index, nome);
    listaMesi.appendChild(box);
  });
}
async function apriMese(anno, meseIndex, nomeMese) {
  titoloMese.textContent = `${nomeMese} ${anno}`;
  cardTabella.classList.remove("hidden");

  // 🔁 autocrea SOLO i giorni mancanti
  await autoCompilaSanificazione();

  const datiMese = await caricaSanificazioneMese(anno, meseIndex + 1);

  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* ===== HEADER ===== */
  const trHead = document.createElement("tr");
  trHead.innerHTML = `<th class="data">Data</th>`;

  SANIFICAZIONE_COLONNE.forEach(c => {
    trHead.innerHTML += `<th>${c.label}</th>`;
  });

  thead.appendChild(trHead);

  /* ===== RIGHE ===== */
  const giorniNelMese = new Date(anno, meseIndex + 1, 0).getDate();

  for (let g = 1; g <= giorniNelMese; g++) {
    const dataISO = `${anno}-${String(meseIndex + 1).padStart(2,"0")}-${String(g).padStart(2,"0")}`;
    const dataLabel = `${String(g).padStart(2,"0")}/${String(meseIndex + 1).padStart(2,"0")}/${anno}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${dataLabel}</td>`;

    SANIFICAZIONE_COLONNE.forEach(col => {
      const valore =
        datiMese[dataISO]?.[col.id] ?? VALORE_OK;

      const td = document.createElement("td");
      td.textContent = valore;
      td.className = "cella-spunta";
      td.style.cursor = "pointer";

      td.onclick = async () => {
        const nuovo = td.textContent === VALORE_OK ? VALORE_NO : VALORE_OK;
        td.textContent = nuovo;

        await aggiornaValoreSanificazione({
  dataISO,
  tipo: col.id,
  valore: nuovo
});

      };

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }
}
async function autoCompilaSanificazione() {
  const ultimaData = await getUltimaDataSanificazione();


  const oggiISO = new Date().toISOString().split("T")[0];

  let dataCorrente;

  if (!ultimaData) {
    dataCorrente = "2026-01-01";
  } else {
    const d = new Date(ultimaData);
    d.setDate(d.getDate() + 1);
    dataCorrente = d.toISOString().split("T")[0];
  }

  while (dataCorrente <= oggiISO) {
    await creaGiornoSanificazione(dataCorrente);

    const d = new Date(dataCorrente);
    d.setDate(d.getDate() + 1);
    dataCorrente = d.toISOString().split("T")[0];
  }
}
initAuth(() => {
  renderAnni();
});
