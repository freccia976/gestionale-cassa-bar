import { LOGO_BASE64 } from "./logo-base64.js";

const { jsPDF } = window.jspdf;

export function generaPDFFiltro({
  mesi,
  sezioni,
  totali,
  totaliFornitori,
  nomeAttivita = "BAR"
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 20;

  /* ================= HEADER ================= */
  doc.addImage(LOGO_BASE64, "PNG", 14, 10, 30, 18);

  doc.setFontSize(14);
  doc.text(nomeAttivita, 50, 18);

  doc.setFontSize(12);
  doc.text("Report filtrato", pageWidth / 2, 26, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    mesi.map(m => `${m.nome}`).join(", "),
    pageWidth / 2,
    32,
    { align: "center" }
  );

  y = 45;

  /* ================= TOTALI ================= */
  doc.setFont(undefined, "bold");
  doc.text("Totali", 14, y);
  doc.setFont(undefined, "normal");
  y += 8;

  doc.setFontSize(10);

  if (sezioni.contanti) {
    doc.text(`Totale contanti: € ${totali.contanti.toFixed(2)}`, 14, y);
    y += 6;
  }

  if (sezioni.pos) {
    doc.text(`Totale POS: € ${totali.pos.toFixed(2)}`, 14, y);
    y += 6;
  }

  if (sezioni.uscite) {
    doc.text(`Totale uscite: € ${totali.uscite.toFixed(2)}`, 14, y);
    y += 6;
  }

  if (sezioni.versamenti) {
    doc.text(`Versamenti banca: € ${totali.versamenti.toFixed(2)}`, 14, y);
    y += 6;
  }

  if (sezioni.lorenzo) {
    doc.text(`Compenso Lorenzo: € ${totali.lorenzo.toFixed(2)}`, 14, y);
    y += 6;
  }

  if (sezioni.elisa) {
    doc.text(`Compenso Elisa: € ${totali.elisa.toFixed(2)}`, 14, y);
    y += 6;
  }

  /* ================= DETTAGLIO FORNITORI ================= */
  Object.keys(totaliFornitori).forEach(nome => {
    y += 10;

    doc.setFont(undefined, "bold");
    doc.text(`Fornitore: ${nome}`, 14, y);
    doc.setFont(undefined, "normal");

    y += 4;

    const righe = totaliFornitori[nome].righe.map(u => ([
      new Date(u.data).toLocaleDateString("it-IT"),
      u.documento || "",
      u.numeroDocumento || "",
      `€ ${u.importo.toFixed(2)}`
    ]));

    doc.autoTable({
      startY: y,
      head: [["Data", "Doc", "N°", "Importo"]],
      body: righe,
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: "right" }
      }
    });

    y = doc.lastAutoTable.finalY + 4;

    doc.setFont(undefined, "bold");
    doc.text(
      `Totale ${nome}: € ${totaliFornitori[nome].totale.toFixed(2)}`,
      14,
      y
    );
    doc.setFont(undefined, "normal");
  });

  /* ================= APERTURA PDF ================= */
  doc.output("dataurlnewwindow");
}
