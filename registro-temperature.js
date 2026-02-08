import { initAuth } from "./auth.js";

const listaAnni = document.getElementById("lista-anni");

function renderAnni() {
  const anni = [2025, 2026]; // statici per ora

  listaAnni.innerHTML = "";

  anni.forEach(anno => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.textContent = `📁 ${anno}`;

    box.onclick = () => {
      console.log("CLICCATO ANNO:", anno);
    };

    listaAnni.appendChild(box);
  });
}

initAuth(() => {
  renderAnni();
});
