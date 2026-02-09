/* =====================================================
   IMPORT
===================================================== */
import {
  FRIGORIFERI,
  generaTemperatura,
  calcolaGiorniMancanti
} from "./registro-temperature-utils.js";

import {
  getUltimaDataRegistrata,
  creaGiornoTemperature
} from "./registro-temperature-db.js";

import { initAuth } from "./auth.js";

/* =====================================================
   DEBUG (OK)
===================================================== */
console.log("TEST FRIGORIFERI:", FRIGORIFERI);

console.log(
  "TEST TEMP CUCINA:",
  generaTemperatura(
    FRIGORIFERI.find(f => f.id === "BANCO_FRIGO_CUCINA")
  )
);

console.log(
  "TEST TEMP CONGELATORE:",
  generaTemperatura(
    FRIGORIFERI.find(f => f.id === "CONGELATORE_GELATI")
  )
);

console.log(
  "TEST GIORNI MANCANTI:",
  calcolaGiorniMancanti("2026-02-05")
);

/* =====================================================
   DOM
===================================================== */
const listaAnni = document.getElementById("lista-anni");
const listaMesi = document.getElementById("lista-mesi");
const cardMesi = document.getElementById("card-mesi");
const cardTabella = document.getElementById("card-tabella");

const titoloAnno = document.getElementById("titolo-anno");
const titoloMese = document.getElementById("titolo-mese");

const thead = document.getElementById("thead-temperature");
const tbody = document.getElementById("tbody-temperature");

/* =====================================================
   COSTANTI
===================================================== */
const mesi = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre"
];

/* =====================================================
   RENDER ANNI
===================================================== */
function renderAnni() {
  const anni = [2025, 2026];

  listaAnni.innerHTML = "";

  anni.forEach(anno => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.textContent = `📁 ${anno}`;

    box.onclick = () => apriAnno(anno);

    listaAnni.appendChild(box);
  });
}

/* =====================================================
   APRI ANNO
===================================================== */
function apriAnno(anno) {
  titoloAnno.textContent = `Anno ${anno}`;
  listaMesi.innerHTML = "";

  cardMesi.classList.remove("hidden");
  cardTabella.classList.add("hidden");

  mesi.forEach((nomeMese, index) => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.textContent = nomeMese;

    box.onclick = () => apriMese(anno, index, nomeMese);

    listaMesi.appendChild(box);
  });
}

/* =====================================================
   APRI MESE
===================================================== */
async function apriMese(anno, meseIndex, nomeMese) {

  titoloMese.textContent = `${nomeMese} ${anno}`;
  cardTabella.classList.remove("hidden");

  /* 🔥 STEP 1 — AUTOCOMPILA GIORNI MANCANTI */
  await autoCompilaTemperature(anno, meseIndex + 1);

  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* =====================
     INTESTAZIONE TABELLA
  ===================== */
  const trHead = document.createElement("tr");
  trHead.innerHTML = `<th class="data">Data</th>`;

  FRIGORIFERI.forEach(f => {
    trHead.innerHTML += `<th>${f.nome}</th>`;
  });

  thead.appendChild(trHead);

  /* =====================
     GIORNI DEL MESE
  ===================== */
  const giorniNelMese = new Date(anno, meseIndex + 1, 0).getDate();

  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
    const tr = document.createElement("tr");

    const dataISO = `${anno}-${String(meseIndex + 1).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
    const dataLabel = `${String(giorno).padStart(2, "0")}/${String(meseIndex + 1).padStart(2, "0")}/${anno}`;

    tr.innerHTML = `<td>${dataLabel}</td>`;

    FRIGORIFERI.forEach(() => {
      tr.innerHTML += `
        <td>
          <div class="cella-temp">
            <input type="text" placeholder="M">
            <input type="text" placeholder="P">
          </div>
        </td>
      `;
    });

    tbody.appendChild(tr);
  }

  console.log("REGISTRO MESE APERTO:", nomeMese, anno);
}

/* =====================================================
   AUTOCOMPILA TEMPERATURE
===================================================== */
async function autoCompilaTemperature(anno, mese) {

  const ultimaData = await getUltimaDataRegistrata(anno, mese);

  if (!ultimaData) {
    console.log("Nessun dato precedente → primo avvio mese");
    return;
  }

  const giorniMancanti = calcolaGiorniMancanti(ultimaData);

  if (!giorniMancanti.length) {
    console.log("Nessun giorno mancante");
    return;
  }

  console.log("Autocompilo giorni:", giorniMancanti);

  for (const dataISO of giorniMancanti) {
    await creaGiornoTemperature(anno, mese, dataISO);
  }
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  renderAnni();
});
