import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const navigate = useNavigate();
  const {
    session,
    loading,
    cloudEnabled,
    signInWithGoogle,
    signInWithIdentifier,
    signInWithIdentifierAndPassword,
  } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudEnabled || loading) return;
    if (session) navigate("/", { replace: true });
  }, [cloudEnabled, loading, session, navigate]);

  const onGoogle = async () => {
    setMsg(null);
    setBusy(true);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) setMsg(error.message);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const { error } = usePassword
      ? await signInWithIdentifierAndPassword(identifier, password)
      : await signInWithIdentifier(identifier);
    setBusy(false);
    if (error) setMsg(error.message);
    else navigate("/", { replace: true });
  };

  if (!cloudEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Sinkron cloud belum diaktifkan</h1>
          <p className="text-sm text-slate-500 mb-6">
            Tambahkan <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> dan{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> di file{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">.env</code>, lalu bangun ulang aplikasi. Tanpa itu,
            simulasi hanya tersimpan di perangkat ini (localStorage).
          </p>
          <Link
            to="/"
            className="inline-block py-3 px-6 rounded-xl font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-colors"
          >
            Lanjut ke kalkulator
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-maybank-yellow flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg className="w-8 h-8 text-maybank-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Simulasi Kredit Mobil</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">
          <button
            type="button"
            onClick={() => void onGoogle()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Lanjutkan dengan Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-white px-2 text-slate-400">atau email / nama pengguna</span>
            </div>
          </div>

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <label className="block text-xs font-medium text-slate-600">Email atau nama pengguna</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nama@email.com atau budi_santoso"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
            />

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => {
                  setUsePassword(e.target.checked);
                  if (!e.target.checked) setPassword("");
                }}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-400"
              />
              <span className="text-xs font-medium text-slate-600">Gunakan kata sandi saya</span>
            </label>

            {usePassword && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kata sandi</label>
                <input
                  type="password"
                  required={usePassword}
                  autoComplete={usePassword ? "current-password" : "off"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-maybank-dark text-white hover:bg-maybank-blue transition-colors disabled:opacity-50"
            >
              {busy ? "Memproses…" : "Masuk"}
            </button>
          </form>

          {msg && <p className="text-xs text-center text-red-600">{msg}</p>}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="w-full py-3 rounded-xl font-semibold text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Lanjut tanpa login
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Data akan disimpan di browser ini. Anda bisa login kapan saja untuk sinkron ke cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
