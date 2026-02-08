/* =====================================================
   FILTRI – BOX TOGGLE (UNO SOLO ATTIVO)
===================================================== */
function initBoxToggle(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const boxes = container.querySelectorAll(".box-toggle");

  boxes.forEach(box => {
    box.addEventListener("click", () => {
      boxes.forEach(b => b.classList.remove("attivo"));
      box.classList.add("attivo");
    });
  });
}

// inizializza filtri
initBoxToggle("filtro-soggetto");
