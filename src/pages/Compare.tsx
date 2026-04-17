import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  type CalcMode,
  type AsuransiMode,
  type CalcInputs,
  type CalcResults,
  type SavedCalculation,
  calculate,
  formatRupiah,
  formatNumber,
  formatInputDisplay,
} from "../types";
import { useSimulations } from "../context/SimulationsContext";
import { downloadCompareSimulationPdf } from "../lib/pdfSummary";
import { PdfDownloadRow } from "../components/PdfDownloadRow";

function InlineRupiah({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative inline-flex w-full max-w-[160px] mx-auto">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatInputDisplay(value)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
          onChange(raw);
        }}
        className="w-full pl-6 pr-1 py-1 border border-slate-200 rounded text-xs text-right font-mono font-medium text-slate-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white"
      />
    </div>
  );
}

function InlinePercent({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative inline-flex w-full max-w-[100px] mx-auto">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="0.01"
        min="0"
        className="w-full pl-1 pr-5 py-1 border border-slate-200 rounded text-xs text-right font-mono font-medium text-slate-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">%</span>
    </div>
  );
}

function InlineNumber({ value, onChange, suffix }: { value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <div className="relative inline-flex w-full max-w-[100px] mx-auto">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="1"
        max="8"
        step="1"
        className="w-full pl-1 pr-10 py-1 border border-slate-200 rounded text-xs text-right font-mono font-medium text-slate-800 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">{suffix}</span>
    </div>
  );
}

function ModeToggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded max-w-[180px] mx-auto">
      {options.map(([m, l]) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`flex-1 py-0.5 text-[10px] font-medium rounded transition-all ${
            value === m ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

type InputField = {
  key: string;
  label: string;
  type: "rupiah" | "percent" | "tenor" | "dp_mode" | "dp_value" | "asuransi_mode" | "asuransi_value";
  inputKey: keyof CalcInputs;
};

const inputFields: InputField[] = [
  { key: "otr", label: "OTR", type: "rupiah", inputKey: "otr" },
  { key: "dp_mode", label: "Mode DP", type: "dp_mode", inputKey: "calcMode" },
  { key: "dp_value", label: "Nilai DP", type: "dp_value", inputKey: "dpPercent" },
  { key: "rateFix", label: "Rate Fix", type: "percent", inputKey: "rateFix" },
  { key: "tenor", label: "Tenor", type: "tenor", inputKey: "tenor" },
  { key: "asuransi_mode", label: "Mode Asuransi", type: "asuransi_mode", inputKey: "asuransiMode" },
  { key: "asuransi_value", label: "Nilai Asuransi", type: "asuransi_value", inputKey: "asuransiPercent" },
  { key: "administrasi", label: "Administrasi", type: "rupiah", inputKey: "administrasi" },
  { key: "creditLife", label: "Credit Life", type: "rupiah", inputKey: "creditLife" },
  { key: "tjh", label: "TJH", type: "rupiah", inputKey: "tjh" },
];

type ResultField = {
  label: string;
  getValue: (r: CalcResults, i: CalcInputs) => string;
  highlight?: boolean;
  getNumeric?: (r: CalcResults, i: CalcInputs) => number;
  isBest?: (v: number[]) => number;
};

const resultFields: ResultField[] = [
  { label: "DP Murni", getValue: (r) => formatRupiah(r.pureDP), getNumeric: (r) => r.pureDP, isBest: (v) => v.indexOf(Math.min(...v)) },
  { label: "DP %", getValue: (r) => r.dpPercentCalc.toFixed(2) + "%" },
  { label: "Asuransi Cash", getValue: (r) => formatRupiah(r.asuransiCash) },
  { label: "PH Unit", getValue: (r) => formatRupiah(r.phUnit) },
  { label: "Plafon Kredit", getValue: (r) => formatRupiah(r.plafonKredit) },
  { label: "Cicilan / Bulan", getValue: (r) => formatRupiah(r.installment), highlight: true, getNumeric: (r) => r.installment, isBest: (v) => v.indexOf(Math.min(...v)) },
  { label: "Sisa Angsuran", getValue: (r) => r.sisaAngsuran + " bulan" },
  { label: "Total Bayar Pertama", getValue: (r) => formatRupiah(r.totalDP), highlight: true, getNumeric: (r) => r.totalDP, isBest: (v) => v.indexOf(Math.min(...v)) },
  { label: "Total Pinjaman", getValue: (r) => formatRupiah(r.totalPinjaman) },
  { label: "Total Bunga", getValue: (r) => formatRupiah(r.totalBunga), getNumeric: (r) => r.totalBunga, isBest: (v) => v.indexOf(Math.min(...v)) },
  { label: "Grand Total Keluar", getValue: (r) => formatRupiah(r.totalUangKeluar), highlight: true, getNumeric: (r) => r.totalUangKeluar, isBest: (v) => v.indexOf(Math.min(...v)) },
  {
    label: "Selisih dari OTR",
    getValue: (r, i) => {
      const otr = parseFloat(i.otr) || 1;
      const diff = r.totalUangKeluar - otr;
      return "+" + formatNumber(diff) + " (" + ((diff / otr) * 100).toFixed(1) + "%)";
    },
    getNumeric: (r, i) => r.totalUangKeluar - (parseFloat(i.otr) || 0),
    isBest: (v) => v.indexOf(Math.min(...v)),
  },
];

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { calculations, loading, usingCloud } = useSimulations();

  const idsParam = searchParams.get("ids") || "";
  const ids = useMemo(() => idsParam.split(",").filter(Boolean), [idsParam]);

  const initialItems = useMemo(() => {
    return ids.map((id) => calculations.find((c) => c.id === id)).filter(Boolean) as SavedCalculation[];
  }, [ids, calculations]);

  const [columns, setColumns] = useState<CalcInputs[]>([]);

  useEffect(() => {
    const idList = idsParam.split(",").filter(Boolean);
    const items = idList
      .map((id) => calculations.find((c) => c.id === id))
      .filter(Boolean) as SavedCalculation[];
    if (items.length >= 2) {
      void Promise.resolve().then(() => {
        setColumns(items.map((item) => ({ ...item.inputs })));
      });
    }
  }, [idsParam, calculations]);

  const updateColumn = (colIdx: number, key: keyof CalcInputs, value: string) => {
    setColumns((prev) => {
      const next = [...prev];
      next[colIdx] = { ...next[colIdx], [key]: value };
      return next;
    });
  };

  const results: (CalcResults | null)[] = useMemo(
    () => columns.map((c) => calculate(c)),
    [columns]
  );

  const validPairs = useMemo(() => {
    const pairs: { idx: number; inputs: CalcInputs; results: CalcResults }[] = [];
    columns.forEach((inputs, idx) => {
      const r = results[idx];
      if (r) pairs.push({ idx, inputs, results: r });
    });
    return pairs;
  }, [columns, results]);

  if (ids.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Perbandingan</h2>
        <p className="text-sm text-slate-400 mb-4">Pilih minimal 2 simulasi dari halaman Tersimpan untuk membandingkan.</p>
        <button onClick={() => navigate("/saved")} className="py-2.5 px-6 rounded-lg font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-all">
          Ke Halaman Tersimpan
        </button>
      </div>
    );
  }

  if (usingCloud && loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">Memuat simulasi…</div>
    );
  }

  if (initialItems.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Perbandingan</h2>
        <p className="text-sm text-slate-400 mb-4">
          Satu atau lebih simulasi tidak ditemukan (mungkin sudah dihapus). Pilih ulang dari halaman Tersimpan.
        </p>
        <button onClick={() => navigate("/saved")} className="py-2.5 px-6 rounded-lg font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-all">
          Ke Halaman Tersimpan
        </button>
      </div>
    );
  }

  if (columns.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">Menyiapkan tabel…</div>
    );
  }

  const dpValueKey = (mode: CalcMode): keyof CalcInputs =>
    mode === "dp_percent" ? "dpPercent" : mode === "dp_amount" ? "dpAmount" : "totalDpInput";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Perbandingan Simulasi</h2>
          <p className="text-sm text-slate-400">Edit langsung di tabel, hasil otomatis terhitung</p>
        </div>
        <button
          onClick={() => navigate("/saved")}
          className="py-2.5 px-4 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
      </div>

      <div className="mb-5">
        <PdfDownloadRow
          onDownload={() =>
            downloadCompareSimulationPdf(
              "perbandingan-simulasi-kredit",
              "Perbandingan Simulasi Kredit",
              validPairs.map(({ inputs, results }) => ({
                label: inputs.name || "Simulasi",
                inputs,
                results,
              }))
            )
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-maybank-dark to-maybank-blue">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 min-w-[150px] sticky left-0 bg-maybank-dark z-10">
                  Parameter
                </th>
                {columns.map((col, i) => (
                  <th key={i} className="text-center py-3 px-3 min-w-[200px]">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => updateColumn(i, "name", e.target.value)}
                      className="w-full max-w-[180px] mx-auto block bg-white/10 border border-white/20 rounded px-2 py-1 text-sm font-bold text-white text-center placeholder-white/50 focus:ring-1 focus:ring-amber-400 outline-none"
                      placeholder={"Simulasi " + (i + 1)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* INPUT SECTION */}
              <tr className="bg-amber-50 border-y border-amber-200">
                <td colSpan={columns.length + 1} className="py-2 px-4 text-xs font-bold text-amber-700 uppercase tracking-wider sticky left-0 bg-amber-50 z-10">
                  Input Parameter
                </td>
              </tr>

              {inputFields.map((field) => (
                <tr key={field.key} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2 px-4 text-sm text-slate-600 sticky left-0 bg-white z-10">
                    {field.label}
                  </td>
                  {columns.map((col, ci) => (
                    <td key={ci} className="py-2 px-3 text-center">
                      {field.type === "rupiah" && (
                        <InlineRupiah value={String(col[field.inputKey] ?? "")} onChange={(v) => updateColumn(ci, field.inputKey, v)} />
                      )}
                      {field.type === "percent" && (
                        <InlinePercent value={String(col[field.inputKey] ?? "")} onChange={(v) => updateColumn(ci, field.inputKey, v)} />
                      )}
                      {field.type === "tenor" && (
                        <InlineNumber value={String(col[field.inputKey] ?? "")} onChange={(v) => updateColumn(ci, field.inputKey, v)} suffix="thn" />
                      )}
                      {field.type === "dp_mode" && (
                        <ModeToggle<CalcMode> value={col.calcMode} onChange={(v) => updateColumn(ci, "calcMode", v)} options={[["dp_percent", "%"], ["dp_amount", "Rp"], ["total_dp", "Total"]]} />
                      )}
                      {field.type === "dp_value" && (
                        col.calcMode === "dp_percent"
                          ? <InlinePercent value={col.dpPercent} onChange={(v) => updateColumn(ci, "dpPercent", v)} />
                          : <InlineRupiah value={String(col[dpValueKey(col.calcMode)] ?? "")} onChange={(v) => updateColumn(ci, dpValueKey(col.calcMode), v)} />
                      )}
                      {field.type === "asuransi_mode" && (
                        <ModeToggle<AsuransiMode> value={col.asuransiMode ?? "pct_total"} onChange={(v) => updateColumn(ci, "asuransiMode", v)} options={[["pct_total", "% Total"], ["pct_per_year", "%/Thn"], ["rupiah", "Rp"]]} />
                      )}
                      {field.type === "asuransi_value" && (
                        (col.asuransiMode ?? "pct_total") === "pct_total"
                          ? <InlinePercent value={col.asuransiPercent} onChange={(v) => updateColumn(ci, "asuransiPercent", v)} />
                          : (col.asuransiMode) === "pct_per_year"
                          ? <InlinePercent value={col.asuransiPerYear} onChange={(v) => updateColumn(ci, "asuransiPerYear", v)} />
                          : <InlineRupiah value={col.asuransiAmount} onChange={(v) => updateColumn(ci, "asuransiAmount", v)} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* RESULTS SECTION */}
              <tr className="bg-emerald-50 border-y border-emerald-200">
                <td colSpan={columns.length + 1} className="py-2 px-4 text-xs font-bold text-emerald-700 uppercase tracking-wider sticky left-0 bg-emerald-50 z-10">
                  Hasil Perhitungan
                </td>
              </tr>

              {resultFields.map((field, ri) => {
                const nums = field.getNumeric
                  ? validPairs.map((p) => field.getNumeric!(p.results, p.inputs))
                  : [];
                const bestValidIdx = field.isBest && nums.length > 1 ? field.isBest(nums) : -1;
                const bestColIdx = bestValidIdx >= 0 ? validPairs[bestValidIdx]?.idx : -1;

                return (
                  <tr
                    key={ri}
                    className={`border-b border-slate-100 ${field.highlight ? "bg-slate-50" : ""}`}
                  >
                    <td className={`py-3 px-4 text-sm sticky left-0 z-10 ${field.highlight ? "font-bold text-slate-800 bg-slate-50" : "text-slate-600 bg-white"}`}>
                      {field.label}
                    </td>
                    {columns.map((_, ci) => {
                      const r = results[ci];
                      const inp = columns[ci];
                      if (!r) {
                        return <td key={ci} className="py-3 px-3 text-center text-xs text-slate-400">-</td>;
                      }
                      const isBest = bestColIdx === ci;
                      return (
                        <td key={ci} className={`py-3 px-3 text-center text-sm font-mono tabular-nums ${field.highlight ? "font-bold" : ""}`}>
                          <span className={isBest ? "text-green-700 font-bold" : "text-slate-700"}>
                            {field.getValue(r, inp)}
                          </span>
                          {isBest && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                              Terbaik
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Difference summary */}
      {validPairs.length === 2 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Selisih Perbandingan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DiffCard label="Cicilan / Bulan" a={validPairs[0].results.installment} b={validPairs[1].results.installment} nameA={validPairs[0].inputs.name} nameB={validPairs[1].inputs.name} />
            <DiffCard label="Total Bayar Pertama" a={validPairs[0].results.totalDP} b={validPairs[1].results.totalDP} nameA={validPairs[0].inputs.name} nameB={validPairs[1].inputs.name} />
            <DiffCard label="Grand Total Keluar" a={validPairs[0].results.totalUangKeluar} b={validPairs[1].results.totalUangKeluar} nameA={validPairs[0].inputs.name} nameB={validPairs[1].inputs.name} />
          </div>
        </div>
      )}
    </div>
  );
}

function DiffCard({ label, a, b, nameA, nameB }: { label: string; a: number; b: number; nameA: string; nameB: string }) {
  const diff = Math.abs(a - b);
  const cheaper = a < b ? nameA : nameB;
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold font-mono tabular-nums text-slate-800">{formatRupiah(diff)}</p>
      {diff > 0 ? (
        <p className="text-xs text-green-600 mt-1"><span className="font-semibold">{cheaper || "Simulasi 1"}</span> lebih murah</p>
      ) : (
        <p className="text-xs text-slate-400 mt-1">Sama</p>
      )}
    </div>
  );
}
