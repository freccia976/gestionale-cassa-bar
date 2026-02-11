/* =====================================================
   CONFIG COLONNE SANIFICAZIONE
===================================================== */

export const SANIFICAZIONE_COLONNE = [
  {
    id: "giornaliera",
    label: "Sanificazione giornaliera",
    gruppo: "sanificazione"
  },
  {
    id: "settimanale",
    label: "Sanificazione settimanale",
    gruppo: "sanificazione"
  },
  {
    id: "mensile",
    label: "Sanificazione mensile",
    gruppo: "sanificazione"
  },
  {
    id: "semestrale",
    label: "Sanificazione semestrale",
    gruppo: "sanificazione"
  },
  {
    id: "giornaliero",
    label: "Controllo infestanti giornaliero",
    gruppo: "infestanti"
  }
];

/* =====================================================
   VALORI STANDARD
===================================================== */

export const VALORE_OK = "✔";
export const VALORE_NO = "✖";

/* =====================================================
   REGOLE FREQUENZA
===================================================== */

export function isSettimanaAttiva(dataISO) {
  const d = new Date(dataISO);
  return d.getDay() === 1;
}

export function isMensileAttiva(dataISO) {
  const d = new Date(dataISO);
  return d.getDate() === 1;
}

export function isSemestraleAttiva(dataISO) {
  const d = new Date(dataISO);
  return (
    d.getDate() === 1 &&
    (d.getMonth() === 0 || d.getMonth() === 6)
  );
}

/* =====================================================
   FREQUENZE ATTIVE PER DATA
===================================================== */

export function getFrequenzeAttive(dataISO) {
  return {
    giornaliera: true,
    settimanale: isSettimanaAttiva(dataISO),
    mensile: isMensileAttiva(dataISO),
    semestrale: isSemestraleAttiva(dataISO),
    infestanti_giornaliero: true
  };
}
