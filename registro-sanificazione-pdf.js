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
  const header = [[
    "Data",
    ...SANIFICAZIONE_COLONNE.map(c => c.label)
  ]];

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

      /* ✔ → X visibile */
      let stampa = "";
      if (valore === "✔") stampa = "X";

      riga.push(stampa);
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
      fontSize: 8,
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
    },

    /* Spunte più visibili */
    didParseCell(data) {
      if (
        data.section === "body" &&
        data.cell.raw === "X"
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 11;
      }
    }
  });

  /* =====================================================
     LEGENDA COMPATTA (SOTTO TABELLA)
  ===================================================== */
  const yLegenda =
    doc.lastAutoTable.finalY + 8;

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");

  doc.text(
    "Legenda:",
    14,
    yLegenda
  );

  doc.text(
    "G = Giornaliera   S = Settimanale   M = Mensile   SE = Semestrale   I = Infestanti",
    14,
    yLegenda + 5
  );

  /* =====================================================
     FIRMA + DATA SU UNA RIGA
  ===================================================== */
  const yFirma = yLegenda + 14;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");

  /* Firma */
  doc.text(
    "Firma operatore:",
    14,
    yFirma
  );

  doc.line(
    50,
    yFirma + 1,
    120,
    yFirma + 1
  );

  /* Data sulla stessa riga */
  doc.text(
    "Data:",
    130,
    yFirma
  );

  doc.line(
    150,
    yFirma + 1,
    190,
    yFirma + 1
  );

  /* =====================================================
     SALVA
  ===================================================== */
  doc.save(
    `registro-sanificazione-${anno}-${String(meseIndex+1).padStart(2,"0")}.pdf`
  );
}

