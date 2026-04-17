/** True when Supabase URL + anon key are set (cloud sync + login enabled). */
export function isCloudEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && String(url).trim() && String(key).trim());
}

/** OAuth / magic-link return URL (must match Supabase Auth redirect allow list). */
export function getAuthRedirectUrl(): string {
  const base = import.meta.env.BASE_URL;
  const path = `${base.replace(/\/?$/, "")}/welcome`;
  return new URL(path, window.location.origin).href;
}

/** Password-recovery return URL (must match Supabase Auth redirect allow list). */
export function getPasswordResetRedirectUrl(): string {
  const base = import.meta.env.BASE_URL;
  const path = `${base.replace(/\/?$/, "")}/reset-password`;
  return new URL(path, window.location.origin).href;
}

/** Full URL to open the calculator with ?load= for a saved id (works with GitHub Pages base). */
export function buildCalculatorLoadUrl(id: string): string {
  const base = import.meta.env.BASE_URL;
  const path = `${base.replace(/\/?$/, "")}/?load=${encodeURIComponent(id)}`;
  return new URL(path, window.location.origin).href;
}
