import { FRIGORIFERI } from "./registro-temperature-utils.js";

/* =====================================================
   PDF REGISTRO TEMPERATURE (MESE)
===================================================== */
export function generaPdfRegistroMese({
  anno,
  meseIndex,
  nomeMese,
  datiMese
}) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("jsPDF non caricato correttamente");
    return;
  }

  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF("landscape");

  /* =====================
     TITOLO
  ===================== */
  doc.setFontSize(16);
  doc.text(`Registro Temperature – ${nomeMese} ${anno}`, 14, 15);

  doc.setFontSize(10);
  doc.text("Gestione interna – uso alimentare", 14, 22);

  /* =====================
     HEADER
  ===================== */
  const head = [[
    "Data",
    ...FRIGORIFERI.flatMap(f => [
      `${f.id.replaceAll("_", " ")} M`,
      `${f.id.replaceAll("_", " ")} P`
    ])
  ]];

  /* =====================
     BODY
  ===================== */
  const body = [];

  const giorniNelMese = new Date(anno, meseIndex + 1, 0).getDate();

  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
    const dataISO = `${anno}-${String(meseIndex + 1).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
    const dataLabel = `${String(giorno).padStart(2, "0")}/${String(meseIndex + 1).padStart(2, "0")}/${anno}`;

    const riga = [dataLabel];

    FRIGORIFERI.forEach(f => {
      const dati = datiMese[dataISO]?.frigoriferi?.[f.id];
      riga.push(dati?.mattina ?? "");
      riga.push(dati?.pomeriggio ?? "");
    });

    body.push(riga);
  }

  doc.autoTable({
    startY: 28,
    head,
    body,
    styles: { fontSize: 8, halign: "center" },
    headStyles: { fillColor: [31, 41, 55] },
    columnStyles: { 0: { fontStyle: "bold", halign: "left" } }
  });

  doc.save(
    `registro-temperature-${anno}-${String(meseIndex + 1).padStart(2, "0")}.pdf`
  );
}
