import type { CalcInputs, CalcResults } from "../types";
import { formatRupiah } from "../types";

type ComparePair = { label: string; inputs: CalcInputs; results: CalcResults };

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export async function downloadSingleSimulationPdf(
  filename: string,
  title: string,
  inputs: CalcInputs,
  results: CalcResults
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nama Simulasi: ${inputs.name || "-"}`, 40, 62);

  autoTable(doc, {
    startY: 78,
    head: [["Parameter", "Nilai"]],
    body: [
      ["OTR", formatRupiah(Number(inputs.otr) || 0)],
      ["Mode DP", inputs.calcMode],
      ["Rate / Tenor", `${inputs.rateFix}% / ${inputs.tenor} tahun`],
      ["DP Murni", formatRupiah(results.pureDP)],
      ["DP %", `${results.dpPercentCalc.toFixed(2)}%`],
      ["Asuransi Cash", formatRupiah(results.asuransiCash)],
      ["Plafon Kredit", formatRupiah(results.plafonKredit)],
      ["Cicilan / Bulan", formatRupiah(results.installment)],
      ["Total Bayar Pertama", formatRupiah(results.totalDP)],
      ["Total Pinjaman", formatRupiah(results.totalPinjaman)],
      ["Total Bunga", formatRupiah(results.totalBunga)],
      ["Grand Total Keluar", formatRupiah(results.totalUangKeluar)],
    ],
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [34, 42, 69] },
    columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 320 } },
  });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Simulasi ini hanya sebagai referensi.", 40, doc.internal.pageSize.getHeight() - 24);
  doc.save(`${safeFilename(filename)}.pdf`);
}

export async function downloadCompareSimulationPdf(
  filename: string,
  title: string,
  pairs: ComparePair[]
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 36, 36);

  const headers = ["Parameter", ...pairs.map((p, i) => p.label || p.inputs.name || `Simulasi ${i + 1}`)];
  const rows: string[][] = [
    ["OTR", ...pairs.map((p) => formatRupiah(Number(p.inputs.otr) || 0))],
    ["Rate / Tenor", ...pairs.map((p) => `${p.inputs.rateFix}% / ${p.inputs.tenor} thn`)],
    ["DP Murni", ...pairs.map((p) => formatRupiah(p.results.pureDP))],
    ["DP %", ...pairs.map((p) => `${p.results.dpPercentCalc.toFixed(2)}%`)],
    ["Asuransi Cash", ...pairs.map((p) => formatRupiah(p.results.asuransiCash))],
    ["Plafon Kredit", ...pairs.map((p) => formatRupiah(p.results.plafonKredit))],
    ["Cicilan / Bulan", ...pairs.map((p) => formatRupiah(p.results.installment))],
    ["Total Bayar Pertama", ...pairs.map((p) => formatRupiah(p.results.totalDP))],
    ["Total Bunga", ...pairs.map((p) => formatRupiah(p.results.totalBunga))],
    ["Grand Total Keluar", ...pairs.map((p) => formatRupiah(p.results.totalUangKeluar))],
  ];

  autoTable(doc, {
    startY: 52,
    head: [headers],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [34, 42, 69] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 170 } },
  });

  doc.save(`${safeFilename(filename)}.pdf`);
}
