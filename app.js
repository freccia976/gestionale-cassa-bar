/* =====================================================
   FIREBASE (v9+ MODULAR)
===================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

/* =====================================================
   FIREBASE CONFIG
===================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAuuwzai8Da1S9MsVmeQ78FdYFTffT6HSo",
  authDomain: "gestionale-cassa-bar.firebaseapp.com",
  projectId: "gestionale-cassa-bar",
  storageBucket: "gestionale-cassa-bar.firebasestorage.app",
  messagingSenderId: "680357723856",
  appId: "1:680357723856:web:4d84167fa82af2b395e8d5"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

  /* =====================
     LOGIN ELEMENTI
  ===================== */
  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");
  const btnLogin = document.getElementById("btn-login");
  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");

  /* =====================
     LOGIN
  ===================== */
  btnLogin.addEventListener("click", async () => {
    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Email o password errate");
    }
  });

  /* =====================
     SESSIONE
  ===================== */
  onAuthStateChanged(auth, user => {
    if (user) {
      loginBox.classList.add("hidden");
      appBox.classList.remove("hidden");
      inizializzaApp();
    } else {
      loginBox.classList.remove("hidden");
      appBox.classList.add("hidden");
    }
  });

  /* =====================================================
     APP
  ===================================================== */
  function inizializzaApp() {

    /* =====================
       DATI (LOCAL)
    ===================== */
    let movimenti = JSON.parse(localStorage.getItem("movimenti")) || [];

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
       ENTRATA
    ===================== */
    let metodoEntrata = null;

    document.querySelectorAll(".btn-metodo").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".btn-metodo").forEach(b => b.classList.remove("attivo"));
        btn.classList.add("attivo");
        metodoEntrata = btn.dataset.metodo;
      };
    });

    document.getElementById("form-entrata-dati").onsubmit = e => {
      e.preventDefault();
      if (!metodoEntrata) return alert("Seleziona metodo");

      movimenti.push({
        data: document.getElementById("data-entrata").value,
        tipo: "entrata",
        metodo: metodoEntrata,
        importo: +document.getElementById("importo-entrata").value
      });

      localStorage.setItem("movimenti", JSON.stringify(movimenti));
      e.target.reset();
      metodoEntrata = null;
      aggiornaUI();
    };

    /* =====================
       USCITA
    ===================== */
    let tipoDocumento = null;

    document.querySelectorAll(".btn-doc").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".btn-doc").forEach(b => b.classList.remove("attivo"));
        btn.classList.add("attivo");
        tipoDocumento = btn.dataset.doc;
      };
    });

    document.getElementById("form-uscita-dati").onsubmit = e => {
      e.preventDefault();

      movimenti.push({
        data: document.getElementById("data-uscita").value,
        tipo: "uscita",
        fornitore: document.getElementById("fornitore-input").value,
        documento: tipoDocumento,
        importo: +document.getElementById("importo-uscita").value
      });

      localStorage.setItem("movimenti", JSON.stringify(movimenti));
      e.target.reset();
      aggiornaUI();
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
          li.textContent =
            `${formattaData(m.data)} - €${m.importo.toFixed(2)}`;
          listaDettaglio.appendChild(li);
        });
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

    aggiornaUI();
  }
});






