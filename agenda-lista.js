/* =====================================================
   IMPORT
===================================================== */
import { initAuth }
  from "./auth.js";

import {
  caricaProssimiEventi,
  eliminaEventoAgenda,
  completaEventoAgenda
} from "./agenda-db.js";

/* =====================================================
   DOM
===================================================== */
const lista =
  document.getElementById("lista-agenda");

/* =====================================================
   RENDER LISTA
===================================================== */
async function renderAgenda() {

  const eventi =
    await caricaProssimiEventi(100);

  lista.innerHTML = "";

  const oggi =
    new Date().toISOString().split("T")[0];

  eventi.forEach(ev => {

    const card =
      document.createElement("div");

    card.className =
      `agenda-item tipo-${ev.tipo}`;

    /* Stato data */
    let stato = "";

    if (ev.data < oggi) stato = "scaduto";
    if (ev.data === oggi) stato = "oggi";

    card.innerHTML = `

      <div class="agenda-info">

        <div class="agenda-titolo">
          ${ev.titolo}
        </div>

        <div class="agenda-meta">

          <span>📅 ${ev.data}</span>

          ${ev.ora ? `<span>🕒 ${ev.ora}</span>` : ""}

          <span class="priorita ${ev.priorita}">
            ${ev.priorita}
          </span>

          ${stato ? `<span class="stato ${stato}">
            ${stato}
          </span>` : ""}

        </div>

      </div>

      <div class="agenda-azioni">

        <button
          class="btn-ok"
          data-id="${ev.id}">

          ✔

        </button>

        <button
          class="btn-del"
          data-id="${ev.id}">

          🗑

        </button>

      </div>
    `;

    lista.appendChild(card);
  });

  /* Eventi azioni */
  document
    .querySelectorAll(".btn-del")
    .forEach(btn => {

      btn.onclick = async () => {

        if (!confirm("Eliminare evento?"))
          return;

        await eliminaEventoAgenda(
          btn.dataset.id
        );

        renderAgenda();
      };

    });

  document
    .querySelectorAll(".btn-ok")
    .forEach(btn => {

      btn.onclick = async () => {

        await completaEventoAgenda(
          btn.dataset.id
        );

        renderAgenda();
      };

    });

}

/* =====================================================
   INIT
===================================================== */
initAuth(() => {
  renderAgenda();
});
