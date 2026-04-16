type Props = {
  onDownload: () => Promise<void>;
  disabled?: boolean;
};

export function PdfDownloadRow({ onDownload, disabled }: Props) {
  const handleClick = async () => {
    try {
      await onDownload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengunduh PDF");
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
      <p className="text-xs font-medium text-slate-600">Unduh ringkasan PDF</p>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        className="w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        Download PDF
      </button>
      <p className="text-[11px] text-slate-400 leading-snug">
        Berkas PDF dibuat langsung di browser Anda.
      </p>
    </div>
  );
}
