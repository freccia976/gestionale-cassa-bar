import { initAuth } from "./auth.js";

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

function apriMese(anno, meseIndex, nomeMese) {
  titoloMese.textContent = `${nomeMese} ${anno}`;
  cardTabella.classList.remove("hidden");
  tbody.innerHTML = "";

  frigoriferi.forEach(frigo => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${frigo}</td>
      <td><input type="number" step="0.1" placeholder="°C"></td>
      <td><input type="number" step="0.1" placeholder="°C"></td>
    `;

    tbody.appendChild(tr);
  });

  console.log("REGISTRO APERTO:", anno, meseIndex + 1);
}

initAuth(() => {
  renderAnni();
});
