/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";

import {
  SANIFICAZIONE_COLONNE,
  VALORE_OK
} from "./registro-sanificazione-utils.js";

import {
  caricaSanificazioneMese,
  aggiornaValoreSanificazione,
  autoCompilaFinoOggi,
  creaIeriSeManca
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

  const datiMese =
    await caricaSanificazioneMese(anno, meseIndex + 1);

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
  const giorniNelMese =
    new Date(anno, meseIndex + 1, 0).getDate();

  const oggiISO =
    new Date().toISOString().split("T")[0];

  for (let g = 1; g <= giorniNelMese; g++) {

    const dataISO =
      `${anno}-${String(meseIndex+1).padStart(2,"0")}-${String(g).padStart(2,"0")}`;

    const dataLabel =
      `${String(g).padStart(2,"0")}/${String(meseIndex+1).padStart(2,"0")}/${anno}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${dataLabel}</td>`;

    SANIFICAZIONE_COLONNE.forEach(col => {

      let valore = "";

      if (col.gruppo === "sanificazione") {
        valore =
          datiMese[dataISO]?.sanificazione?.[col.id] ?? "";
      }

      if (col.gruppo === "infestanti") {
        valore =
          datiMese[dataISO]?.infestanti?.[col.id] ?? "";
      }

      const td = document.createElement("td");
      td.textContent = valore;
      td.className = "cella-spunta";

      /* 🔒 BLOCCO FUTURI */
      if (dataISO > oggiISO) {
        td.style.background = "#eee";
        td.style.cursor = "not-allowed";
      } else {

        td.style.cursor = "pointer";

        td.onclick = async () => {

          const attivo =
            td.textContent === VALORE_OK;

          td.textContent =
            attivo ? "" : VALORE_OK;

          await aggiornaValoreSanificazione({
            dataISO,
            gruppo: col.gruppo,
            campo: col.id,
            valore: !attivo
          });
        };
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }
}

/* =====================================================
   INIT
===================================================== */
initAuth(async () => {

  await creaIeriSeManca();     // giorno precedente
  await autoCompilaFinoOggi(); // buchi fino a oggi

  renderAnni();
});
