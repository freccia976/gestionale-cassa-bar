import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";
import "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.29/dist/jspdf.plugin.autotable.min.js";

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
  const doc = new jsPDF("landscape");

  /* =====================
     TITOLO
  ===================== */
  doc.setFontSize(16);
  doc.text(`Registro Temperature – ${nomeMese} ${anno}`, 14, 15);

  doc.setFontSize(10);
  doc.text("Gestione interna – uso alimentare", 14, 22);

  /* =====================
     HEADER TABELLA
  ===================== */
  const head = [
    [
      "Data",
      ...FRIGORIFERI.flatMap(f => [
        `${f.id.replaceAll("_", " ")} M`,
        `${f.id.replaceAll("_", " ")} P`
      ])
    ]
  ];

  /* =====================
     BODY TABELLA
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

  /* =====================
     AUTOTABLE
  ===================== */
  doc.autoTable({
    startY: 28,
    head,
    body,
    styles: {
      fontSize: 8,
      halign: "center",
      valign: "middle"
    },
    headStyles: {
      fillColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" }
    }
  });

  /* =====================
     SALVA
  ===================== */
  doc.save(`registro-temperature-${anno}-${String(meseIndex + 1).padStart(2, "0")}.pdf`);
}
