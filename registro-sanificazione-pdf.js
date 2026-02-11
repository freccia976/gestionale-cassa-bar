import { SANIFICAZIONE_COLONNE }
  from "./registro-sanificazione-utils.js";

/* =====================================================
   PDF REGISTRO SANIFICAZIONE – MESE
===================================================== */
export function generaPdfSanificazioneMese({
  anno,
  meseIndex,
  nomeMese,
  datiMese
}) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("portrait");

  /* =====================================================
     INTESTAZIONE AZIENDA
  ===================================================== */
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(
    "BAROTTO S.A.S. DI CIARDI LORENZO & C.",
    105,
    14,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(
    "Via Porta Lucchese, 8 – Pistoia",
    105,
    20,
    { align: "center" }
  );

  /* =====================================================
     TITOLO
  ===================================================== */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(
    `Registro Sanificazione – ${nomeMese} ${anno}`,
    105,
    28,
    { align: "center" }
  );

  /* =====================================================
     HEADER
  ===================================================== */
  const header = [
    [
      "Data",
      ...SANIFICAZIONE_COLONNE.map(c => c.label)
    ]
  ];

  /* =====================================================
     BODY
  ===================================================== */
  const body = [];

  const giorniNelMese =
    new Date(anno, meseIndex + 1, 0).getDate();

  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {

    const dataISO =
      `${anno}-${String(meseIndex+1).padStart(2,"0")}-${String(giorno).padStart(2,"0")}`;

    const dataLabel =
      `${String(giorno).padStart(2,"0")}/${String(meseIndex+1).padStart(2,"0")}/${anno}`;

    const riga = [dataLabel];

    SANIFICAZIONE_COLONNE.forEach(col => {

      let valore = "";

      if (col.gruppo === "sanificazione") {
        valore =
          datiMese[dataISO]?.sanificazione?.[col.id] ?? "";
      }

      if (col.gruppo === "infestanti") {
        valore =
          datiMese[dataISO]?.infestanti?.[col.id] ?? "";
      }

      riga.push(valore);
    });

    body.push(riga);
  }

  /* =====================================================
     AUTOTABLE
  ===================================================== */
  doc.autoTable({
    startY: 34,
    head: header,
    body,
    theme: "grid",

    styles: {
      fontSize: 7,
      halign: "center",
      valign: "middle",
      cellPadding: 2
    },

    headStyles: {
      fillColor: [31, 41, 55],
      textColor: 255,
      fontStyle: "bold"
    },

    columnStyles: {
      0: {
        halign: "left",
        fontStyle: "bold",
        cellWidth: 22
      }
    }
  });

  /* =====================================================
     LEGENDA FREQUENZE
  ===================================================== */
  const yLegenda =
    doc.lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  doc.text(
    "Legenda frequenze:",
    14,
    yLegenda
  );

  doc.text(
    "- Sanificazione giornaliera: ogni giorno",
    14,
    yLegenda + 6
  );

  doc.text(
    "- Sanificazione settimanale: 1 volta a settimana",
    14,
    yLegenda + 12
  );

  doc.text(
    "- Sanificazione mensile: 1 volta al mese",
    14,
    yLegenda + 18
  );

  doc.text(
    "- Sanificazione semestrale: gennaio / luglio",
    14,
    yLegenda + 24
  );

  doc.text(
    "- Controllo infestanti: giornaliero",
    14,
    yLegenda + 30
  );

  /* =====================================================
     FIRMA
  ===================================================== */
  const yFirma = yLegenda + 46;

  doc.text("Firma operatore:", 14, yFirma);
  doc.line(50, yFirma + 1, 140, yFirma + 1);

  doc.text(
    `Data: ____ / ____ / ${anno}`,
    150,
    yFirma
  );

  /* =====================================================
     SALVA
  ===================================================== */
  doc.save(
    `registro-sanificazione-${anno}-${String(meseIndex+1).padStart(2,"0")}.pdf`
  );
}
