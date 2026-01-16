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
     SALVA USCITA
  ===================== */
  formUscitaDati.onsubmit = async e => {
    e.preventDefault();

    if (!tipoDocumento) {
      alert("Seleziona il tipo di documento");
      return;
    }

    const uscita = {
      data: inputData.value,
      tipo: "uscita",
      fornitore: inputFornitore.value,
      documento: tipoDocumento,
      numeroDocumento: inputNumeroDoc.value || "",
      importo: +inputImporto.value
    };

    await salvaMovimento(uscita);
    await caricaMovimenti();

    // reset form
    formUscitaDati.reset();
    tipoDocumento = null;
    document
      .querySelectorAll(".btn-doc")
      .forEach(b => b.classList.remove("attivo"));

    // chiudi form
    formUscita.classList.add("hidden");

    aggiornaUI();
  };
}
