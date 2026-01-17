/* =====================================================
   MODIFICA POPUP – PRIMA NOTA
===================================================== */
import { modificaMovimento } from "./movimenti-actions.js";
import { caricaMovimenti } from "./firebase-db.js";

/* =====================================================
   RIFERIMENTI INTERNI
===================================================== */
let aggiornaUIRef = null;
let caricaDettaglioRef = null;
let settimanaCorrenteRef = null;
let setMovimentiRef = null;

/* =====================================================
   INIT
===================================================== */
export function initModificaPopup({
  setMovimenti,
  aggiornaUI,
  caricaDettaglio,
  settimanaCorrente
}) {
  aggiornaUIRef = aggiornaUI;
  caricaDettaglioRef = caricaDettaglio;
  settimanaCorrenteRef = settimanaCorrente;
  setMovimentiRef = setMovimenti;

  const btnSalva = document.getElementById("btn-salva-modifica");
  const btnAnnulla = document.getElementById("btn-annulla-modifica");
  const btnChiudi = document.getElementById("btn-chiudi-modifica");

  if (btnSalva) btnSalva.onclick = salvaModifica;
  if (btnAnnulla) btnAnnulla.onclick = chiudiPopup;
  if (btnChiudi) btnChiudi.onclick = chiudiPopup;
}

/* =====================================================
   APRI POPUP
===================================================== */
export function apriPopupModifica(m) {
  const popup = document.getElementById("popup-modifica");
  popup.classList.remove("hidden");

  // campi comuni
  document.getElementById("mod-id").value = m.id;
  document.getElementById("mod-data").value = m.data;
  document.getElementById("mod-importo").value = m.importo;

  const titolo = document.getElementById("mod-titolo");
  const boxEntrata = document.getElementById("mod-entrata");
  const boxUscita = document.getElementById("mod-uscita");

  if (m.tipo === "entrata") {
    titolo.textContent = "Modifica Entrata";

    boxEntrata.classList.remove("hidden");
    boxUscita.classList.add("hidden");

    document.getElementById("mod-metodo").value =
      m.metodo || "contanti";

  } else {
    titolo.textContent = "Modifica Uscita";

    boxUscita.classList.remove("hidden");
    boxEntrata.classList.add("hidden");

    document.getElementById("mod-fornitore").value =
      m.fornitore || "";

    document.getElementById("mod-documento").value =
      m.documento || "fattura";

    document.getElementById("mod-numero-documento").value =
      m.numeroDocumento || "";
  }
}

/* =====================================================
   SALVA MODIFICA
===================================================== */
async function salvaModifica() {
  try {
    const id = document.getElementById("mod-id").value;

    if (!id) {
      alert("ID movimento mancante");
      return;
    }

    const dati = {
      data: document.getElementById("mod-data").value,
      importo: +document.getElementById("mod-importo").value
    };

    // USCITA
    if (!document.getElementById("mod-uscita").classList.contains("hidden")) {
      dati.fornitore = document.getElementById("mod-fornitore").value;
      dati.documento = document.getElementById("mod-documento").value;
      dati.numeroDocumento =
        document.getElementById("mod-numero-documento").value;
    }

    // ENTRATA
    if (!document.getElementById("mod-entrata").classList.contains("hidden")) {
      dati.metodo = document.getElementById("mod-metodo").value;
    }

    // 🔥 UPDATE FIREBASE
    await modificaMovimento(id, dati);

    // 🔁 RICARICO MOVIMENTI
    const nuoviMovimenti = await caricaMovimenti();
    if (setMovimentiRef) setMovimentiRef(nuoviMovimenti);

    // 🔄 UI
    if (aggiornaUIRef) aggiornaUIRef();
    if (caricaDettaglioRef && settimanaCorrenteRef) {
      caricaDettaglioRef(settimanaCorrenteRef());
    }

    chiudiPopup();

  } catch (err) {
    console.error("Errore modifica movimento:", err);
    alert("Errore durante il salvataggio");
  }
}

/* =====================================================
   CHIUDI POPUP
===================================================== */
function chiudiPopup() {
  document.getElementById("popup-modifica").classList.add("hidden");
}
