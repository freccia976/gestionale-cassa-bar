import { FRIGORIFERI } from "./registro-temperature-utils.js";

/* =====================================================
   PDF REGISTRO TEMPERATURE – MESE
===================================================== */
export function generaPdfRegistroMese({
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
    `Registro Temperature – ${nomeMese} ${anno}`,
    105,
    28,
    { align: "center" }
  );

  /* =====================================================
     HEADER TABELLA (2 RIGHE)
  ===================================================== */
  const headerRiga1 = ["Data"];
  const headerRiga2 = [""];

  FRIGORIFERI.forEach(f => {
    const nome = f.id.replaceAll("_", " ");
    headerRiga1.push(nome, ""); // colSpan gestito dopo
    headerRiga2.push("M", "P");
  });

  /* =====================================================
     BODY
  ===================================================== */
  const body = [];
  const giorniNelMese = new Date(anno, meseIndex + 1, 0).getDate();

  for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
    const dataISO = `${anno}-${String(meseIndex + 1).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
    const dataLabel = `${String(giorno).padStart(2, "0")}/${String(meseIndex + 1).padStart(2, "0")}/${anno}`;

    const riga = [dataLabel];

    FRIGORIFERI.forEach(f => {
      const dati = datiMese[dataISO]?.frigoriferi?.[f.id];
      riga.push(
        dati?.mattina ?? "",
        dati?.pomeriggio ?? ""
      );
    });

    body.push(riga);
  }

  /* =====================================================
     AUTOTABLE
  ===================================================== */
  doc.autoTable({
    startY: 34,
    head: [headerRiga1, headerRiga2],
    body,
    theme: "grid",
    styles: {
      fontSize: 7,
      halign: "center",
      valign: "middle",
      cellPadding: 1.5
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 22 }
    },
    didParseCell(data) {
      // 👉 COLSPAN SOLO SULLA PRIMA RIGA HEADER
      if (
        data.section === "head" &&
        data.row.index === 0 &&
        data.column.index > 0
      ) {
        data.cell.colSpan = 2;
      }
    }
  });

  /* =====================================================
     FIRMA OPERATORE
  ===================================================== */
  const yFirma = doc.lastAutoTable.finalY + 14;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");

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
    `registro-temperature-${anno}-${String(meseIndex + 1).padStart(2, "0")}.pdf`
  );
}
