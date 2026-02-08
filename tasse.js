/* =====================================================
   IMPORT
===================================================== */
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,

  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { getCurrentUser, onUserChanged } from "./firebase-db.js";


/* =====================================================
   SETUP FIREBASE
===================================================== */
const db = getFirestore();

/* =====================================================
   ELEMENTI DOM
===================================================== */
const btnNuovaTassa = document.getElementById("btn-nuova-tassa");
const popupNuovaTassa = document.getElementById("popup-nuova-tassa");
const chiudiNuovaTassa = document.getElementById("chiudi-nuova-tassa");
const btnSalvaTassa = document.getElementById("salva-tassa");
const listaAnni = document.getElementById("lista-anni-tasse");

/* =====================================================
   POPUP APERTURA / CHIUSURA
===================================================== */
btnNuovaTassa?.addEventListener("click", () => {
  popupNuovaTassa.classList.remove("hidden");
});

chiudiNuovaTassa?.addEventListener("click", () => {
  popupNuovaTassa.classList.add("hidden");
});

/* =====================================================
   BOX TOGGLE (UNO SOLO ATTIVO)
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

initBoxToggle("tassa-stato");
initBoxToggle("tassa-riferita");
initBoxToggle("tassa-pagamento");

/* =====================================================
   SALVATAGGIO TASSA
===================================================== */
btnSalvaTassa?.addEventListener("click", async () => {
  const user = getCurrentUser();
  if (!user) {
    alert("Utente non loggato");
    return;
  }

  const soggetto = document.querySelector(
    "#tassa-riferita .box-toggle.attivo"
  )?.dataset.soggetto;

  const pagamento = document.querySelector(
    "#tassa-pagamento .box-toggle.attivo"
  )?.dataset.pagamento;

  const stato = document.querySelector(
    "#tassa-stato .box-toggle.attivo"
  )?.dataset.stato;

  if (!stato) {
    alert("Seleziona se la tassa è PAGATA o DA PAGARE");
    return;
  }

  const tipo = document.getElementById("tassa-tipo").value.trim();
  // =============================
// SALVA TIPO TASSA (AUTOCOMPLETE)
// =============================
if (tipo) {
  const tipoRef = doc(
    db,
    "users",
    user.uid,
    "tipi_tasse",
    tipo.toUpperCase()
  );

  await setDoc(
    tipoRef,
    {
      nome: tipo,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

  const importo = parseFloat(document.getElementById("tassa-importo").value);
  const dataInput = document.getElementById("tassa-data").value;

  if (!soggetto || !pagamento || !tipo || !importo || !dataInput) {
    alert("Compila tutti i campi");
    return;
  }

  const anno = new Date(dataInput).getFullYear();

  /* ===== LOGICA STATO ===== */
  let pagata = false;
  let dataScadenza = null;
  let dataPagamento = null;

  if (stato === "PAGATA") {
    pagata = true;
    dataPagamento = dataInput;
    dataScadenza = dataInput;
  }

  if (stato === "DA_PAGARE") {
    pagata = false;
    dataScadenza = dataInput;
    dataPagamento = null;
  }

  const payload = {
    anno,
    soggetto,
    tipo,
    pagamento,
    importo,
    pagata,
    dataScadenza,
    dataPagamento
  };
/* ===== SALVA TIPO TASSA (AUTOCOMPLETE) ===== */
const tipoRef = doc(
  db,
  "users",
  user.uid,
  "tipi_tasse",
  tipo.toUpperCase()
);

await setDoc(
  tipoRef,
  {
    nome: tipo,
    updatedAt: serverTimestamp()
  },
  { merge: true }
);

  const tassaId = document.getElementById("tassa-id").value;

  if (tassaId) {
    await updateDoc(
      doc(db, "users", user.uid, "tasse", tassaId),
      payload
    );
  } else {
    await addDoc(
      collection(db, "users", user.uid, "tasse"),
      {
        ...payload,
        createdAt: serverTimestamp()
      }
    );
  }

  /* ===== RESET UI ===== */
  document.getElementById("tassa-id").value = "";
  document.getElementById("tassa-tipo").value = "";
  document.getElementById("tassa-importo").value = "";
  document.getElementById("tassa-data").value = "";

  document
    .querySelectorAll(".box-toggle.attivo")
    .forEach(b => b.classList.remove("attivo"));

  popupNuovaTassa.classList.add("hidden");

 caricaAnniTasse();
caricaTipiTassa(); // 🔑 aggiorna suggerimenti
alert("✅ Tassa salvata correttamente");

});

/* =====================================================
   RIEPILOGO ANNI
===================================================== */
async function caricaAnniTasse() {
  const user = getCurrentUser();
  if (!user || !listaAnni) return;

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "tasse")
  );

  const anni = new Set();

  snapshot.forEach(d => {
    if (d.data().anno) anni.add(d.data().anno);
  });

  listaAnni.innerHTML = "";

  [...anni]
    .sort((a, b) => b - a)
    .forEach(anno => {
      const box = document.createElement("div");
      box.className = "box-toggle";
      box.textContent = `Tasse ${anno}`;
      box.onclick = () => {
        window.location.href = `tasse-anno.html?anno=${anno}`;
      };
      listaAnni.appendChild(box);
    });
}

/* =====================================================
   MODIFICA TASSA
===================================================== */
async function caricaTassaDaModificare() {
  const tassaId = new URLSearchParams(window.location.search).get("modifica");
  if (!tassaId) return;

  const user = getCurrentUser();
  if (!user) return;

  const snap = await getDoc(
    doc(db, "users", user.uid, "tasse", tassaId)
  );

  if (!snap.exists()) return;

  const t = snap.data();

  popupNuovaTassa.classList.remove("hidden");

  document.getElementById("tassa-id").value = tassaId;
  document.getElementById("tassa-tipo").value = t.tipo;
  document.getElementById("tassa-importo").value = t.importo;
  document.getElementById("tassa-data").value =
    t.pagata ? t.dataPagamento : t.dataScadenza;

  document
    .querySelectorAll("#tassa-stato .box-toggle")
    .forEach(b =>
      b.classList.toggle(
        "attivo",
        (t.pagata && b.dataset.stato === "PAGATA") ||
        (!t.pagata && b.dataset.stato === "DA_PAGARE")
      )
    );

  document
    .querySelectorAll("#tassa-riferita .box-toggle")
    .forEach(b =>
      b.classList.toggle("attivo", b.dataset.soggetto === t.soggetto)
    );

  document
    .querySelectorAll("#tassa-pagamento .box-toggle")
    .forEach(b =>
      b.classList.toggle("attivo", b.dataset.pagamento === t.pagamento)
    );
}
/* =====================================================
   CARICA TIPI TASSA (AUTOCOMPLETE)
===================================================== */
async function caricaTipiTassa() {
  const user = getCurrentUser();
  if (!user) return;

  const input = document.getElementById("tassa-tipo");
  const lista = document.getElementById("lista-tipi-tassa");

  if (!input || !lista) return;

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "tasse")
  );

  const tipi = [
    ...new Set(
      snapshot.docs
        .map(d => d.data().tipo)
        .filter(Boolean)
    )
  ].sort();

  input.addEventListener("focus", () => {
    lista.innerHTML = "";
    tipi.forEach(t => {
      const div = document.createElement("div");
      div.textContent = t;
      div.onclick = () => {
        input.value = t;
        lista.classList.add("hidden");
      };
      lista.appendChild(div);
    });
    if (tipi.length) lista.classList.remove("hidden");
  });

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    lista.innerHTML = "";

    tipi
      .filter(t => t.toLowerCase().includes(val))
      .forEach(t => {
        const div = document.createElement("div");
        div.textContent = t;
        div.onclick = () => {
          input.value = t;
          lista.classList.add("hidden");
        };
        lista.appendChild(div);
      });

    lista.classList.toggle("hidden", lista.children.length === 0);
  });

  document.addEventListener("click", e => {
    if (!input.contains(e.target)) {
      lista.classList.add("hidden");
    }
  });
}



/* =====================================================
   INIT
===================================================== */
onUserChanged(user => {
  if (!user) return;
  caricaAnniTasse();
  caricaTipiTassa();
  caricaTassaDaModificare();
});
