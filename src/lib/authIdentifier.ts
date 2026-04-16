/**
 * Maps "email" or "username" to a Supabase Auth email + deterministic password.
 * Supabase requires an email for email/password auth; usernames use a synthetic domain.
 * Password is never shown to the user (derived from email + pepper).
 */

const USERNAME_EMAIL_DOMAIN = "users.hitung-cicilan.local";

export type NormalizedIdentifier = {
  authEmail: string;
  loginLabel: string;
  kind: "email" | "username";
};

export function normalizeIdentifierInput(raw: string): NormalizedIdentifier {
  const trimmed = raw.trim();
  if (trimmed.length < 2) {
    throw new Error("Minimal 2 karakter.");
  }
  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Format email tidak valid.");
    }
    return { authEmail: email, loginLabel: trimmed, kind: "email" };
  }
  const slug = trimmed
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 48);
  if (!slug) {
    throw new Error("Nama pengguna hanya boleh huruf, angka, titik, _, dan -.");
  }
  return {
    authEmail: `${slug}@${USERNAME_EMAIL_DOMAIN}`,
    loginLabel: trimmed,
    kind: "username",
  };
}

/** Deterministic password for Supabase (user never types it). Pepper should be set in production. */
export async function deriveIdentifierPassword(authEmail: string): Promise<string> {
  const pepper =
    (import.meta.env.VITE_AUTH_IDENTIFIER_PEPPER as string | undefined)?.trim() ||
    "hitung-cicilan-dev-pepper-change-in-env";
  const data = new TextEncoder().encode(`${authEmail}|${pepper}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
