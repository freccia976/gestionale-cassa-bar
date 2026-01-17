/* =====================================================
   USCITE
===================================================== */
export function initUscite({
  salvaMovimento,
  caricaMovimenti,
  aggiornaUI
}) {
  const formUscita = document.getElementById("form-uscita");
  const formUscitaDati = document.getElementById("form-uscita-dati");

  const inputData = document.getElementById("data-uscita");
  const inputFornitore = document.getElementById("fornitore-input");
  const inputImporto = document.getElementById("importo-uscita");
  const inputNumeroDoc = document.getElementById("numero-documento");

  // NUOVI CAMPI
  const inputQuotaContanti = document.getElementById("quota-contanti");
  const inputQuotaCassetto = document.getElementById("quota-cassetto");

  let tipoDocumento = null;

  /* =====================
     SELEZIONE DOCUMENTO
  ===================== */
  document.querySelectorAll(".btn-doc").forEach(btn => {
    btn.onclick = () => {
      document
        .querySelectorAll(".btn-doc")
        .forEach(b => b.classList.remove("attivo"));

      btn.classList.add("attivo");
      tipoDocumento = btn.dataset.doc;
    };
  });

  /* =====================
     CALCOLO QUOTE
  ===================== */
  function aggiornaQuote() {
    const totale = parseFloat(inputImporto.value) || 0;
    let contanti = parseFloat(inputQuotaContanti.value) || 0;

    if (contanti > totale) {
      contanti = totale;
      inputQuotaContanti.value = totale.toFixed(2);
    }

    const cassetto = totale - contanti;
    inputQuotaCassetto.value = cassetto.toFixed(2);
  }

  inputImporto.addEventListener("input", aggiornaQuote);
  inputQuotaContanti.addEventListener("input", aggiornaQuote);

  /* =====================
     SALVA USCITA
  ===================== */
  formUscitaDati.onsubmit = async e => {
    e.preventDefault();

    if (!tipoDocumento) {
      alert("Seleziona il tipo di documento");
      return;
    }

    const totale = +inputImporto.value;
    const quotaContanti = +inputQuotaContanti.value || 0;
    const quotaCassetto = +inputQuotaCassetto.value || 0;

    if ((quotaContanti + quotaCassetto).toFixed(2) !== totale.toFixed(2)) {
      alert("Errore nelle quote contanti / cassetto");
      return;
    }

    const uscita = {
      data: inputData.value,
      tipo: "uscita",
      fornitore: inputFornitore.value.trim(),
      documento: tipoDocumento,
      numeroDocumento: inputNumeroDoc.value || "",
      importo: totale,

      // 👇 NUOVI CAMPI
      quotaContanti,
      quotaCassetto
    };

    await salvaMovimento(uscita);
    await caricaMovimenti();

    /* =====================
       RESET FORM
    ===================== */
    formUscitaDati.reset();
    tipoDocumento = null;
    inputQuotaCassetto.value = "";

    document
      .querySelectorAll(".btn-doc")
      .forEach(b => b.classList.remove("attivo"));

    formUscita.classList.add("hidden");

    aggiornaUI();
  };
}
