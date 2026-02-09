/* =====================================================
   CONFIG FRIGORIFERI
===================================================== */

export const FRIGORIFERI = [
  { id: "BANCO_FRIGO_BAR_1", min: 1, max: 5, decimali: false },
  { id: "CONGELATORE_GELATI", min: -22, max: -16, decimali: false },
  { id: "VETRINA_ESPOSIZIONE", min: 2, max: 6, decimali: false },
  { id: "BANCO_FRIGO_CUCINA", min: 1, max: 5, decimali: true }, // unico con decimali
  { id: "COLONNA_BIBITE", min: 2, max: 6, decimali: false },
  { id: "COLONNA_FRIGO_MAGAZZINO", min: 1, max: 5, decimali: false }
];

/* =====================================================
   GENERATORE TEMPERATURA
===================================================== */

export function generaTemperatura(frigo) {
  const valore =
    Math.random() * (frigo.max - frigo.min) + frigo.min;

  return frigo.decimali
    ? Number(valore.toFixed(1))
    : Math.round(valore);
}

/* =====================================================
   DATE UTILS
===================================================== */

export function oggiISO() {
  return new Date().toISOString().split("T")[0];
}

export function aggiungiGiorni(dataISO, giorni) {
  const d = new Date(dataISO);
  d.setDate(d.getDate() + giorni);
  return d.toISOString().split("T")[0];
}

/* =====================================================
   GIORNI MANCANTI (ANTI BUCHI)
===================================================== */

export function calcolaGiorniMancanti(ultimaDataISO) {
  const oggi = oggiISO();
  const giorni = [];

  let corrente = aggiungiGiorni(ultimaDataISO, 1);

  while (corrente <= oggi) {
    giorni.push(corrente);
    corrente = aggiungiGiorni(corrente, 1);
  }

  return giorni;
}
