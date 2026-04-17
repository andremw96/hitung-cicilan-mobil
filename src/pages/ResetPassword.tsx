import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSupabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { cloudEnabled, setNewPassword } = useAuth();
  const [ready, setReady] = useState(false);
  const [recoveryOk, setRecoveryOk] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!cloudEnabled) {
      setReady(true);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }

    let cancelled = false;

    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryOk(true);
        setReady(true);
      }
    });

    void sb.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) setRecoveryOk(true);
      setReady(true);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [cloudEnabled]);

  if (!cloudEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500">
          Sinkron cloud tidak aktif.{" "}
          <Link to="/" className="text-maybank-dark underline font-medium">
            Kembali
          </Link>
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Memverifikasi tautan pemulihan…</p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setOk(false);

    const pw = password.trim();
    const cpw = confirm.trim();
    if (pw.length < 6) {
      setMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (pw !== cpw) {
      setMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setBusy(true);
    const { error } = await setNewPassword(pw);
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    setOk(true);
    setPassword("");
    setConfirm("");
    setTimeout(() => navigate("/", { replace: true }), 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-800">Reset kata sandi</h1>
          <p className="text-xs text-slate-500 mt-1">
            {recoveryOk
              ? "Masukkan kata sandi baru untuk akun Anda."
              : "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk."}
          </p>
        </div>

        {recoveryOk ? (
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kata sandi baru</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Konfirmasi kata sandi</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-colors disabled:opacity-50"
            >
              {busy ? "Menyimpan…" : "Simpan kata sandi baru"}
            </button>

            {msg && <p className="text-xs text-center text-red-600">{msg}</p>}
            {ok && (
              <p className="text-xs text-center text-emerald-600">
                Kata sandi diperbarui. Mengalihkan…
              </p>
            )}
          </form>
        ) : (
          <Link
            to="/welcome"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-colors"
          >
            Ke halaman masuk
          </Link>
        )}
      </div>
    </div>
  );
}
