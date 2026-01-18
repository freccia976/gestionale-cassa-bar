
import { LOGO_BASE64 } from "./logo-base64.js";

const { jsPDF } = window.jspdf;


export function generaPDFMese({
  anno,
  mese,
  chiusureMese,
  nomeAttivita = "BAR"
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  /* ================= HEADER ================= */
  doc.addImage(LOGO_BASE64, "PNG", 14, 10, 32, 18);


  doc.setFontSize(12);
  doc.text(
    "Riepilogo Mensile",
    pageWidth / 2,
    23,
    { align: "center" }
  );

  doc.setFontSize(10);
  doc.text(
    `${mese} ${anno}`,
    pageWidth / 2,
    29,
    { align: "center" }
  );

  let startY = 45;

  /* ================= TABELLA SETTIMANE ================= */
  const body = chiusureMese.map(c => {
    const lun = c.settimana.lunedi instanceof Date
  ? c.settimana.lunedi
  : new Date(c.settimana.lunedi.seconds * 1000);

const sab = c.settimana.sabato instanceof Date
  ? c.settimana.sabato
  : new Date(c.settimana.sabato.seconds * 1000);


    return [
      `Lun ${lun.getDate()} - Sab ${sab.getDate()}`,
      c.totaleContantiSettimana.toFixed(2),
      c.totalePOSSettimana.toFixed(2),
      c.totaleUsciteSettimana.toFixed(2),
      c.fondoCassa.toFixed(2)
    ];
  });

  doc.autoTable({
    startY,
    head: [[
      "Settimana",
      "Contanti (€)",
      "POS (€)",
      "Uscite (€)",
      "Fondo Cassa (€)"
    ]],
    body,
    styles: { halign: "right" },
    headStyles: { halign: "center" },
    columnStyles: {
      0: { halign: "left", cellWidth: 40 }
    }
  });

  /* ================= TOTALI MESE ================= */
 const totali = chiusureMese.reduce(
  (acc, c) => {
    acc.contanti += c.totaleContantiSettimana || 0;
    acc.pos += c.totalePOSSettimana || 0;
    acc.uscite += c.totaleUsciteSettimana || 0;

    acc.versamento += c.versamento || 0;
    acc.lorenzo += c.lorenzo || 0;
    acc.elisa += c.elisa || 0;

    acc.bonusVersamento += c.bonus?.versamento || 0;
    acc.bonusLorenzo += c.bonus?.lorenzo || 0;
    acc.bonusElisa += c.bonus?.elisa || 0;

    acc.saldo = c.fondoCassa; // ultimo fondo del mese
    return acc;
  },
  {
    contanti: 0,
    pos: 0,
    uscite: 0,

    versamento: 0,
    lorenzo: 0,
    elisa: 0,

    bonusVersamento: 0,
    bonusLorenzo: 0,
    bonusElisa: 0,

    saldo: 0
  }
);

  let y = doc.lastAutoTable.finalY + 10;

  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("Totali Mensili", 14, y);
  y += 6;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);

doc.text(`Totale contanti: € ${totali.contanti.toFixed(2)}`, 14, y);
y += 6;

doc.text(`Totale POS: € ${totali.pos.toFixed(2)}`, 14, y);
y += 6;

doc.text(`Totale uscite: € ${totali.uscite.toFixed(2)}`, 14, y);
y += 10;

/* ================= RIPARTIZIONE CHIUSURE ================= */
doc.setFont(undefined, "bold");
doc.setFontSize(11);
doc.text("Ripartizione Chiusure", 14, y);
y += 6;

doc.setFont(undefined, "normal");
doc.setFontSize(10);
doc.text(`Versamenti in banca: € ${totali.versamento.toFixed(2)}`, 14, y);
y += 6;

doc.text(`Compensi Lorenzo: € ${totali.lorenzo.toFixed(2)}`, 14, y);
y += 6;

doc.text(`Compensi Elisa: € ${totali.elisa.toFixed(2)}`, 14, y);
y += 6;

doc.text(
  `Bonus totali: € ${(
    totali.bonusVersamento +
    totali.bonusLorenzo +
    totali.bonusElisa
  ).toFixed(2)}`,
  14,
  y
);
y += 10;

doc.setFont(undefined, "bold");
doc.text(`Saldo contanti fine mese: € ${totali.saldo.toFixed(2)}`, 14, y);
doc.setFont(undefined, "normal");


  doc.output("dataurlnewwindow");
}
