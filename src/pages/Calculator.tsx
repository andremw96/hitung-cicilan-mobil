import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  type CalcMode,
  type AsuransiMode,
  type CalcInputs,
  calculate,
  formatRupiah,
  formatNumber,
  formatInputDisplay,
  parseInputNumber,
} from "../types";
import { useSimulations } from "../context/SimulationsContext";
import { newSavedCalculationId } from "../lib/newSavedId";
import { downloadSingleSimulationPdf } from "../lib/pdfSummary";
import { PdfDownloadRow } from "../components/PdfDownloadRow";

function RupiahInput({
  label,
  value,
  onChange,
  placeholder,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    onChange(raw);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatInputDisplay(value)}
          onChange={handleChange}
          placeholder={placeholder || "0"}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-right text-slate-800 font-medium"
        />
      </div>
      {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
  );
}

function PercentInput({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          step={step || "0.01"}
          min="0"
          className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-right text-slate-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
          %
        </span>
      </div>
      {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  bold,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`flex justify-between items-start py-2.5 px-3 rounded-lg ${
        highlight ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"
      }`}
    >
      <div>
        <span
          className={`text-sm ${
            bold ? "font-semibold text-slate-800" : "text-slate-600"
          }`}
        >
          {label}
        </span>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
      <span
        className={`text-sm font-mono tabular-nums ${
          highlight
            ? "font-bold text-amber-700"
            : bold
            ? "font-semibold text-slate-800"
            : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { calculations, saveCalculation, updateCalculation } = useSimulations();

  const loadId = searchParams.get("load");
  const loadedCalc = useMemo(
    () => (loadId ? calculations.find((c) => c.id === loadId) ?? null : null),
    [loadId, calculations]
  );
  const lastAppliedLoadId = useRef<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [otr, setOtr] = useState("");
  const [calcMode, setCalcMode] = useState<CalcMode>("total_dp");
  const [dpPercent, setDpPercent] = useState("");
  const [dpAmount, setDpAmount] = useState("");
  const [totalDpInput, setTotalDpInput] = useState("");
  const [rateFix, setRateFix] = useState("");
  const [asuransiMode, setAsuransiMode] = useState<AsuransiMode>("pct_total");
  const [asuransiPercent, setAsuransiPercent] = useState("");
  const [asuransiPerYear, setAsuransiPerYear] = useState("");
  const [asuransiAmount, setAsuransiAmount] = useState("");
  const [tenor, setTenor] = useState("");
  const [administrasi, setAdministrasi] = useState("");
  const [creditLife, setCreditLife] = useState("");
  const [tjh, setTjh] = useState("");
  const [useCOR, setUseCOR] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "updated">("idle");

  useEffect(() => {
    if (!loadId) {
      lastAppliedLoadId.current = null;
      return;
    }
    if (!loadedCalc || loadedCalc.id !== loadId) return;
    if (lastAppliedLoadId.current === loadId) return;
    lastAppliedLoadId.current = loadId;
    const i = loadedCalc.inputs;
    void Promise.resolve().then(() => {
      setEditId(loadedCalc.id);
      setName(i.name);
      setOtr(i.otr);
      setCalcMode(i.calcMode);
      setDpPercent(i.dpPercent);
      setDpAmount(i.dpAmount);
      setTotalDpInput(i.totalDpInput);
      setRateFix(i.rateFix);
      setAsuransiMode(i.asuransiMode);
      setAsuransiPercent(i.asuransiPercent);
      setAsuransiPerYear(i.asuransiPerYear);
      setAsuransiAmount(i.asuransiAmount);
      setTenor(i.tenor);
      setAdministrasi(i.administrasi);
      setCreditLife(i.creditLife);
      setTjh(i.tjh);
      setUseCOR(i.useCOR ?? false);
    });
  }, [loadId, loadedCalc]);

  const inputs: CalcInputs = {
    name,
    otr,
    calcMode,
    dpPercent,
    dpAmount,
    totalDpInput,
    rateFix,
    asuransiMode,
    asuransiPercent,
    asuransiPerYear,
    asuransiAmount,
    tenor,
    administrasi,
    creditLife,
    tjh,
    useCOR,
  };

  const results = calculate(inputs);

  const handleModeChange = useCallback((mode: CalcMode) => {
    setCalcMode(mode);
  }, []);

  const handleSave = async () => {
    if (!results) return;
    try {
      if (editId) {
        await updateCalculation({
          id: editId,
          savedAt: new Date().toISOString(),
          inputs,
          results,
        });
        setSaveStatus("updated");
      } else {
        const id = newSavedCalculationId();
        await saveCalculation({ id, savedAt: new Date().toISOString(), inputs, results });
        setEditId(id);
        setSaveStatus("saved");
      }
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  const handleSaveAsNew = async () => {
    if (!results) return;
    try {
      const id = newSavedCalculationId();
      await saveCalculation({ id, savedAt: new Date().toISOString(), inputs, results });
      setEditId(id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-3 space-y-5">
          {/* Name */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Nama Simulasi
            </h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Avanza 2026 - Pak Budi"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-slate-800 font-medium"
            />
            <p className="text-xs text-slate-400 mt-1">
              Beri nama untuk menyimpan simulasi ini
            </p>
          </div>

          {/* OTR */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">1</span>
              Harga Kendaraan
            </h2>
            <RupiahInput
              label="OTR (On The Road)"
              value={otr}
              onChange={setOtr}
              placeholder="320400000"
              helpText="Harga kendaraan sebelum diskon"
            />
          </div>

          {/* Down Payment Mode */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
              Down Payment
            </h2>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4">
              {([["dp_percent", "DP %"], ["dp_amount", "DP Nominal"], ["total_dp", "Total DP"]] as const).map(
                ([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      calcMode === mode
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
            {calcMode === "dp_percent" && (
              <PercentInput label="Persentase DP" value={dpPercent} onChange={setDpPercent} placeholder="20" helpText="Persentase dari harga OTR" />
            )}
            {calcMode === "dp_amount" && (
              <RupiahInput label="Nominal DP Murni" value={dpAmount} onChange={setDpAmount} placeholder="64080000" helpText="Nominal DP murni (belum termasuk biaya lain)" />
            )}
            {calcMode === "total_dp" && (
              <RupiahInput label="Total DP yang Diinginkan" value={totalDpInput} onChange={setTotalDpInput} placeholder="100000000" helpText="Total bayar pertama termasuk angsuran, asuransi, admin, dll" />
            )}
          </div>

          {/* Loan Parameters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>
              Parameter Kredit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PercentInput label="Rate Fix (per tahun)" value={rateFix} onChange={setRateFix} placeholder="2.78" helpText="Suku bunga tetap per tahun" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenor</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tenor}
                    onChange={(e) => setTenor(e.target.value)}
                    placeholder="3"
                    min="1"
                    max="8"
                    step="1"
                    className="w-full pl-4 pr-16 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-right text-slate-800 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">tahun</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">= {(parseInt(tenor) || 0) * 12} bulan</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Asuransi</label>
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                  {([["pct_total", "% Total"], ["pct_per_year", "% / Tahun"], ["rupiah", "Rupiah"]] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setAsuransiMode(mode)}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                        asuransiMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {asuransiMode === "pct_total" && (
                  <PercentInput label="Total %" value={asuransiPercent} onChange={setAsuransiPercent} placeholder="5.37" helpText="Total persentase dari OTR" />
                )}
                {asuransiMode === "pct_per_year" && (
                  <PercentInput label="% per Tahun" value={asuransiPerYear} onChange={setAsuransiPerYear} placeholder="1.79" helpText={`× ${tenor || "?"} tahun = ${((parseFloat(asuransiPerYear) || 0) * (parseInt(tenor) || 0)).toFixed(2)}% total`} />
                )}
                {asuransiMode === "rupiah" && (
                  <RupiahInput label="Nominal Asuransi" value={asuransiAmount} onChange={setAsuransiAmount} placeholder="17205480" helpText="Total biaya asuransi" />
                )}
                <label className="flex items-center gap-2 cursor-pointer select-none mt-3">
                  <input
                    type="checkbox"
                    checked={useCOR}
                    onChange={(e) => setUseCOR(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                  />
                  <span className="text-xs font-medium text-slate-600">Capitalize on Risk</span>
                  {useCOR && results && (
                    <span className="text-xs text-slate-400 ml-auto font-mono tabular-nums">{formatRupiah(results.corVal)}</span>
                  )}
                </label>
                {useCOR && (
                  <p className="text-[11px] text-slate-400 mt-1 ml-6">
                    Asuransi % × PH Unit, ditambahkan ke plafon kredit.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Fees */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">4</span>
              Biaya Tambahan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RupiahInput label="Administrasi" value={administrasi} onChange={setAdministrasi} placeholder="8000000" />
              <RupiahInput label="Credit Life" value={creditLife} onChange={setCreditLife} placeholder="3498758" helpText="Asuransi jiwa kredit" />
              <RupiahInput label="TJH" value={tjh} onChange={setTjh} placeholder="300000" helpText="Titipan Jaminan Hidup" />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-4">
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Simulasi Pembiayaan
            </h2>
            <p className="text-xs text-slate-400 mb-4">Metode ADDM (flat rate)</p>

            {results ? (
              <div className="space-y-1">
                {name && (
                  <div className="mb-3 pb-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-amber-700 px-3">{name}</p>
                  </div>
                )}

                <div className="pb-3 border-b border-slate-100">
                  <ResultRow label="OTR" value={formatRupiah(parseInputNumber(otr))} bold />
                  <ResultRow label="Down Payment Murni" value={formatRupiah(results.pureDP)} sub={`${results.dpPercentCalc.toFixed(2)}% dari OTR`} />
                  <ResultRow label="PH Unit" value={formatRupiah(results.phUnit)} sub="Pokok Hutang Unit" />
                </div>

                <div className="py-3 border-b border-slate-100">
                  <ResultRow label="Asuransi Cash" value={formatRupiah(results.asuransiCash)} sub={
                    asuransiMode === "pct_total" ? `${asuransiPercent}% × OTR` :
                    asuransiMode === "pct_per_year" ? `${asuransiPerYear}%/thn × ${tenor} thn` :
                    "Nominal"
                  } />
                  <ResultRow label="Capitalize on Risk" value={formatRupiah(results.corVal)} />
                  <ResultRow label="Plafon Kredit" value={formatRupiah(results.plafonKredit)} bold sub="PH Unit + Capitalize on Risk" />
                </div>

                <div className="py-3 border-b border-slate-100">
                  <ResultRow label="Rate Fix" value={`${rateFix}% / tahun`} />
                  <ResultRow label="Tenor" value={`${tenor} tahun (${results.tenorMonths} bulan)`} />
                  <ResultRow label="Cicilan / Bulan" value={formatRupiah(results.installment)} highlight sub={`Exact: ${formatRupiah(results.installmentExact)}`} />
                  <ResultRow label="Sisa Angsuran" value={`${results.sisaAngsuran} × bulan`} sub="Setelah bayar pertama" />
                </div>

                {/* Bayar Pertama */}
                <div className="pt-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Bayar Pertama</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-0.5">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Down Payment</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.pureDP)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Angsuran ke-1</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.installment)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Asuransi Cash</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.asuransiCash)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Administrasi</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.adminVal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Credit Life</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.creditLifeVal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">TJH</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.tjhVal)}</span></div>
                    <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
                      <span className="font-bold text-slate-800">Total</span>
                      <span className="font-bold font-mono tabular-nums text-amber-700 text-lg">{formatRupiah(results.totalDP)}</span>
                    </div>
                  </div>
                </div>

                {/* Info Tambahan */}
                <div className="pt-3 mt-2 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Info Tambahan</h3>
                  <ResultRow label="Total Pinjaman" value={formatRupiah(results.totalPinjaman)} sub={`${results.tenorMonths} × ${formatNumber(results.installment)}`} />
                  <ResultRow label="Total Bunga" value={formatRupiah(results.totalBunga)} sub="Total Pinjaman - Plafon Kredit" />
                </div>

                {/* Total Uang Keluar */}
                <div className="pt-3 mt-2 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">Total Uang Keluar</h3>
                  <div className="bg-red-50 rounded-lg p-3 space-y-0.5">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Bayar Pertama</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.totalDP)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Sisa Angsuran ({results.sisaAngsuran} bulan)</span><span className="font-mono tabular-nums text-slate-700">{formatNumber(results.sisaAngsuranTotal)}</span></div>
                    <div className="border-t border-red-200 mt-2 pt-2 flex justify-between">
                      <span className="font-bold text-slate-800">Grand Total</span>
                      <span className="font-bold font-mono tabular-nums text-red-700 text-lg">{formatRupiah(results.totalUangKeluar)}</span>
                    </div>
                    <p className="text-xs text-slate-400 pt-1">
                      Selisih dari OTR:{" "}
                      <span className="font-medium text-red-600">+{formatRupiah(results.totalUangKeluar - parseInputNumber(otr))}</span>
                      {" "}({((results.totalUangKeluar / parseInputNumber(otr) - 1) * 100).toFixed(1)}% lebih mahal)
                    </p>
                  </div>
                </div>

                {/* Edit indicator */}
                {editId && (
                  <div className="pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs text-blue-700 font-medium">Mengedit simulasi tersimpan</span>
                    </div>
                  </div>
                )}

                {/* Save Buttons */}
                <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSave()}
                      disabled={!name.trim()}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        saveStatus === "saved" || saveStatus === "updated"
                          ? "bg-green-500 text-white"
                          : name.trim()
                          ? "bg-maybank-dark text-white hover:bg-maybank-blue"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {saveStatus === "saved" ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Tersimpan!
                        </>
                      ) : saveStatus === "updated" ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Diperbarui!
                        </>
                      ) : editId ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Simpan Perubahan
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                          Simpan Simulasi
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate("/saved")}
                      className="py-3 px-4 rounded-lg font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Lihat Tersimpan
                    </button>
                  </div>
                  {editId && name.trim() && (
                    <button
                      onClick={() => void handleSaveAsNew()}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Simpan Sebagai Baru
                    </button>
                  )}
                  {!name.trim() && results && (
                    <p className="text-xs text-amber-600 px-1">Isi nama simulasi untuk menyimpan</p>
                  )}

                  {results && (
                    <PdfDownloadRow
                      onDownload={() =>
                        downloadSingleSimulationPdf(
                          `simulasi-kredit-${name.trim() || "tanpa-nama"}`,
                          `Simulasi Kredit: ${name.trim() || "Tanpa nama"}`,
                          inputs,
                          results
                        )
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Masukkan data untuk melihat simulasi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
