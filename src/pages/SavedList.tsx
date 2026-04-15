import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  type SavedCalculation,
  loadSavedCalculations,
  deleteCalculation,
  formatRupiah,
} from "../types";

type SortKey = "date" | "name" | "otr" | "installment" | "totalDP" | "totalKeluar";
type SortDir = "asc" | "desc";

export default function SavedList() {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<SavedCalculation[]>(loadSavedCalculations);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback((id: string) => {
    deleteCalculation(id);
    setCalculations(loadSavedCalculations());
    setConfirmDeleteId(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    let list = calculations;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.inputs.name.toLowerCase().includes(q) ||
          c.inputs.otr.includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
          break;
        case "name":
          cmp = (a.inputs.name || "").localeCompare(b.inputs.name || "");
          break;
        case "otr":
          cmp = (parseFloat(a.inputs.otr) || 0) - (parseFloat(b.inputs.otr) || 0);
          break;
        case "installment":
          cmp = a.results.installment - b.results.installment;
          break;
        case "totalDP":
          cmp = a.results.totalDP - b.results.totalDP;
          break;
        case "totalKeluar":
          cmp = a.results.totalUangKeluar - b.results.totalUangKeluar;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [calculations, search, sortKey, sortDir]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "date", label: "Tanggal" },
    { key: "name", label: "Nama" },
    { key: "otr", label: "OTR" },
    { key: "installment", label: "Cicilan" },
    { key: "totalDP", label: "Total DP" },
    { key: "totalKeluar", label: "Total Keluar" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Simulasi Tersimpan</h2>
          <p className="text-sm text-slate-400">
            {calculations.length} simulasi disimpan di browser ini
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size >= 2 && (
            <button
              onClick={() => navigate(`/compare?ids=${[...selectedIds].join(",")}`)}
              className="py-2.5 px-4 rounded-lg font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Bandingkan ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="py-2.5 px-4 rounded-lg font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Simulasi Baru
          </button>
        </div>
      </div>

      {calculations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Belum ada simulasi</h3>
          <p className="text-sm text-slate-400 mb-4">Buat simulasi baru dan simpan untuk melihatnya di sini.</p>
          <button onClick={() => navigate("/")} className="py-2.5 px-6 rounded-lg font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-all">
            Buat Simulasi
          </button>
        </div>
      ) : (
        <>
          {/* Search & Sort Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama simulasi..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none text-sm text-slate-700"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleSort(opt.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      sortKey === opt.key
                        ? "bg-maybank-dark text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                    {sortKey === opt.key && (
                      <span className="text-[10px]">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {selectedIds.size > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                {selectedIds.size} dipilih untuk perbandingan {selectedIds.size < 2 && "— pilih minimal 2"}
              </p>
            )}
          </div>

          {/* Grid Cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Tidak ada simulasi yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((calc) => {
                const isSelected = selectedIds.has(calc.id);
                return (
                  <div
                    key={calc.id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-5 hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"
                    }`}
                    onClick={() => toggleSelect(calc.id)}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">
                          {calc.inputs.name || "Tanpa Nama"}
                        </h3>
                        <p className="text-xs text-slate-400">{formatDate(calc.savedAt)}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2 mt-0.5 ${
                          isSelected ? "bg-amber-400 border-amber-400" : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Key Numbers */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">OTR</span>
                        <span className="text-sm font-mono tabular-nums font-semibold text-slate-700">
                          {formatRupiah(parseFloat(calc.inputs.otr) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50 rounded-lg px-2 py-1.5">
                        <span className="text-xs text-amber-600 font-medium">Cicilan/bln</span>
                        <span className="text-sm font-mono tabular-nums font-bold text-amber-700">
                          {formatRupiah(calc.results.installment)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Total DP</span>
                        <span className="text-sm font-mono tabular-nums font-semibold text-slate-700">
                          {formatRupiah(calc.results.totalDP)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-red-50 rounded-lg px-2 py-1.5">
                        <span className="text-xs text-red-500 font-medium">Total Keluar</span>
                        <span className="text-sm font-mono tabular-nums font-bold text-red-700">
                          {formatRupiah(calc.results.totalUangKeluar)}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 flex-wrap text-[11px] text-slate-400 mb-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{calc.inputs.tenor} thn</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{calc.inputs.rateFix}%</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">DP {calc.results.dpPercentCalc.toFixed(1)}%</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => window.open(window.location.origin + "/?load=" + calc.id, "_blank")}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-200"
                      >
                        Buka
                      </button>
                      {confirmDeleteId === calc.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(calc.id)}
                            className="py-2 px-3 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                          >
                            Yakin?
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(calc.id)}
                          className="py-2 px-3 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
