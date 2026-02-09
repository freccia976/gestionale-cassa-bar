
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


const listaAnni = document.getElementById("lista-anni");
const listaMesi = document.getElementById("lista-mesi");
const cardMesi = document.getElementById("card-mesi");
const cardTabella = document.getElementById("card-tabella");

const titoloAnno = document.getElementById("titolo-anno");
const titoloMese = document.getElementById("titolo-mese");
const tbody = document.getElementById("tbody-temperature");

const mesi = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const frigoriferi = [
  "Banco frigo bar 1",
  "Congelatore gelati",
  "Vetrina esposizione",
  "Banco frigo cucina",
  "Colonna bibite",
  "Colonna frigo magazzino"
];

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

function apriAnno(anno) {
  titoloAnno.textContent = `Anno ${anno}`;
  listaMesi.innerHTML = "";
  cardMesi.classList.remove("hidden");
  cardTabella.classList.add("hidden");

  mesi.forEach((nome, index) => {
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

  /* 🔥 STEP 2 — AUTOCOMPILA GIORNI MANCANTI */
  await autoCompilaTemperature(anno, meseIndex + 1);

  const thead = document.getElementById("thead-temperature");
  const tbody = document.getElementById("tbody-temperature");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  /* === intestazione === */
  const trHead = document.createElement("tr");


  trHead.innerHTML = `<th class="data">Data</th>`;

  frigoriferi.forEach(nome => {
    trHead.innerHTML += `<th>${nome}</th>`;
  });

  thead.appendChild(trHead);

  /* === giorni del mese === */
  const giorniNelMese = new Date(anno, meseIndex + 1, 0).getDate();

  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
    const tr = document.createElement("tr");

    const dataLabel = `${String(giorno).padStart(2, "0")}/${String(meseIndex + 1).padStart(2, "0")}/${anno}`;

    tr.innerHTML = `<td>${dataLabel}</td>`;

    frigoriferi.forEach(() => {
      tr.innerHTML += `
        <td>
         <div class="cella-temp">
  <input type="text" inputmode="decimal" placeholder="M">
  <input type="text" inputmode="decimal" placeholder="P">
</div>

        </td>
      `;
    });

    tbody.appendChild(tr);
  }

  console.log("REGISTRO MESE:", nomeMese, anno);
}

initAuth(() => {
  renderAnni();
});
async function autoCompilaTemperature(anno, mese) {
  const ultimaData = await getUltimaDataRegistrata(anno, mese);

  if (!ultimaData) {
    console.log("Nessun dato precedente → nulla da recuperare");
    return;
  }

  const giorniMancanti = calcolaGiorniMancanti(ultimaData);

  for (const giorno of giorniMancanti) {
    await creaGiornoTemperature(anno, mese, giorno);
  }
}
