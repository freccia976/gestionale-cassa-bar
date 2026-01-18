
import { LOGO_BASE64 } from "./logo-base64.js";


export function generaPDFSettimana({
  settimana,
  movimenti,
  fondoCassaIniziale,
  chiusura = null,
  nomeAttivita = "BAR"
}) {

  // jsPDF caricato da CDN (globale)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ===== LOGO BAR =====
// Logo con proporzioni corrette (più largo che alto)
doc.addImage(LOGO_BASE64, "PNG", 14, 10, 32, 18);



  const { lunedi, sabato } = settimana;

  // HEADER
const pageWidth = doc.internal.pageSize.getWidth();


// Titolo centrato
doc.setFontSize(12);
doc.text(
  "Prima Nota Settimanale",
  pageWidth / 2,
  23,
  { align: "center" }
);

// Periodo centrato sotto al titolo
doc.setFontSize(10);
doc.text(
  `Periodo: ${lunedi.toLocaleDateString("it-IT")} - ${sabato.toLocaleDateString("it-IT")}`,
  pageWidth / 2,
  29,
  { align: "center" }
);



  let startY = 50;

// ===== FONDO CASSA (sopra alle tabelle) =====
if (fondoCassaIniziale > 0) {
  doc.setFontSize(10);
  doc.text(
    `Fondo cassa iniziale: € ${fondoCassaIniziale.toFixed(2)}`,
    14,
    startY
  );
  startY += 8;
}

// ===== PREPARA DATI =====
const entrate = movimenti.filter(m => m.tipo === "entrata");
const uscite = movimenti.filter(m => m.tipo === "uscita");

// ===== TITOLI COLONNE =====
doc.setFontSize(11);
doc.text("ENTRATE", 14, startY);
doc.text("USCITE", 110, startY);

startY += 4;

// ===== TABELLA ENTRATE (SINISTRA) =====
doc.autoTable({
  startY: startY,
  margin: { left: 14 },
  tableWidth: 75, // 👈 PIÙ LARGA
  head: [["Data", "Metodo", "Importo"]],
  body: entrate.map(m => [
    new Date(m.data).toLocaleDateString("it-IT"),
    m.metodo === "contanti" ? "Contanti" : "POS",
    m.importo.toFixed(2)
  ]),
  styles: {
    fontSize: 9,
    cellPadding: 2
  },
  columnStyles: {
    2: { halign: "right" }
  },
  theme: "grid"
});

const fineEntrateY = doc.lastAutoTable.finalY;

// ===== TABELLA USCITE (DESTRA) =====
doc.autoTable({
  startY: startY,
  margin: { left: 90 },   // 👈 si sposta un po’ a destra
  tableWidth: 110,        // 👈 leggermente più stretta
  head: [["Data", "Fornitore", "Doc", "N°", "€"]],
  body: uscite.map(m => [
    new Date(m.data).toLocaleDateString("it-IT"),
    m.fornitore || "",
    m.documento || "",
    m.numeroDocumento || "",
    m.importo.toFixed(2)
  ]),
  styles: {
    fontSize: 8,
    cellPadding: 2,
    overflow: "linebreak"
  },
  columnStyles: {
    1: { cellWidth: 45 },  // Fornitore più largo
    3: { cellWidth: 18 },  // Numero documento
    4: { halign: "right" }
  },
  theme: "grid"
});

const fineUsciteY = doc.lastAutoTable.finalY; 

// ===== CALCOLO TOTALI =====
let totaleContanti = fondoCassaIniziale || 0;
let totalePOS = 0;
let totaleUscite = 0;
let saldoContanti = fondoCassaIniziale || 0;

entrate.forEach(m => {
  if (m.metodo === "contanti") {
    totaleContanti += m.importo;
    saldoContanti += m.importo;
  } else {
    totalePOS += m.importo;
  }
});

uscite.forEach(m => {
  totaleUscite += m.importo;
  const quotaContanti = m.quotaContanti ?? m.importo;
  saldoContanti -= quotaContanti;
});

// ===== POSIZIONE VERTICALE (sotto la tabella più lunga) =====
const yTotali = Math.max(fineEntrateY, fineUsciteY) + 10;


// ===== LINEA DI SEPARAZIONE =====
doc.setDrawColor(0);
doc.line(14, yTotali - 4, 196, yTotali - 4);

// ===== STAMPA TOTALI =====
doc.setFontSize(10);

doc.text(`Totale contanti: € ${totaleContanti.toFixed(2)}`, 14, yTotali);
doc.text(`Totale POS: € ${totalePOS.toFixed(2)}`, 14, yTotali + 6);
doc.text(`Totale uscite: € ${totaleUscite.toFixed(2)}`, 110, yTotali);

// ===== SALDO FINALE (EVIDENZIATO) =====
doc.setFontSize(11);
doc.setFont(undefined, "bold");
doc.text(
  `Saldo contanti finale: € ${saldoContanti.toFixed(2)}`,
  110,
  yTotali + 6
);
doc.setFont(undefined, "normal");

// ===== SEZIONE CHIUSURA CASSA =====
let yChiusura = yTotali + 14;

doc.setFontSize(11);
doc.setFont(undefined, "bold");
doc.text("Chiusura Cassa Settimanale", 14, yChiusura);
doc.setFont(undefined, "normal");

yChiusura += 4;
doc.line(14, yChiusura, 196, yChiusura);
yChiusura += 6;

doc.setFontSize(10);

if (!chiusura) {
  doc.text("Settimana non ancora chiusa", 14, yChiusura);
} else {
  doc.text(`Contanti effettivi: € ${chiusura.contantiEffettivi.toFixed(2)}`, 14, yChiusura);
  yChiusura += 6;

  doc.text(`Versamento banca: € ${chiusura.versamento.toFixed(2)}`, 14, yChiusura);
  yChiusura += 6;

  doc.text(`Compenso Lorenzo: € ${chiusura.lorenzo.toFixed(2)}`, 14, yChiusura);
  yChiusura += 6;

  doc.text(`Compenso Elisa: € ${chiusura.elisa.toFixed(2)}`, 14, yChiusura);
  yChiusura += 6;

  doc.line(14, yChiusura, 196, yChiusura);
  yChiusura += 6;

  doc.setFont(undefined, "bold");
  doc.text(`Fondo cassa risultante: € ${chiusura.fondoCassa.toFixed(2)}`, 14, yChiusura);
  doc.setFont(undefined, "normal");
}

  // DOWNLOAD
  // 🔍 TEST: apri il PDF senza salvarlo
window.open(doc.output("bloburl"), "_blank");

}
