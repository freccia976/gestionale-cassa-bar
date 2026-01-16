/* =====================================================
   ENTRATE MODULE
===================================================== */

export function initEntrate({
  salvaMovimento,
  caricaMovimenti,
  aggiornaUI
}) {
  let metodoEntrata = null;

  /* =====================
     SELEZIONE METODO
  ===================== */
  document.querySelectorAll(".btn-metodo").forEach(btn => {
    btn.onclick = () => {
      document
        .querySelectorAll(".btn-metodo")
        .forEach(b => b.classList.remove("attivo"));

      btn.classList.add("attivo");
      metodoEntrata = btn.dataset.metodo;
    };
  });

  /* =====================
     SUBMIT ENTRATA
  ===================== */
  const form = document.getElementById("form-entrata-dati");

  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();

    if (!metodoEntrata) {
      alert("Seleziona CONTANTI o POS");
      return;
    }

    const nuovaEntrata = {
      data: document.getElementById("data-entrata").value,
      tipo: "entrata",
      metodo: metodoEntrata,
      importo: +document.getElementById("importo-entrata").value
    };

    await salvaMovimento(nuovaEntrata);
    await caricaMovimenti();

   form.reset();
metodoEntrata = null;

document
  .querySelectorAll(".btn-metodo")
  .forEach(b => b.classList.remove("attivo"));

// 👇 CHIUDE IL FORM ENTRATA
document.getElementById("form-entrata").classList.add("hidden");

aggiornaUI();

  };
}
