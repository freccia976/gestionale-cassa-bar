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

/* =====================================================
   COSTANTI
===================================================== */
const ANNO_ATTIVO = 2026;

const MESI = [
  "Gennaio","Febbraio","Marzo","Aprile",
  "Maggio","Giugno","Luglio","Agosto",
  "Settembre","Ottobre","Novembre","Dicembre"
];

/* =====================================================
   RENDER ANNI
===================================================== */
function renderAnni() {
  listaAnni.innerHTML = "";

  const box = document.createElement("div");
  box.className = "box-toggle";
  box.textContent = `📁 ${ANNO_ATTIVO}`;
  box.onclick = () => apriAnno(ANNO_ATTIVO);

  listaAnni.appendChild(box);
}

/* =====================================================
   APRI ANNO
===================================================== */
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

/* =====================================================
   APRI MESE
===================================================== */
async function apriMese(anno, meseIndex, nomeMese) {
  titoloMese.textContent = `${nomeMese} ${anno}`;
  cardTabella.classList.remove("hidden");

  await autoCompilaSanificazione();

  const datiMese = await caricaSanificazioneMese(anno, meseIndex + 1);

  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* ===== HEADER ===== */
  const trHead = document.createElement("tr");
  trHead.innerHTML = `<th class="data">Data</th>`;

  SANIFICAZIONE_COLONNE.forEach(col => {
    trHead.innerHTML += `<th>${col.label}</th>`;
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

      let valore = "";

      if (col.gruppo === "sanificazione") {
        valore = datiMese[dataISO]?.sanificazione?.[col.id] ?? "";
      }

      if (col.gruppo === "infestanti") {
        valore = datiMese[dataISO]?.infestanti?.[col.id] ?? "";
      }

      const td = document.createElement("td");
      td.textContent = valore;
      td.className = "cella-spunta";
      td.style.cursor = "pointer";

      td.onclick = async () => {

        const nuovo = td.textContent === VALORE_OK ? VALORE_NO : VALORE_OK;
        td.textContent = nuovo;

        await aggiornaValoreSanificazione({
          dataISO,
          gruppo: col.gruppo,
          campo: col.id,
          valore: nuovo
        });
      };

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }
}

/* =====================================================
   AUTOCOMPILA SANIFICAZIONE
===================================================== */
async function autoCompilaSanificazione() {

  const ultimaData = await getUltimaDataSanificazione();
  const oggiISO = new Date().toISOString().split("T")[0];

  let dataCorrente;

  if (!ultimaData) {
    dataCorrente = `${ANNO_ATTIVO}-01-01`;
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

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  renderAnni();
});
