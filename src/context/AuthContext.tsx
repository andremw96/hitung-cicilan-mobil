import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, isCloudEnabled } from "../lib/cloudConfig";
import { getSupabase } from "../lib/supabase";
import { deriveIdentifierPassword, normalizeIdentifierInput } from "../lib/authIdentifier";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  cloudEnabled: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  /** Email atau nama pengguna, tanpa kata sandi yang diketik user (kata sandi teknis dihasilkan di perangkat). */
  signInWithIdentifier: (identifier: string) => Promise<{ error: Error | null }>;
  /** Sama seperti identifier, tetapi memakai kata sandi yang Anda pilih (daftar otomatis jika belum ada akun). */
  signInWithIdentifierAndPassword: (
    identifier: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cloudEnabled = isCloudEnabled();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => cloudEnabled);

  useEffect(() => {
    if (!cloudEnabled) return;
    const sb = getSupabase();
    if (!sb) {
      void Promise.resolve().then(() => setLoading(false));
      return;
    }

    void sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [cloudEnabled]);

  const signInWithGoogle = useCallback(async () => {
    if (!cloudEnabled) return { error: new Error("Cloud tidak diaktifkan") };
    const sb = getSupabase();
    if (!sb) return { error: new Error("Supabase tidak tersedia") };
    const redirectTo = getAuthRedirectUrl();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    return { error: error ? new Error(error.message) : null };
  }, [cloudEnabled]);

  const signInWithIdentifier = useCallback(
    async (identifier: string) => {
      if (!cloudEnabled) return { error: new Error("Cloud tidak diaktifkan") };
      const sb = getSupabase();
      if (!sb) return { error: new Error("Supabase tidak tersedia") };

      let authEmail: string;
      let loginLabel: string;
      let kind: "email" | "username";
      try {
        const n = normalizeIdentifierInput(identifier);
        authEmail = n.authEmail;
        loginLabel = n.loginLabel;
        kind = n.kind;
      } catch (e) {
        return { error: e instanceof Error ? e : new Error("Input tidak valid") };
      }

      const password = await deriveIdentifierPassword(authEmail);

      const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (!signInErr && signInData.session) {
        await sb.auth.updateUser({
          data: { login_label: loginLabel, login_kind: kind },
        });
        return { error: null };
      }

      const msg = signInErr?.message ?? "";
      const looksUnknown =
        /invalid login credentials|invalid email or password|email not confirmed/i.test(msg) ||
        signInErr?.code === "invalid_credentials";

      if (!looksUnknown && signInErr) {
        return { error: new Error(signInErr.message) };
      }

      const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: { login_label: loginLabel, login_kind: kind },
        },
      });

      if (signUpErr) {
        if (/already been registered|already exists|user already/i.test(signUpErr.message)) {
          const retry = await sb.auth.signInWithPassword({ email: authEmail, password });
          if (retry.error) return { error: new Error(retry.error.message) };
          return { error: null };
        }
        return { error: new Error(signUpErr.message) };
      }

      if (signUpData.session) {
        return { error: null };
      }

      const retry = await sb.auth.signInWithPassword({ email: authEmail, password });
      if (retry.error) {
        return {
          error: new Error(
            "Akun dibuat tetapi belum ada sesi. Di Supabase: Authentication → Providers → Email, matikan konfirmasi email (Confirm email) untuk pengembangan, lalu coba lagi."
          ),
        };
      }
      return { error: null };
    },
    [cloudEnabled]
  );

  const signInWithIdentifierAndPassword = useCallback(
    async (identifier: string, password: string) => {
      if (!cloudEnabled) return { error: new Error("Cloud tidak diaktifkan") };
      const sb = getSupabase();
      if (!sb) return { error: new Error("Supabase tidak tersedia") };

      const trimmedPw = password.trim();
      if (trimmedPw.length < 6) {
        return { error: new Error("Kata sandi minimal 6 karakter.") };
      }

      let authEmail: string;
      let loginLabel: string;
      let kind: "email" | "username";
      try {
        const n = normalizeIdentifierInput(identifier);
        authEmail = n.authEmail;
        loginLabel = n.loginLabel;
        kind = n.kind;
      } catch (e) {
        return { error: e instanceof Error ? e : new Error("Input tidak valid") };
      }

      const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
        email: authEmail,
        password: trimmedPw,
      });

      if (!signInErr && signInData.session) {
        await sb.auth.updateUser({
          data: { login_label: loginLabel, login_kind: kind, uses_explicit_password: true },
        });
        return { error: null };
      }

      const msg = signInErr?.message ?? "";
      const looksUnknown =
        /invalid login credentials|invalid email or password|email not confirmed/i.test(msg) ||
        signInErr?.code === "invalid_credentials";

      if (!looksUnknown && signInErr) {
        return { error: new Error(signInErr.message) };
      }

      const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
        email: authEmail,
        password: trimmedPw,
        options: {
          data: { login_label: loginLabel, login_kind: kind, uses_explicit_password: true },
        },
      });

      if (signUpErr) {
        if (/already been registered|already exists|user already/i.test(signUpErr.message)) {
          return {
            error: new Error(
              "Akun sudah ada. Jika Anda pernah masuk tanpa kata sandi, kosongkan opsi kata sandi dan gunakan “Masuk” cepat, atau masukkan kata sandi yang benar."
            ),
          };
        }
        return { error: new Error(signUpErr.message) };
      }

      if (signUpData.session) {
        return { error: null };
      }

      const retry = await sb.auth.signInWithPassword({ email: authEmail, password: trimmedPw });
      if (retry.error) {
        return {
          error: new Error(
            retry.error.message ?? "Gagal masuk dengan kata sandi"
          ),
        };
      }
      return { error: null };
    },
    [cloudEnabled]
  );

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      cloudEnabled,
      signInWithGoogle,
      signInWithIdentifier,
      signInWithIdentifierAndPassword,
      signOut,
    }),
    [
      session,
      loading,
      cloudEnabled,
      signInWithGoogle,
      signInWithIdentifier,
      signInWithIdentifierAndPassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
