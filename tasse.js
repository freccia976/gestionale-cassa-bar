/* =====================
   POPUP NUOVA TASSA
===================== */

const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");

/* ===== APERTURA / CHIUSURA ===== */
if (btnNuovaTassa) {
  btnNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.remove("hidden");
  };
}

if (chiudiNuovaTassa) {
  chiudiNuovaTassa.onclick = () => {
    popupNuovaTassa.classList.add("hidden");
  };
}

/* =====================
   SELEZIONE A BOX (SOLO UNO ATTIVO)
===================== */
function initBoxToggle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll(".box-toggle").forEach(box => {
    box.onclick = () => {
      container
        .querySelectorAll(".box-toggle")
        .forEach(b => b.classList.remove("attivo"));

      box.classList.add("attivo");
    };
  });
}

initBoxToggle("tassa-riferita");
initBoxToggle("tassa-pagamento");
