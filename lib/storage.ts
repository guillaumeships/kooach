/** Local storage keys + helpers. Centralise tout pour pas avoir de string magic partout. */

export const TOKEN_KEY = 'kk_t';
export const PROFILE_KEY = 'kk_profile';
export const RELOAD_KEY = 'kk_reload_result';

export interface SavedProfile {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
  posts: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function authBody(): { token?: string } {
  const t = getToken();
  return t ? { token: t } : {};
}

export function clearLocalAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
