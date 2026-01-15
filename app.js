import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

/* =====================
   FIREBASE CONFIG
===================== */
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


document.addEventListener("DOMContentLoaded", () => {

  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");
  const btnLogin = document.getElementById("btn-login");
  const loginError = document.getElementById("login-error");

  btnLogin.onclick = async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginError.style.display = "none";
    } catch (err) {
      loginError.textContent = "Email o password errate";
      loginError.style.display = "block";
    }
  };

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

  function inizializzaApp() {
    console.log("✅ Utente loggato, app avviata");
    // qui resta TUTTO il codice dell’app che avevi
  }
});

});


  /* =====================
     APP PRINCIPALE
  ===================== */
  function inizializzaApp() {

    console.log("✅ App inizializzata");

    /* =====================
       DATI (TEMP)
    ===================== */
    let movimenti = JSON.parse(localStorage.getItem("movimenti")) || [];

    /* =====================
       ELEMENTI
    ===================== */
    const btnEntrata = document.getElementById("btn-entrata");
    const btnUscita = document.getElementById("btn-uscita");

    const formEntrata = document.getElementById("form-entrata");
    const formUscita = document.getElementById("form-uscita");

    /* =====================
       MOSTRA / NASCONDI FORM
    ===================== */
    btnEntrata.addEventListener("click", () => {
      formEntrata.classList.remove("hidden");
      formUscita.classList.add("hidden");
    });

    btnUscita.addEventListener("click", () => {
      formUscita.classList.remove("hidden");
      formEntrata.classList.add("hidden");
    });

    /* =====================
       ENTRATE
    ===================== */
    let metodoEntrata = null;

    document.querySelectorAll(".btn-metodo").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-metodo").forEach(b => b.classList.remove("attivo"));
        btn.classList.add("attivo");
        metodoEntrata = btn.dataset.metodo;
      });
    });

    document.getElementById("form-entrata-dati").addEventListener("submit", e => {
      e.preventDefault();

      if (!metodoEntrata) {
        alert("Seleziona CONTANTI o POS");
        return;
      }

      movimenti.push({
        data: document.getElementById("data-entrata").value,
        tipo: "entrata",
        metodo: metodoEntrata,
        importo: Number(document.getElementById("importo-entrata").value)
      });

      localStorage.setItem("movimenti", JSON.stringify(movimenti));

      e.target.reset();
      metodoEntrata = null;
      document.querySelectorAll(".btn-metodo").forEach(b => b.classList.remove("attivo"));
      formEntrata.classList.add("hidden");
    });

    /* =====================
       USCITE
    ===================== */
    let tipoDocumento = null;

    document.querySelectorAll(".btn-doc").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-doc").forEach(b => b.classList.remove("attivo"));
        btn.classList.add("attivo");
        tipoDocumento = btn.dataset.doc;
      });
    });

    document.getElementById("form-uscita-dati").addEventListener("submit", e => {
      e.preventDefault();

      const data = document.getElementById("data-uscita").value;
      const fornitore = document.getElementById("fornitore-input").value.trim();
      const importo = Number(document.getElementById("importo-uscita").value);

      if (!data || !fornitore || !tipoDocumento) {
        alert("Compila tutti i campi");
        return;
      }

      movimenti.push({
        data,
        tipo: "uscita",
        fornitore,
        documento: tipoDocumento,
        importo
      });

      localStorage.setItem("movimenti", JSON.stringify(movimenti));

      e.target.reset();
      tipoDocumento = null;
      document.querySelectorAll(".btn-doc").forEach(b => b.classList.remove("attivo"));
      formUscita.classList.add("hidden");
    });
  }
});






