document.addEventListener("DOMContentLoaded", () => {

  /* =====================
     FIREBASE AUTH
  ===================== */
  const auth = window.firebaseAuth;

  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");

  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");
  const btnLogin = document.getElementById("btn-login");

  // LOGIN
  btnLogin.onclick = async () => {
    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      alert("Errore login: " + err.message);
    }
  };

  // CONTROLLO SESSIONE
  auth.onAuthStateChanged(user => {
    if (user) {
      loginBox.classList.add("hidden");
      appBox.classList.remove("hidden");
      inizializzaApp();
    } else {
      loginBox.classList.remove("hidden");
      appBox.classList.add("hidden");
    }
  });

  /* =====================
     APP
  ===================== */
  function inizializzaApp() {

    /* =====================
       DATI (TEMPORANEI)
    ===================== */
    let movimenti = JSON.parse(localStorage.getItem("movimenti")) || [];
    let fornitori = JSON.parse(localStorage.getItem("fornitori")) || [];

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
    const btnExportSettimana = document.getElementById("export-settimana");

    let meseCorrenteMovimenti = [];
    let settimanaSelezionata = null;

    /* =====================
       UTILITY
    ===================== */
    function formattaData(dataISO) {
      return new Date(dataISO).toLocaleDateString("it-IT");
    }

    function nomeMese(i) {
      return [
        "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
        "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
      ][i];
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
      const settimane = [];
      movs.forEach(m => {
        const s = settimanaDaData(m.data);
        if (!settimane.some(x => x.lunedi.getTime() === s.lunedi.getTime())) {
          settimane.push(s);
        }
      });
      return settimane.sort((a,b) => a.lunedi - b.lunedi);
    }

    /* =====================
       MOSTRA / NASCONDI FORM
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
       ENTRATE
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
      if (!metodoEntrata) return alert("Seleziona CONTANTI o POS");

      movimenti.push({
        data: document.getElementById("data-entrata").value,
        tipo: "entrata",
        metodo: metodoEntrata,
        importo: +document.getElementById("importo-entrata").value
      });

      localStorage.setItem("movimenti", JSON.stringify(movimenti));
      e.target.reset();
      metodoEntrata = null;
      document.querySelectorAll(".btn-metodo").forEach(b => b.classList.remove("attivo"));
      formEntrata.classList.add("hidden");
      aggiornaUI();
    };

    /* =====================
       USCITE
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

      const data = document.getElementById("data-uscita").value;
      const fornitore = document.getElementById("fornitore-input").value.trim();
      const importo = +document.getElementById("importo-uscita").value;

      if (!data || !fornitore || !tipoDocumento) {
        return alert("Compila tutti i campi");
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
      aggiornaUI();
    };

    /* =====================
       POPUP SETTIMANA
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
        `Da Lun ${lunedi.getDate()} a Sab ${sabato.getDate()}`;

      movimenti
        .filter(m => {
          const d = new Date(m.data);
          return d >= lunedi && d <= sabato;
        })
        .sort((a,b) => new Date(a.data) - new Date(b.data))
        .forEach(m => {
          const icona =
            m.tipo === "uscita"
              ? "📤"
              : m.metodo === "contanti" ? "💶" : "💳";

          const li = document.createElement("li");
          li.textContent =
            `${formattaData(m.data)} | ${icona} ${m.fornitore || ""} | €${m.importo.toFixed(2)}`;

          listaDettaglio.appendChild(li);
        });
    }

    /* =====================
       ARCHIVIO MENSILE
    ===================== */
    function costruisciArchivioMensile() {
      const contenitore = document.getElementById("lista-mesi");
      contenitore.innerHTML = "";

      const gruppi = {};
      movimenti.forEach(m => {
        const d = new Date(m.data);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!gruppi[key]) gruppi[key] = [];
        gruppi[key].push(m);
      });

      Object.keys(gruppi).sort().reverse().forEach(key => {
        const [anno, mese] = key.split("-");
        const box = document.createElement("div");
        box.className = "box-mese";
        box.textContent = `${nomeMese(+mese)} ${anno}`;
        box.onclick = () => apriPopupMese(+anno, +mese, gruppi[key]);
        contenitore.appendChild(box);
      });
    }

    function apriPopupMese(anno, mese, movimentiMese) {
      popupMese.classList.remove("hidden");
      titoloMese.textContent = `${nomeMese(mese)} ${anno}`;
      listaSettimaneMese.innerHTML = "";
      meseCorrenteMovimenti = movimentiMese;

      calcolaSettimane(movimentiMese).forEach(s => {
        const btn = document.createElement("button");
        btn.className = "btn-settimana";
        btn.textContent =
          `Settimana (Lun ${s.lunedi.getDate()} - Sab ${s.sabato.getDate()})`;

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
       PDF
    ===================== */
    function generaPDF(titolo, movs) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.text(titolo, 14, 15);
      let y = 25;

      movs.forEach(m => {
        doc.text(
          `${formattaData(m.data)} - €${m.importo.toFixed(2)} ${m.fornitore || ""}`,
          14,
          y
        );
        y += 7;
      });

      doc.save(`${titolo}.pdf`);
    }

    btnExportMese.onclick = () => {
      if (meseCorrenteMovimenti.length)
        generaPDF(titoloMese.textContent, meseCorrenteMovimenti);
    };

    /* =====================
       AVVIO
    ===================== */
    function aggiornaUI() {
      costruisciArchivioMensile();
    }

    aggiornaUI();
  }
});
