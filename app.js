/* =====================================================
   IMPORT
===================================================== */
import { initAuth } from "./auth.js";
import {
  salvaMovimento,
  caricaMovimenti,
  getUltimoFondoCassa,
  getUltimaSettimanaChiusa
} from "./firebase-db.js";
import { eliminaMovimento } from "./movimenti-actions.js";
import { initEntrate } from "./entrate.js";
import { initUscite } from "./uscite.js";
import { initFornitori } from "./fornitori.js";
import { initModificaPopup, apriPopupModifica } from "./modifica-popup.js";
import { initSalvaChiusuraCassa } from "./chiusura-cassa.js";

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

  let fondoCassaIniziale = 0;
  let movimenti = await caricaMovimenti();
  let settimanaAttiva = null;
  let settimanaFondo = null; // ✅ DICHIARATA CORRETTAMENTE

  // ✅ leggo fondo cassa ultima chiusura
  fondoCassaIniziale = await getUltimoFondoCassa();

  // ✅ leggo settimana chiusa (lunedi / sabato)
  settimanaFondo = await getUltimaSettimanaChiusa();

  // 🔧 NORMALIZZA LA SETTIMANA CHIUSA DA FIREBASE
if (settimanaFondo && settimanaFondo.lunedi) {
  settimanaFondo = {
    lunedi: new Date(settimanaFondo.lunedi.seconds * 1000),
    sabato: new Date(settimanaFondo.sabato.seconds * 1000)
  };
}


  console.log("DEBUG fondoCassaIniziale:", fondoCassaIniziale);
  console.log("DEBUG settimanaFondo:", settimanaFondo);



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
   POPUP CHIUSURA CASSA
===================== */
const btnChiusuraCassa = document.getElementById("btn-chiusura-cassa");
const popupChiusuraCassa = document.getElementById("popup-chiusura-cassa");
const chiudiChiusuraCassa = document.getElementById("chiudi-chiusura-cassa");
const annullaChiusuraCassa = document.getElementById("btn-annulla-chiusura");

/* =====================
   CAMPI CHIUSURA CASSA
===================== */
const ccContantiEffettivi = document.getElementById("cc-contanti-effettivi");
const ccVersamento = document.getElementById("cc-versamento");
const ccLorenzo = document.getElementById("cc-lorenzo");
const ccElisa = document.getElementById("cc-elisa");
const ccBonus = document.getElementById("cc-bonus");
const ccFondoCassa = document.getElementById("cc-fondo-cassa");

/* =====================
   CALCOLO FONDO CASSA
===================== */
function aggiornaFondoCassa() {
  const contanti = parseFloat(ccContantiEffettivi.value) || 0;

  // ⚠️ SOLO I VALORI BASE ENTRANO NEL FONDO CASSA
  const versamentoBase = parseFloat(ccVersamento.value) || 0;
  const lorenzoBase = parseFloat(ccLorenzo.value) || 0;
  const elisaBase = parseFloat(
    document.getElementById("cc-elisa").value
  ) || 0;

  const fondo =
    contanti -
    versamentoBase -
    lorenzoBase -
    elisaBase;

  ccFondoCassa.value = fondo.toFixed(2);
}


/* =====================
   LISTENER INPUT
===================== */
[ccVersamento, ccLorenzo, document.getElementById("cc-elisa")].forEach(input => {
  if (input) {
    input.addEventListener("input", aggiornaFondoCassa);
  }
});


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
  let saldoSettimanaCorrente = 0;
  let settimanaCorrenteChiusura = null;
 

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

function calcolaSettimanaAttiva() {

  // 1️⃣ se esiste una settimana chiusa → attiva la successiva
  if (settimanaFondo) {
    const lunediNuova = new Date(settimanaFondo.lunedi);
    lunediNuova.setDate(lunediNuova.getDate() + 7);
    lunediNuova.setHours(0,0,0,0);

    const sabatoNuova = new Date(lunediNuova);
    sabatoNuova.setDate(lunediNuova.getDate() + 5);
    sabatoNuova.setHours(23,59,59,999);

    return {
      lunedi: lunediNuova,
      sabato: sabatoNuova,
      haFondoCassa: true
    };
  }

  // 2️⃣ fallback: settimana corrente reale
  return {
    ...settimanaDaData(new Date()),
    haFondoCassa: false
  };
}


function settimanaSuccessiva({ lunedi }) {
  const next = new Date(lunedi);
  next.setDate(next.getDate() + 7);
  return settimanaDaData(next);
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
    console.log("SETTIMANA ATTIVA:", settimanaAttiva);

    caricaDettaglio(settimanaAttiva);

  };
}
/* =====================
   APERTURA POPUP CHIUSURA CASSA
===================== */
if (btnChiusuraCassa) {
 btnChiusuraCassa.onclick = () => {
  popupChiusuraCassa.classList.remove("hidden");

  const settimana = settimanaDaData(new Date());
  settimanaCorrenteChiusura = settimana;

  const inputContantiEffettivi =
    document.getElementById("cc-contanti-effettivi");

  if (inputContantiEffettivi) {
    inputContantiEffettivi.value =
      saldoSettimanaCorrente.toFixed(2);
  }
};

}


  /* =====================
     RIEPILOGO SETTIMANA HOME
  ===================== */
  function aggiornaRiepilogoSettimana() {
  if (!settimanaAttiva) {
  document
    .querySelector("#periodo-settimana")
    .closest(".card")
    .classList.add("hidden");
  return;
}

document
  .querySelector("#periodo-settimana")
  .closest(".card")
  .classList.remove("hidden");

const { lunedi, sabato } = settimanaAttiva;


  document.getElementById("periodo-settimana").textContent =
    `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

  let totaleContanti = 0;
  let totalePOS = 0;
  let totalePagamenti = 0;
  let saldoContanti = 0;

  // ✅ applica fondo cassa SOLO se settimana nuova
if (settimanaAttiva.haFondoCassa) {
  saldoContanti += fondoCassaIniziale;
  totaleContanti += fondoCassaIniziale;
}



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
    saldoSettimanaCorrente = saldoContanti;

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
// ✅ MOSTRA FONDO CASSA COME PRIMA RIGA
if (settimanaAttiva?.haFondoCassa) {
  const r = document.createElement("div");
  r.className = "pn-riga fondo-cassa";

  r.innerHTML = `
    <span>${formattaData(lunedi)}</span>
    <span>💰</span>
    <span>Fondo cassa iniziale</span>
    <span>€ ${fondoCassaIniziale.toFixed(2)}</span>
    <span></span>
  `;

  colEntrate.appendChild(r);

  // entra nel saldo ma NON è un movimento
  saldoContanti += fondoCassaIniziale;
  totaleContanti += fondoCassaIniziale;
}

  /* ===== FOOTER PRIMA NOTA ===== */
  totContantiPN.textContent = totaleContanti.toFixed(2);
  totPOSPN.textContent = totalePOS.toFixed(2);
  totUscitePN.textContent = totaleUscite.toFixed(2);
  saldoContantiPN.textContent = saldoContanti.toFixed(2);

  /* ✅ SALVA IL SALDO DELLA SETTIMANA VISUALIZZATA */
  saldoSettimanaCorrente = saldoContanti;
}

/* =====================
   CHIUSURA POPUP CHIUSURA CASSA
===================== */
function chiudiPopupChiusuraCassa() {
  popupChiusuraCassa.classList.add("hidden");
}

if (chiudiChiusuraCassa) {
  chiudiChiusuraCassa.onclick = chiudiPopupChiusuraCassa;
}

if (annullaChiusuraCassa) {
  annullaChiusuraCassa.onclick = chiudiPopupChiusuraCassa;
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
  initSalvaChiusuraCassa(() => settimanaDaData(new Date()));



  initModificaPopup({
    setMovimenti: m => (movimenti = m),
    aggiornaUI,
    caricaDettaglio,
    settimanaCorrente: () => settimanaDaData(new Date())
  });

  settimanaAttiva = calcolaSettimanaAttiva();


  aggiornaUI();
}
