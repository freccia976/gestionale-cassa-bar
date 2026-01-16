/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";
import { salvaMovimento, caricaMovimenti } from "./firebase-db.js";
import { eliminaMovimento } from "./movimenti-actions.js";
import { modificaMovimento } from "./movimenti-actions.js";
import { initUscite } from "./uscite.js";
import { initFornitori } from "./fornitori.js";

import { initEntrate } from "./entrate.js";

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

  // 👉 Auth gestisce login / sessione
  initAuth(inizializzaApp);

  /* =====================================================
     APP
  ===================================================== */
  async function inizializzaApp() {

    /* =====================
       DATI
    ===================== */
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
    const listaDettaglio = document.getElementById("lista-dettaglio");
    const popupPeriodo = document.getElementById("popup-periodo");

    /* =====================
       POPUP MESE
    ===================== */
    const popupMese = document.getElementById("popup-mese");
    const chiudiPopupMese = document.getElementById("chiudi-popup-mese");
    const titoloMese = document.getElementById("titolo-mese");
    const listaSettimaneMese = document.getElementById("lista-settimane-mese");
    const btnExportMese = document.getElementById("export-mese");

    let meseCorrenteMovimenti = [];

    /* =====================
       UTILITY
    ===================== */
    const mesi = [
      "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
      "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
    ];

    function formattaData(d) {
      return new Date(d).toLocaleDateString("it-IT");
    }

    function settimanaDaData(data) {
      const d = new Date(data);
      const giorno = d.getDay();
      const diff = giorno === 0 ? -6 : 1 - giorno;

      const lunedi = new Date(d);
      lunedi.setDate(d.getDate() + diff);
      lunedi.setHours(0,0,0,0);

      const sabato = new Date(lunedi);
      sabato.setDate(lunedi.getDate() + 5);
      sabato.setHours(23,59,59,999);

      return { lunedi, sabato };
    }

    function calcolaSettimane(movs) {
      const out = [];
      movs.forEach(m => {
        const s = settimanaDaData(m.data);
        if (!out.some(x => x.lunedi.getTime() === s.lunedi.getTime())) {
          out.push(s);
        }
      });
      return out;
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
       RIEPILOGO SETTIMANA
    ===================== */
    function aggiornaRiepilogoSettimana() {
      const { lunedi, sabato } = settimanaDaData(new Date());

      document.getElementById("periodo-settimana").textContent =
        `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

      let contanti = 0, pos = 0, pagamenti = 0;

      movimenti.forEach(m => {
        const d = new Date(m.data);
        if (d >= lunedi && d <= sabato) {
          if (m.tipo === "entrata") {
            m.metodo === "contanti" ? contanti += m.importo : pos += m.importo;
          } else {
            pagamenti += m.importo;
          }
        }
      });

      document.getElementById("tot-contanti").textContent = contanti.toFixed(2);
      document.getElementById("tot-pos").textContent = pos.toFixed(2);
      document.getElementById("tot-pagamenti").textContent = pagamenti.toFixed(2);
      document.getElementById("saldo-contanti").textContent =
        (contanti - pagamenti).toFixed(2);
    }

    /* =====================
       DETTAGLIO SETTIMANA
    ===================== */
    btnDettaglio.onclick = () => {
      popupSettimana.classList.remove("hidden");
      caricaDettaglio(settimanaDaData(new Date()));
    };

    chiudiPopupSettimana.onclick = () =>
      popupSettimana.classList.add("hidden");

    function caricaDettaglio({ lunedi, sabato }) {
      listaDettaglio.innerHTML = "";
      popupPeriodo.textContent =
        `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

      movimenti
        .filter(m => {
          const d = new Date(m.data);
          return d >= lunedi && d <= sabato;
        })
        .forEach(m => {
  const li = document.createElement("li");

  let icona = "";
  let descrizione = "";

  if (m.tipo === "entrata") {
    if (m.metodo === "contanti") {
      icona = "💶";
      descrizione = "Entrata contanti";
    } else {
      icona = "💳";
      descrizione = "Entrata POS";
    }
  } else {
    if (m.documento === "fattura") {
      icona = "📄";
    } else {
      icona = "🧾";
    }

    descrizione = `Pagamento a ${m.fornitore}`;
    if (m.numeroDocumento) {
      descrizione += ` (Doc. ${m.numeroDocumento})`;
    }
  }

  li.innerHTML = `
    <div class="riga-movimento">
      <span>
        <strong>${icona}</strong>
        ${formattaData(m.data)}
        — <strong>€${m.importo.toFixed(2)}</strong><br>
        <small>${descrizione}</small>
      </span>

      <div class="azioni">
        <button class="btn-modifica">✏️</button>
        <button class="btn-elimina btn-danger">🗑️</button>
      </div>
    </div>
  `;

  // ELIMINA
  li.querySelector(".btn-elimina").onclick = async () => {
    await eliminaMovimento(m.id);
    movimenti = await caricaMovimenti();
    caricaDettaglio({ lunedi, sabato });
    aggiornaUI();
  };

  // MODIFICA
  li.querySelector(".btn-modifica").onclick = () => {
    apriPopupModifica(m);
  };

  listaDettaglio.appendChild(li);
});


}

const btnSalvaModifica = document.getElementById("btn-salva-modifica");

if (btnSalvaModifica) {
  btnSalvaModifica.onclick = async () => {
    const id = document.getElementById("mod-id").value;

    const datiAggiornati = {
      data: document.getElementById("mod-data").value,
      importo: +document.getElementById("mod-importo").value
    };

    await modificaMovimento(id, datiAggiornati);

    document.getElementById("popup-modifica").classList.add("hidden");

    movimenti = await caricaMovimenti();
    aggiornaUI();
    caricaDettaglio(settimanaDaData(new Date()));

  };
}
    /* =====================
       ARCHIVIO MENSILE
    ===================== */
    function costruisciArchivioMensile() {
      const cont = document.getElementById("lista-mesi");
      cont.innerHTML = "";

      const gruppi = {};
      movimenti.forEach(m => {
        const d = new Date(m.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(m);
      });

      Object.keys(gruppi).forEach(key => {
        const [anno, mese] = key.split("-");
        const box = document.createElement("div");
        box.className = "box-mese";
        box.textContent = `${mesi[mese]} ${anno}`;
        box.onclick = () => apriPopupMese(anno, mese, gruppi[key]);
        cont.appendChild(box);
      });
    }

    function apriPopupMese(anno, mese, movs) {
      popupMese.classList.remove("hidden");
      titoloMese.textContent = `${mesi[mese]} ${anno}`;
      listaSettimaneMese.innerHTML = "";
      meseCorrenteMovimenti = movs;

      calcolaSettimane(movs).forEach(s => {
        const btn = document.createElement("button");
        btn.textContent = `Settimana Lun ${s.lunedi.getDate()}`;
        btn.onclick = () => {
          popupMese.classList.add("hidden");
          popupSettimana.classList.remove("hidden");
          caricaDettaglio(s);
        };
        listaSettimaneMese.appendChild(btn);
      });
    }

    chiudiPopupMese.onclick = () =>
      popupMese.classList.add("hidden");

    /* =====================
       PDF MESE
    ===================== */
    btnExportMese.onclick = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text(titoloMese.textContent, 14, 15);
      let y = 25;

      meseCorrenteMovimenti.forEach(m => {
        doc.text(`${formattaData(m.data)} €${m.importo}`, 14, y);
        y += 7;
      });

      doc.save(`${titoloMese.textContent}.pdf`);
    };

    function aggiornaUI() {
      aggiornaRiepilogoSettimana();
      costruisciArchivioMensile();
    }

initEntrate({
  salvaMovimento,
  caricaMovimenti: async () => {
    movimenti = await caricaMovimenti();
  },
  aggiornaUI
});

initUscite({
  salvaMovimento,
  caricaMovimenti: async () => {
    movimenti = await caricaMovimenti();
  },
  aggiornaUI
});

initFornitori();



function apriPopupModifica(movimento) {
  const popup = document.getElementById("popup-modifica");
  popup.classList.remove("hidden");

  document.getElementById("mod-data").value = movimento.data;
  document.getElementById("mod-importo").value = movimento.importo;
  document.getElementById("mod-id").value = movimento.id;
}

    aggiornaUI();
  }
});
