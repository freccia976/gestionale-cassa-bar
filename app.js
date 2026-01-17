/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";
import { salvaMovimento, caricaMovimenti } from "./firebase-db.js";
import { eliminaMovimento } from "./movimenti-actions.js";
import { initEntrate } from "./entrate.js";
import { initUscite } from "./uscite.js";
import { initFornitori } from "./fornitori.js";
import { initModificaPopup, apriPopupModifica } from "./modifica-popup.js";

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
     POPUP SETTIMANA (PRIMA NOTA)
  ===================== */
  const popupSettimana = document.getElementById("popup-dettaglio");
  const chiudiPopupSettimana = document.getElementById("chiudi-popup");
  const popupPeriodo = document.getElementById("popup-periodo");

  const colEntrate = document.getElementById("col-entrate");
  const colUscite = document.getElementById("col-uscite");
/* =====================
   CHIUSURA POPUP SETTIMANA
===================== */
if (chiudiPopupSettimana) {
  chiudiPopupSettimana.onclick = () => {
    popupSettimana.classList.add("hidden");
  };
}

  /* =====================
     TOTALI PRIMA NOTA
  ===================== */
  const totContantiPN = document.getElementById("tot-contanti-pn");
  const totPOSPN = document.getElementById("tot-pos-pn");
  const totUscitePN = document.getElementById("tot-uscite-pn");
  const saldoContantiPN = document.getElementById("saldo-contanti-pn");

  /* =====================
     POPUP MESE
  ===================== */
  const popupMese = document.getElementById("popup-mese");
  const chiudiPopupMese = document.getElementById("chiudi-popup-mese");
  const titoloMese = document.getElementById("titolo-mese");
  const listaSettimaneMese = document.getElementById("lista-settimane-mese");

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
   APERTURA DETTAGLIO SETTIMANA
===================== */
if (btnDettaglio) {
  btnDettaglio.onclick = () => {
    popupSettimana.classList.remove("hidden");
    caricaDettaglio(settimanaDaData(new Date()));
  };
}

  /* =====================
     RIEPILOGO SETTIMANA HOME
  ===================== */
  function aggiornaRiepilogoSettimana() {
  const { lunedi, sabato } = settimanaDaData(new Date());

  document.getElementById("periodo-settimana").textContent =
    `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

  let totaleContanti = 0;
  let totalePOS = 0;
  let totalePagamenti = 0;
  let saldoContanti = 0;

  movimenti.forEach(m => {
    const d = new Date(m.data);
    if (d >= lunedi && d <= sabato) {

      if (m.tipo === "entrata") {
        if (m.metodo === "contanti") {
          totaleContanti += m.importo;
          saldoContanti += m.importo;
        } else {
          totalePOS += m.importo;
        }
      }

      if (m.tipo === "uscita") {
  totalePagamenti += m.importo;

  const quotaContanti =
    m.quotaContanti !== undefined
      ? m.quotaContanti
      : m.importo;

  saldoContanti -= quotaContanti;
}

    }
  });

  document.getElementById("tot-contanti").textContent =
    totaleContanti.toFixed(2);

  document.getElementById("tot-pos").textContent =
    totalePOS.toFixed(2);

  document.getElementById("tot-pagamenti").textContent =
    totalePagamenti.toFixed(2);

  document.getElementById("saldo-contanti").textContent =
    saldoContanti.toFixed(2);
}


  /* =====================
     PRIMA NOTA SETTIMANALE
  ===================== */
  function caricaDettaglio({ lunedi, sabato }) {
  colEntrate.innerHTML = "";
  colUscite.innerHTML = "";

  let totaleContanti = 0;
  let totalePOS = 0;
  let totaleUscite = 0;
  let saldoContanti = 0;

  popupPeriodo.textContent =
    `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

  movimenti
    .filter(m => {
      const d = new Date(m.data);
      return d >= lunedi && d <= sabato;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .forEach(m => {

      /* ===== ENTRATE ===== */
      if (m.tipo === "entrata") {
        const r = document.createElement("div");
        r.className = "pn-riga";

        const icona = m.metodo === "contanti" ? "💶" : "💳";

        if (m.metodo === "contanti") {
          totaleContanti += m.importo;
          saldoContanti += m.importo;
        } else {
          totalePOS += m.importo;
        }

        r.innerHTML = `
          <span>${formattaData(m.data)}</span>
          <span>${icona}</span>
          <span>€ ${m.importo.toFixed(2)}</span>
          <span>
            <button class="btn-modifica">✏️</button>
            <button class="btn-elimina btn-danger">🗑️</button>
          </span>
        `;

        r.querySelector(".btn-modifica").onclick = () => apriPopupModifica(m);
        r.querySelector(".btn-elimina").onclick = async () => {
          await eliminaMovimento(m.id);
          movimenti = await caricaMovimenti();
          caricaDettaglio({ lunedi, sabato });
          aggiornaUI();
        };

        colEntrate.appendChild(r);
      }

      /* ===== USCITE ===== */
      if (m.tipo === "uscita") {
        const r = document.createElement("div");
        r.className = "pn-riga";

        totaleUscite += m.importo;

const quotaContanti =
  m.quotaContanti !== undefined
    ? m.quotaContanti
    : m.importo;

saldoContanti -= quotaContanti;


        const icona = m.documento === "fattura" ? "📄" : "🧾";

        r.innerHTML = `
          <span>${formattaData(m.data)}</span>
          <span>${icona}</span>
          <span>${m.fornitore || ""}</span>
          <span>€ ${m.importo.toFixed(2)}</span>
          <span>
            <button class="btn-modifica">✏️</button>
            <button class="btn-elimina btn-danger">🗑️</button>
          </span>
        `;

        r.querySelector(".btn-modifica").onclick = () => apriPopupModifica(m);
        r.querySelector(".btn-elimina").onclick = async () => {
          await eliminaMovimento(m.id);
          movimenti = await caricaMovimenti();
          caricaDettaglio({ lunedi, sabato });
          aggiornaUI();
        };

        colUscite.appendChild(r);
      }
    });

  /* ===== FOOTER ===== */
  totContantiPN.textContent = totaleContanti.toFixed(2);
  totPOSPN.textContent = totalePOS.toFixed(2);
  totUscitePN.textContent = totaleUscite.toFixed(2);
  saldoContantiPN.textContent = saldoContanti.toFixed(2);
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
     UI UPDATE
  ===================== */
  function aggiornaUI() {
    aggiornaRiepilogoSettimana();
    costruisciArchivioMensile();
  }

  /* =====================
     INIT MODULI
  ===================== */
  initEntrate({
    salvaMovimento,
    caricaMovimenti: async () => {
      movimenti = await caricaMovimenti();
      aggiornaUI();
    },
    aggiornaUI
  });

  initUscite({
    salvaMovimento,
    caricaMovimenti: async () => {
      movimenti = await caricaMovimenti();
      aggiornaUI();
    },
    aggiornaUI
  });

  initFornitori();

  initModificaPopup({
    setMovimenti: m => (movimenti = m),
    aggiornaUI,
    caricaDettaglio,
    settimanaCorrente: () => settimanaDaData(new Date())
  });

  aggiornaUI();
}
