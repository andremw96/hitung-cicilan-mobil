import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const navigate = useNavigate();
  const { session, loading, cloudEnabled, user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const usesExplicit =
    Boolean((user?.user_metadata as { uses_explicit_password?: boolean } | undefined)?.uses_explicit_password);

  useEffect(() => {
    if (!cloudEnabled || loading) return;
    if (!session) navigate("/welcome", { replace: true });
  }, [cloudEnabled, loading, session, navigate]);

  if (!cloudEnabled) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Sinkron cloud tidak aktif.{" "}
        <Link to="/" className="text-maybank-dark font-medium underline">
          Kembali
        </Link>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-500 text-sm">Memuat…</div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setOk(false);

    const np = newPassword.trim();
    const cpw = confirmPassword.trim();
    if (np.length < 6) {
      setMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (np !== cpw) {
      setMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setBusy(true);
    const { error } = await changePassword({
      newPassword: np,
      currentPassword: usesExplicit ? currentPassword : undefined,
    });
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setOk(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/" className="text-sm text-maybank-dark font-medium hover:underline">
          ← Kembali ke kalkulator
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Akun</h1>
        <p className="text-sm text-slate-500 mt-1">Ganti kata sandi untuk masuk dengan email atau nama pengguna.</p>
      </div>

      {!usesExplicit && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Jika Anda biasanya masuk <strong>tanpa</strong> mengisi kata sandi (masuk cepat), setelah mengganti sandi
          Anda perlu memakai <strong>kata sandi baru</strong> setiap kali masuk. Masuk cepat memakai sandi teknis
          terpisah dan tidak lagi cocok setelah Anda mengatur sandi sendiri.
        </div>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="bg-white rounded-2xl shadow border border-slate-200 p-6 space-y-4">
        {usesExplicit && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kata sandi saat ini</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Kata sandi baru</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Konfirmasi kata sandi baru</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-colors disabled:opacity-50"
        >
          {busy ? "Menyimpan…" : "Simpan kata sandi"}
        </button>

        {msg && <p className="text-xs text-center text-red-600">{msg}</p>}
        {ok && <p className="text-xs text-center text-emerald-600">Kata sandi berhasil diperbarui.</p>}
      </form>
    </div>
  );
}
