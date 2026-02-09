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

import {
  caricaTemperatureMese
} from "./registro-temperature-db.js";


import { initAuth } from "./auth.js";

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
const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre"
];

/* =====================================================
   RENDER ANNI
===================================================== */
function renderAnni() {
  listaAnni.innerHTML = "";

  const annoCorrente = new Date().getFullYear();
  const anni = [annoCorrente - 1, annoCorrente];

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

  MESI.forEach((nomeMese, index) => {
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

  /* 🔥 AUTOCOMPILAZIONE GIORNI MANCANTI */
  await autoCompilaTemperature();

  const datiMese = await caricaTemperatureMese(anno, meseIndex + 1);


  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* =====================
     INTESTAZIONE
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

  FRIGORIFERI.forEach(f => {
    const datiGiorno = datiMese[dataISO]?.frigoriferi?.[f.id];

    const mattina = datiGiorno?.mattina ?? "";
    const pomeriggio = datiGiorno?.pomeriggio ?? "";

    tr.innerHTML += `
      <td>
        <div class="cella-temp">
          <input type="text" value="${mattina}" placeholder="M">
          <input type="text" value="${pomeriggio}" placeholder="P">
        </div>
      </td>
    `;
  });

  tbody.appendChild(tr);
}

  }

  console.log("✔ Registro aperto:", nomeMese, anno);


/* =====================================================
   AUTOCOMPILA TEMPERATURE
===================================================== */
async function autoCompilaTemperature() {
  const ultimaData = await getUltimaDataRegistrata();

  if (!ultimaData) {
    console.log("ℹ️ Nessun dato precedente → primo avvio");
    return;
  }

  const giorniMancanti = calcolaGiorniMancanti(ultimaData);

  if (!giorniMancanti.length) {
    console.log("✔ Nessun giorno mancante");
    return;
  }

  console.log("🧠 Autocompilo giorni:", giorniMancanti);

  for (const dataISO of giorniMancanti) {
    await creaGiornoTemperature(dataISO);
  }
}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  renderAnni();
});
