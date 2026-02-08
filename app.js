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
import { generaPDFSettimana } from "./pdf-settimana.js";
import { getChiusuraBySettimana } from "./firebase-db.js";
import { caricaChiusureSettimanali } from "./firebase-db.js";
import { generaPDFMese } from "./pdf-mese.js";
import { generaPDFFiltro } from "./pdf-filtro.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser } from "./firebase-db.js";

const db = getFirestore();



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
  let chiusureSettimanali = [];
 chiusureSettimanali = await caricaChiusureSettimanali();
 console.log("DEBUG chiusureSettimanali:", chiusureSettimanali);

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
const bannerTasse = document.getElementById("banner-tasse");
const listaTasseScadenza = document.getElementById("lista-tasse-scadenza");




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
  let totaliSettimanaCorrente = {
  totaleContanti: 0,
  totalePOS: 0,
  totaleUscite: 0
};

  let settimanaCorrenteChiusura = null;
  /* =====================
     POPUP FILTRO PDF
  ===================== */
const popupPdfFiltro = document.getElementById("popup-pdf-filtro");
const btnApriPdfFiltro = document.getElementById("export-pdf-filtro");
const btnChiudiPdfFiltro = document.getElementById("chiudi-pdf-filtro");
const filtroDettaglioUscite = document.getElementById("filtro-dettaglio-uscite");
const bloccoFornitore = document.getElementById("blocco-fornitore");
const pdfMesiBox = document.getElementById("pdf-mesi");
const pdfSezioniBox = document.getElementById("pdf-sezioni");
const pdfFornitoriBox = document.getElementById("pdf-fornitori");
const bloccoFornitori = document.getElementById("blocco-fornitori");
const btnGeneraPdfFiltro = document.getElementById("btn-genera-pdf-filtro");



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

function stessaSettimana(a, b) {
  if (!a || !b) return false;
  return (
    a.lunedi.getTime() === b.lunedi.getTime() &&
    a.sabato.getTime() === b.sabato.getTime()
  );
}

function calcolaTotaliMensili(chiusureMese) {
  let totaleContanti = 0;
  let totalePOS = 0;
  let totaleUscite = 0;
  let saldoContanti = 0;

  chiusureMese.forEach(c => {
    totaleContanti += c.totaleContantiSettimana || 0;
    totalePOS += c.totalePOSSettimana || 0;
    totaleUscite += c.totaleUsciteSettimana || 0;
  });

  // saldo = ultimo fondo cassa del mese
  if (chiusureMese.length) {
    const ultima = chiusureMese
      .sort((a, b) =>
        a.settimana.lunedi.seconds - b.settimana.lunedi.seconds
      )
      .at(-1);

    saldoContanti = ultima.fondoCassa || 0;
  }

  return {
    totaleContanti,
    totalePOS,
    totaleUscite,
    saldoContanti
  };
}
function toggleBox(el) {
  el.classList.toggle("attivo");
}
function popolaMesiPDF(chiusureSettimanali) {
  pdfMesiBox.innerHTML = "";

  const mesiMap = new Map();

  chiusureSettimanali.forEach(c => {
    const d = c.settimana.lunedi.seconds
      ? new Date(c.settimana.lunedi.seconds * 1000)
      : new Date(c.settimana.lunedi);

    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!mesiMap.has(key)) {
      mesiMap.set(key, {
        anno: d.getFullYear(),
        mese: d.getMonth()
      });
    }
  });

  mesiMap.forEach(({ anno, mese }) => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.dataset.anno = anno;
    box.dataset.mese = mese;
    box.textContent = `${mesi[mese]} ${anno}`;

    box.onclick = () => toggleBox(box);

    pdfMesiBox.appendChild(box);
  });
}
pdfSezioniBox.querySelectorAll(".box-toggle").forEach(box => {
  box.onclick = () => {
    toggleBox(box);

    // mostra fornitori solo se dettaglio uscite è attivo
    if (box.dataset.sezione === "dettaglio-uscite") {
      if (box.classList.contains("attivo")) {
        bloccoFornitori.classList.remove("hidden");
      } else {
        bloccoFornitori.classList.add("hidden");
      }
    }
  };
});
function popolaFornitoriPDF(movimenti) {
  pdfFornitoriBox.innerHTML = "";

  const fornitori = [
    ...new Set(
      movimenti
        .filter(m => m.tipo === "uscita" && m.fornitore)
        .map(m => m.fornitore)
    )
  ];

  fornitori.forEach(nome => {
    const box = document.createElement("div");
    box.className = "box-toggle";
    box.dataset.fornitore = nome;
    box.textContent = nome;

    box.onclick = () => toggleBox(box);

    pdfFornitoriBox.appendChild(box);
  });
}

async function caricaTasseInScadenza() {
  const snapshot = await getDocs(
    collection(db, "users", getCurrentUser().uid, "tasse")
  );

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const tra7Giorni = new Date(oggi);
  tra7Giorni.setDate(oggi.getDate() + 7);

  const tasseDaMostrare = [];

  snapshot.forEach(docSnap => {
    const t = docSnap.data();

    if (t.stato !== "DA_PAGARE") return;
    if (!t.dataPagamento) return;

    const scadenza = new Date(t.dataPagamento);
    scadenza.setHours(0, 0, 0, 0);

    if (scadenza <= tra7Giorni) {
      tasseDaMostrare.push({
        id: docSnap.id,
        ...t,
        scadenza
      });
    }
  });

  if (!tasseDaMostrare.length) {
    bannerTasse.classList.add("hidden");
    listaTasseScadenza.innerHTML = "";
    return;
  }

  bannerTasse.classList.remove("hidden");
  listaTasseScadenza.innerHTML = "";

  tasseDaMostrare
    .sort((a, b) => a.scadenza - b.scadenza)
    .forEach(t => {
      const riga = document.createElement("div");
      riga.className = "tassa-scadenza";

      const scaduta = t.scadenza < oggi;

      riga.innerHTML = `
        <div class="titolo ${scaduta ? "scaduta" : "in-scadenza"}">
          ${scaduta ? "🚨 SCADUTA" : "⏰ IN SCADENZA"} – ${t.tipo}
        </div>
        <div class="meta">
          ${t.soggetto} • ${t.scadenza.toLocaleDateString("it-IT")} • € ${t.importo.toFixed(2)}
        </div>
      `;

      riga.onclick = () => {
        window.location.href = `tasse.html?modifica=${t.id}`;
      };

      listaTasseScadenza.appendChild(riga);
    });
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
  aggiornaRiepilogoSettimana(); // 🔑 forza il ricalcolo dei totali

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
    totaliSettimanaCorrente = {
  totaleContanti,
  totalePOS,
  totaleUscite: totalePagamenti
};


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

  // ✅ FONDO CASSA SOLO SE È LA SETTIMANA ATTIVA
  const isSettimanaAttiva =
    stessaSettimana({ lunedi, sabato }, settimanaAttiva);

  if (isSettimanaAttiva && settimanaAttiva.haFondoCassa) {
    const r = document.createElement("div");
    r.className = "pn-riga fondo-cassa";
    r.innerHTML = `
      <span></span>
      <span>💰</span>
      <span>Fondo cassa iniziale</span>
      <span>€ ${fondoCassaIniziale.toFixed(2)}</span>
      <span></span>
    `;
    colEntrate.appendChild(r);

    saldoContanti += fondoCassaIniziale;
    totaleContanti += fondoCassaIniziale;
  }

  popupPeriodo.textContent =
    `(Lun ${lunedi.getDate()} - Sab ${sabato.getDate()})`;

 movimenti
  .map(m => ({
    ...m,
    _data: m.data?.seconds
      ? new Date(m.data.seconds * 1000)
      : new Date(m.data)
  }))
  .filter(m => m._data >= lunedi && m._data <= sabato)
  .sort((a, b) => a._data - b._data)
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
          <span>${formattaData(m._data)}</span>
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
          <span>${formattaData(m._data)}</span>
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

    // 🔹 Bottone PDF mensile
const btnExport = document.getElementById("export-mese");

btnExport.onclick = () => {
  const chiusureMese = chiusureSettimanali.filter(c => {
    let d;

    if (c.settimana.lunedi instanceof Date) {
      d = c.settimana.lunedi;
    } else if (c.settimana.lunedi?.seconds) {
      d = new Date(c.settimana.lunedi.seconds * 1000);
    } else {
      return false;
    }

    return (
      d.getMonth() === Number(mese) &&
      d.getFullYear() === Number(anno)
    );
  });

  if (!chiusureMese.length) {
    alert("Nessuna settimana chiusa in questo mese");
    return;
  }

  generaPDFMese({
    anno: Number(anno),
    mese: mesi[Number(mese)],
    chiusureMese
  });
};



   calcolaSettimane(movs).forEach(s => {
  const wrapper = document.createElement("div");
  wrapper.className = "riga-settimana";

  // recupera solo le chiusure del mese
const chiusureMese = chiusureSettimanali.filter(c => {
  const d = new Date(c.settimana.lunedi.seconds * 1000);
  return d.getMonth() == mese && d.getFullYear() == anno;
});

const totali = calcolaTotaliMensili(chiusureMese);

document.getElementById("mese-contanti").textContent =
  totali.totaleContanti.toFixed(2);

document.getElementById("mese-pagamenti").textContent =
  totali.totaleUscite.toFixed(2);

document.getElementById("mese-saldo").textContent =
  totali.saldoContanti.toFixed(2);

  document.getElementById("mese-pos").textContent =
  totali.totalePOS.toFixed(2);


  // 🔹 BOTTONE APRI SETTIMANA
  const btnApri = document.createElement("button");
  btnApri.textContent = `📘 Settimana Lun ${s.lunedi.getDate()}`;
  btnApri.onclick = () => {
    popupMese.classList.add("hidden");
    popupSettimana.classList.remove("hidden");
    caricaDettaglio(s);
  };

  // 🔹 BOTTONE PDF SETTIMANA
  const btnPdf = document.createElement("button");
  btnPdf.textContent = "🧾 PDF";
  btnPdf.className = "btn-pdf";

btnPdf.onclick = async () => {
  const movsSettimana = movs.filter(m => {
    const d = m.data?.seconds
      ? new Date(m.data.seconds * 1000)
      : new Date(m.data);
    return d >= s.lunedi && d <= s.sabato;
  });

  const isSettimanaAttiva =
    settimanaAttiva &&
    s.lunedi.getTime() === settimanaAttiva.lunedi.getTime();

  const chiusura = await getChiusuraBySettimana(s);

  generaPDFSettimana({
    settimana: s,
    movimenti: movsSettimana,
    fondoCassaIniziale: isSettimanaAttiva ? fondoCassaIniziale : 0,
    chiusura: chiusura
  });
};


  wrapper.appendChild(btnApri);
  wrapper.appendChild(btnPdf);
  listaSettimaneMese.appendChild(wrapper);
});

  }

  chiudiPopupMese.onclick = () =>
    popupMese.classList.add("hidden");


if (btnApriPdfFiltro) {
 btnApriPdfFiltro.onclick = () => {
  popupPdfFiltro.classList.remove("hidden");

  popolaMesiPDF(chiusureSettimanali);
  popolaFornitoriPDF(movimenti);
};

}
if (btnChiudiPdfFiltro) {
  btnChiudiPdfFiltro.onclick = () => {
    popupPdfFiltro.classList.add("hidden");
  };
}
if (filtroDettaglioUscite) {
  filtroDettaglioUscite.onchange = () => {
    if (filtroDettaglioUscite.checked) {
      bloccoFornitore.classList.remove("hidden");
    } else {
      bloccoFornitore.classList.add("hidden");
    }
  };
}

const mesiNomi = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre"
];

/* =====================
   PDF FILTRO – COSTRUZIONE FILTRO
===================== */
if (btnGeneraPdfFiltro) {
  btnGeneraPdfFiltro.onclick = () => {

    /* ===== MESI SELEZIONATI ===== */
    const mesi = [
      ...document.querySelectorAll("#pdf-mesi .box-toggle.attivo")
    ].map(box => ({
      anno: parseInt(box.dataset.anno),
      mese: parseInt(box.dataset.mese)
    }));

    if (!mesi.length) {
      alert("Seleziona almeno un mese");
      return;
    }

    /* ===== SEZIONI SELEZIONATE ===== */
    const sezioni = {};
    document
      .querySelectorAll("#pdf-sezioni .box-toggle")
      .forEach(box => {
        sezioni[box.dataset.sezione] =
          box.classList.contains("attivo");
      });

    /* ===== FORNITORI SELEZIONATI ===== */
    let fornitori = [];
    if (sezioni["dettaglio-uscite"]) {
      fornitori = [
        ...document.querySelectorAll("#pdf-fornitori .box-toggle.attivo")
      ].map(box => box.dataset.fornitore);

      if (!fornitori.length) {
        alert("Seleziona almeno un fornitore");
        return;
      }
    }

    /* ===== OGGETTO FILTRO ===== */
    const filtroPDF = { mesi, sezioni, fornitori };
    console.log("FILTRO PDF:", filtroPDF);

    /* =====================
       FILTRO CHIUSURE SETTIMANALI
    ===================== */
    const chiusureFiltrate = chiusureSettimanali.filter(c => {
      const d = c.settimana.lunedi?.seconds
        ? new Date(c.settimana.lunedi.seconds * 1000)
        : new Date(c.settimana.lunedi);

      return mesi.some(
        m => d.getFullYear() === m.anno && d.getMonth() === m.mese
      );
    });

    console.log("CHIUSURE FILTRATE:", chiusureFiltrate);

    /* =====================
       FILTRO USCITE (DETTAGLIO)
    ===================== */
    let usciteFiltrate = [];

    if (sezioni["dettaglio-uscite"]) {
      usciteFiltrate = movimenti.filter(m => {
        if (m.tipo !== "uscita") return false;
        if (!m.fornitore) return false;

        const d = new Date(m.data);

        const meseValido = mesi.some(
          mm => d.getFullYear() === mm.anno && d.getMonth() === mm.mese
        );

        return meseValido && fornitori.includes(m.fornitore);
      });
    }

    console.log("USCITE FILTRATE:", usciteFiltrate);

    /* =====================
       CALCOLO TOTALI
    ===================== */
    const totali = {
      contanti: 0,
      pos: 0,
      uscite: 0,
      versamenti: 0,
      lorenzo: 0,
      elisa: 0
    };

    chiusureFiltrate.forEach(c => {
      if (sezioni.contanti)
        totali.contanti += c.totaleContantiSettimana || 0;

      if (sezioni.pos)
        totali.pos += c.totalePOSSettimana || 0;

      if (sezioni.uscite)
        totali.uscite += c.totaleUsciteSettimana || 0;

      if (sezioni.versamenti)
        totali.versamenti += c.versamento || 0;

      if (sezioni.lorenzo)
        totali.lorenzo += c.lorenzo || 0;

      if (sezioni.elisa)
        totali.elisa += c.elisa || 0;
    });

    console.log("TOTALI AGGREGATI:", totali);

    /* =====================
       TOTALI PER FORNITORE
    ===================== */
    const totaliFornitori = {};

    usciteFiltrate.forEach(u => {
      if (!totaliFornitori[u.fornitore]) {
        totaliFornitori[u.fornitore] = {
          totale: 0,
          righe: []
        };
      }

      totaliFornitori[u.fornitore].totale += u.importo;
      totaliFornitori[u.fornitore].righe.push(u);
    });

    console.log("TOTALI FORNITORI:", totaliFornitori);

    /* =====================
       GENERAZIONE PDF
    ===================== */
    const mesiLabel = filtroPDF.mesi.map(m => ({
  nome: `${mesiNomi[m.mese]} ${m.anno}`
}));


    generaPDFFiltro({
      mesi: mesiLabel,
      sezioni: filtroPDF.sezioni,
      totali,
      totaliFornitori
    });
  };
}


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
    aggiornaRiepilogoSettimana(); // 🔑
    aggiornaUI();
  },
  aggiornaUI
});


initUscite({
  salvaMovimento,
  caricaMovimenti: async () => {
    movimenti = await caricaMovimenti();
    aggiornaRiepilogoSettimana(); // 🔑
    aggiornaUI();

    // 🔁 SE IL DETTAGLIO È APERTO, RICARICA
    if (!popupSettimana.classList.contains("hidden")) {
      caricaDettaglio(settimanaAttiva);
    }
  },
  aggiornaUI
});


  initFornitori();
  initSalvaChiusuraCassa(() => settimanaDaData(new Date()), () => ({
  ...totaliSettimanaCorrente,
  saldoContanti: saldoSettimanaCorrente
}));




  initModificaPopup({
    setMovimenti: m => (movimenti = m),
    aggiornaUI,
    caricaDettaglio,
    settimanaCorrente: () => settimanaDaData(new Date())
  });

  settimanaAttiva = calcolaSettimanaAttiva();


  aggiornaUI();
  caricaTasseInScadenza();

}
const btnTasse = document.getElementById("btn-tasse");

if (btnTasse) {
  btnTasse.onclick = () => {
    window.location.href = "tasse.html";
  };
}
