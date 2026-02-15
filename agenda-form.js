/* =====================================================
   IMPORT
===================================================== */
import { initAuth }
  from "./auth.js";

import {
  creaEventoAgenda
} from "./agenda-db.js";

/* =====================================================
   DOM
===================================================== */
const titolo =
  document.getElementById("titolo");

const tipo =
  document.getElementById("tipo");

const data =
  document.getElementById("data");

const ora =
  document.getElementById("ora");

const priorita =
  document.getElementById("priorita");

const descrizione =
  document.getElementById("descrizione");

const promemoria =
  document.getElementById("promemoria");

const btnSalva =
  document.getElementById("salva-evento");

/* =====================================================
   SALVA EVENTO
===================================================== */
btnSalva.onclick = async () => {

  /* Validazioni base */
  if (!titolo.value.trim()) {
    alert("Inserisci il titolo");
    return;
  }

  if (!data.value) {
    alert("Seleziona la data");
    return;
  }

  /* Creazione evento */
  await creaEventoAgenda({

    titolo: titolo.value.trim(),
    descrizione: descrizione.value.trim(),

    tipo: tipo.value,
    data: data.value,
    ora: ora.value,

    priorita: priorita.value,
    promemoria: promemoria.checked

  });

  alert("📅 Evento salvato");

  /* Redirect agenda o home */
  window.location.href = "agenda.html";
};

/* =====================================================
   INIT AUTH
===================================================== */
initAuth(() => {});
