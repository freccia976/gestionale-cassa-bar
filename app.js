/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";
import { salvaMovimento, caricaMovimenti } from "./firebase-db.js";
import { eliminaMovimento } from "./movimenti-actions.js";
import { initEntrate } from "./entrate.js";
import { initUscite } from "./uscite.js";
import { initFornitori } from "./fornitori.js";
import {
  initModificaPopup,
  apriPopupModifica
} from "./modifica-popup.js";

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initAuth(inizializzaApp);
});

/* =====================================================
   APP
===================================================== */
async function inizializzaApp() {

  let movimenti = await caricaMovimenti();

  /* =====================
     ELEMENTI BASE
  ===================== */
  const btnEntrata = document.getElementById("btn-entrata");
  const btnUscita = document.getElementById("btn-uscita");
  const btnDettaglio = document.getElementById("btn-dettaglio");

  const formEntrata = document.getElementById("form-entrata");
  const formUscita = document.getElementById("form-uscita");

  /* =====================
     POPUP SETTIMANA
  ===================== */
  const popupSettimana = document.getElementById("popup-dettaglio");
  const chiudiPopupSettimana = document.getElementById("chiudi-popup");

  const colEntrate = document.getElementById("col-entrate");
  const colUscite = document.getElementById("col-uscite");

  const totEntratePN = document.getElementById("tot-entrate-pn");
  const totUscitePN = document.getElementById("tot-uscite-pn");

  const popupPeriodo = document.getElementById("popup-periodo");

  /* =====================
     UTILITY
  ===================== */
  function formattaData(d) {
    return new Date(d).toLocaleDateString("it-IT");
  }

  function settimanaDaData(data) {
    const d = new Date(data);
    const giorno = d.getDay();
    const diff = giorno === 0 ? -6 : 1 - giorno;

    const lunedi = new Date(d);
    lunedi.setDate(d.getDate() + diff);
    lunedi.setHours(0, 0, 0, 0);

    const sabato = new Date(lunedi);
    sabato.setDate(lunedi.getDate() + 5);
    sabato.setHours(23, 59, 59, 999);

    return { lunedi, sabato };
  }

  /* =====================
     MOSTRA FORM
  ===================== */
  btnEntrata.onclick = () => {
    formEntrata.classList.remove("hidden");
    formUscita.classList.add("hidden");
  };

  btnUscita.onclick = () => {
    formUscita.classList.remove("hidden");
    formEntrata.classList.add("hidden");
  };

  /* =====================
     DETTAGLIO SETTIMANA
  ===================== */
  btnDettaglio.onclick = () => {
    popupSettimana.classList.remove("hidden");
    caricaDettaglio(settimanaDaData(new Date()));
  };

  chiudiPopupSettimana.onclick = () => {
    popupSettimana.classList.add("hidden");
  };

  function caricaDettaglio({ lunedi, sabato }) {
  colEntrate.innerHTML = "";
  colUscite.innerHTML = "";

  let totContanti = 0;
  let totPOS = 0;
  let totUscite = 0;

  popupPeriodo.textContent =
    `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

  movimenti
    .filter(m => {
      const d = new Date(m.data);
      return d >= lunedi && d <= sabato;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach(m => {

      /* ================= ENTRATE ================= */
      if (m.tipo === "entrata") {
        const riga = document.createElement("div");
        riga.className = "pn-riga";

        const icona = m.metodo === "contanti" ? "💶" : "💳";

        if (m.metodo === "contanti") {
          totContanti += m.importo;
        } else {
          totPOS += m.importo;
        }

        riga.innerHTML = `
          <span class="pn-data">${formattaData(m.data)}</span>
          <span class="pn-icona">${icona}</span>
          <span class="pn-importo entrata">€ ${m.importo.toFixed(2)}</span>
          <span class="pn-azioni">
            <button class="btn-modifica">✏️</button>
            <button class="btn-elimina btn-danger">🗑️</button>
          </span>
        `;

        riga.querySelector(".btn-modifica").onclick = () => {
          apriPopupModifica(m);
        };

        riga.querySelector(".btn-elimina").onclick = async () => {
          await eliminaMovimento(m.id);
          movimenti = await caricaMovimenti();
          caricaDettaglio({ lunedi, sabato });
        };

        colEntrate.appendChild(riga);
      }

      /* ================= USCITE ================= */
      if (m.tipo === "uscita") {
        const riga = document.createElement("div");
        riga.className = "pn-riga";

        const icona = m.documento === "fattura" ? "📄" : "🧾";
        totUscite += m.importo;

        riga.innerHTML = `
          <span class="pn-data">${formattaData(m.data)}</span>
          <span class="pn-icona">${icona}</span>
          <span class="pn-desc">${m.fornitore || ""}</span>
          <span class="pn-importo uscita">€ ${m.importo.toFixed(2)}</span>
          <span class="pn-azioni">
            <button class="btn-modifica">✏️</button>
            <button class="btn-elimina btn-danger">🗑️</button>
          </span>
        `;

        riga.querySelector(".btn-modifica").onclick = () => {
          apriPopupModifica(m);
        };

        riga.querySelector(".btn-elimina").onclick = async () => {
          await eliminaMovimento(m.id);
          movimenti = await caricaMovimenti();
          caricaDettaglio({ lunedi, sabato });
        };

        colUscite.appendChild(riga);
      }
    });

  /* ================= TOTALI ================= */
  document.getElementById("tot-contanti-pn").textContent =
    totContanti.toFixed(2);

  document.getElementById("tot-pos-pn").textContent =
    totPOS.toFixed(2);

  document.getElementById("tot-uscite-pn").textContent =
    totUscite.toFixed(2);

  document.getElementById("saldo-contanti-pn").textContent =
    (totContanti - totUscite).toFixed(2);
}


  /* =====================
     INIT MODULI
  ===================== */
  initEntrate({
    salvaMovimento,
    caricaMovimenti: async () => (movimenti = await caricaMovimenti()),
    aggiornaUI: () => {}
  });

  initUscite({
    salvaMovimento,
    caricaMovimenti: async () => (movimenti = await caricaMovimenti()),
    aggiornaUI: () => {}
  });

  initFornitori();

  initModificaPopup({
    setMovimenti: m => (movimenti = m),
    aggiornaUI: () => {},
    caricaDettaglio,
    settimanaCorrente: () => settimanaDaData(new Date())
  });
}
