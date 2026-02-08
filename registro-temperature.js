import { initAuth } from "./auth.js";

const listaAnni = document.getElementById("lista-anni");
const listaMesi = document.getElementById("lista-mesi");
const cardMesi = document.getElementById("card-mesi");
const titoloAnno = document.getElementById("titolo-anno");

const mesi = [
  "Gennaio", "Febbraio", "Marzo", "Aprile",
  "Maggio", "Giugno", "Luglio", "Agosto",
  "Settembre", "Ottobre", "Novembre", "Dicembre"
];

function renderAnni() {
  const anni = [2025, 2026]; // statici per ora

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

  mesi.forEach((nome, index) => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.textContent = nome;

    box.onclick = () => {
      console.log("ANNO:", anno, "MESE:", index + 1);
    };

    listaMesi.appendChild(box);
  });
}

initAuth(() => {
  renderAnni();
});
