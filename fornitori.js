/* =====================================================
   FORNITORI
===================================================== */
import {
  caricaFornitori,
  salvaFornitore
} from "./firebase-db.js";

/* =====================================================
   INIT FORNITORI
===================================================== */
export async function initFornitori() {
  const inputFornitore = document.getElementById("fornitore-input");
  const datalist = document.getElementById("lista-fornitori");

  if (!inputFornitore || !datalist) return;

  // carica fornitori esistenti
  let fornitori = await caricaFornitori();
  aggiornaDatalist(fornitori);

  // quando esco dal campo → salvo se nuovo
  inputFornitore.addEventListener("blur", async () => {
    const nome = inputFornitore.value.trim();
    if (!nome) return;

    const esiste = fornitori.some(
      f => f.nome.toLowerCase() === nome.toLowerCase()
    );

    if (!esiste) {
      await salvaFornitore(nome);
      fornitori = await caricaFornitori();
      aggiornaDatalist(fornitori);
    }
  });

  function aggiornaDatalist(lista) {
    datalist.innerHTML = "";
    lista.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.nome;
      datalist.appendChild(opt);
    });
  }
}
