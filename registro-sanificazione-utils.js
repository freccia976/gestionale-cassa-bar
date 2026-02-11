/* =====================================================
   CONFIG COLONNE SANIFICAZIONE
===================================================== */

export const SANIFICAZIONE_COLONNE = [
  { id: "san_giornaliera", label: "Sanificazione giornaliera" },
  { id: "san_settimanale", label: "Sanificazione settimanale" },
  { id: "san_mensile", label: "Sanificazione mensile" },
  { id: "inf_giornaliero", label: "Controllo infestanti giornaliero" },
  { id: "inf_semestrale", label: "Controllo infestanti semestrale" }
];

/* =====================================================
   VALORI STANDARD
===================================================== */

export const VALORE_OK = "✔";
export const VALORE_NO = "✖";

export function valoreDefault() {
  return VALORE_OK;
}
export function isSettimanaAttiva(dataISO) {
  const d = new Date(dataISO);
  return d.getDay() === 1; // LUNEDÌ
}

export function isMensileAttiva(dataISO) {
  const d = new Date(dataISO);
  return d.getDate() === 1; // primo giorno del mese
}

export function isSemestraleAttiva(dataISO) {
  const d = new Date(dataISO);
  return d.getDate() === 1 && (d.getMonth() === 0 || d.getMonth() === 6);
}
