export type CalcMode = "dp_percent" | "dp_amount" | "total_dp";
export type AsuransiMode = "pct_total" | "pct_per_year" | "rupiah";

export interface CalcInputs {
  name: string;
  otr: string;
  calcMode: CalcMode;
  dpPercent: string;
  dpAmount: string;
  totalDpInput: string;
  rateFix: string;
  asuransiMode: AsuransiMode;
  asuransiPercent: string;
  asuransiPerYear: string;
  asuransiAmount: string;
  tenor: string;
  administrasi: string;
  creditLife: string;
  tjh: string;
  capitalizeOnRisk: string;
}

export interface CalcResults {
  pureDP: number;
  dpPercentCalc: number;
  phUnit: number;
  asuransiCash: number;
  plafonKredit: number;
  installment: number;
  installmentExact: number;
  totalDP: number;
  adminVal: number;
  creditLifeVal: number;
  tjhVal: number;
  tenorMonths: number;
  sisaAngsuran: number;
  totalPinjaman: number;
  totalBunga: number;
  corVal: number;
  sisaAngsuranTotal: number;
  totalUangKeluar: number;
}

export interface SavedCalculation {
  id: string;
  savedAt: string;
  inputs: CalcInputs;
  results: CalcResults;
}

// --- Utility functions ---

export function formatRupiah(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "Rp 0";
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export function formatNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "0";
  return Math.round(value).toLocaleString("id-ID");
}

export function parseInputNumber(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatInputDisplay(value: string): string {
  const cleaned = value.replace(/\./g, "").replace(/[^0-9]/g, "");
  if (!cleaned) return "";
  return parseInt(cleaned, 10).toLocaleString("id-ID");
}

// --- localStorage helpers ---

const STORAGE_KEY = "simulasi-kredit-saved";

export function loadSavedCalculations(): SavedCalculation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCalculation(calc: SavedCalculation): void {
  const existing = loadSavedCalculations();
  existing.unshift(calc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function updateCalculation(calc: SavedCalculation): void {
  const existing = loadSavedCalculations();
  const idx = existing.findIndex((c) => c.id === calc.id);
  if (idx !== -1) {
    existing[idx] = calc;
  } else {
    existing.unshift(calc);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCalculation(id: string): void {
  const existing = loadSavedCalculations();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing.filter((c) => c.id !== id))
  );
}

export function calculate(inputs: CalcInputs): CalcResults | null {
  const otrVal = parseInputNumber(inputs.otr);
  const rateVal = parseFloat(inputs.rateFix) / 100 || 0;
  const asuransiPct = parseFloat(inputs.asuransiPercent) / 100 || 0;
  const tenorYears = parseInt(inputs.tenor) || 0;
  const tenorMonths = tenorYears * 12;
  const adminVal = parseInputNumber(inputs.administrasi);
  const creditLifeVal = parseInputNumber(inputs.creditLife);
  const tjhVal = parseInputNumber(inputs.tjh);
  const corVal = parseInputNumber(inputs.capitalizeOnRisk);

  if (otrVal <= 0 || tenorMonths <= 0) return null;

  let asuransiCash: number;
  if (inputs.asuransiMode === "rupiah") {
    asuransiCash = parseInputNumber(inputs.asuransiAmount);
  } else if (inputs.asuransiMode === "pct_per_year") {
    const perYear = parseFloat(inputs.asuransiPerYear) / 100 || 0;
    asuransiCash = otrVal * perYear * tenorYears;
  } else {
    asuransiCash = otrVal * asuransiPct;
  }
  const K = (1 + rateVal * tenorYears) / tenorMonths;

  let pureDP: number;

  if (inputs.calcMode === "dp_percent") {
    const dpPct = parseFloat(inputs.dpPercent) / 100 || 0;
    pureDP = otrVal * dpPct;
  } else if (inputs.calcMode === "dp_amount") {
    pureDP = parseInputNumber(inputs.dpAmount);
  } else {
    const totalDpVal = parseInputNumber(inputs.totalDpInput);
    const numerator =
      totalDpVal - otrVal * K - corVal * K - asuransiCash - adminVal - creditLifeVal - tjhVal;
    const denominator = 1 - K;
    if (Math.abs(denominator) < 1e-10) return null;
    pureDP = numerator / denominator;
  }

  const phUnit = otrVal - pureDP;
  const plafonKredit = phUnit + corVal;
  const installment = plafonKredit * K;
  const installmentRounded = Math.round(installment / 100000) * 100000;
  const totalDP = pureDP + installmentRounded + asuransiCash + adminVal + creditLifeVal + tjhVal;
  const dpPercentCalc = otrVal > 0 ? (pureDP / otrVal) * 100 : 0;
  const sisaAngsuran = tenorMonths - 1;
  const totalPinjaman = installmentRounded * tenorMonths;
  const totalBunga = totalPinjaman - plafonKredit;
  const sisaAngsuranTotal = installmentRounded * sisaAngsuran;
  const totalUangKeluar = totalDP + sisaAngsuranTotal;

  return {
    pureDP,
    dpPercentCalc,
    phUnit,
    asuransiCash,
    plafonKredit,
    installment: installmentRounded,
    installmentExact: installment,
    totalDP,
    adminVal,
    creditLifeVal,
    tjhVal,
    tenorMonths,
    sisaAngsuran,
    totalPinjaman,
    totalBunga,
    corVal,
    sisaAngsuranTotal,
    totalUangKeluar,
  };
}
