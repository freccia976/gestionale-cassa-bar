/* =====================================================
   FIREBASE IMPORTS (v9+ MODULAR)
===================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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
const db = getFirestore(firebaseApp);

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

  /* =====================
     LOGIN
  ===================== */
  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");
  const btnLogin = document.getElementById("btn-login");
  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");

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

  onAuthStateChanged(auth, user => {
    if (user) {
      loginBox.classList.add("hidden");
      appBox.classList.remove("hidden");
      inizializzaApp(user);
    } else {
      loginBox.classList.remove("hidden");
      appBox.classList.add("hidden");
    }
  });

  /* =====================================================
     APP
  ===================================================== */
  async function inizializzaApp(user) {

    /* =====================
       DATI
    ===================== */
    let movimenti = [];
    let fornitori = JSON.parse(localStorage.getItem("fornitori")) || [];

    /* =====================
       CARICA MOVIMENTI DA FIRESTORE
    ===================== */
    async function caricaMovimenti() {
      const ref = collection(db, "users", user.uid, "movimenti");
      const q = query(ref, orderBy("data", "asc"));
      const snap = await getDocs(q);
      movimenti = snap.docs.map(d => d.data());
    }

    await caricaMovimenti();

    /* =====================
       ELEMENTI BASE
    ===================== */
    const btnEntrata = document.getElementById("btn-entrata");
    const btnUscita = document.getElementById("btn-uscita");
    const btnDettaglio = document.getElementById("btn-dettaglio");

    const formEntrata = document.getElementById("form-entrata");
    const formUscita = document.getElementById("form-uscita");

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

    document.getElementById("form-entrata-dati").onsubmit = async e => {
      e.preventDefault();
      if (!metodoEntrata) return alert("Seleziona metodo");

      const nuovaEntrata = {
        data: document.getElementById("data-entrata").value,
        tipo: "entrata",
        metodo: metodoEntrata,
        importo: +document.getElementById("importo-entrata").value,
        createdAt: serverTimestamp()
      };

      await addDoc(
        collection(db, "users", user.uid, "movimenti"),
        nuovaEntrata
      );

      movimenti.push(nuovaEntrata);
      e.target.reset();
      metodoEntrata = null;
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
        cont.appendChild(box);
      });
    }

    function aggiornaUI() {
      aggiornaRiepilogoSettimana();
      costruisciArchivioMensile();
    }

    aggiornaUI();
  }
});





