/**
 * lib/internal-auth.ts
 *
 * Helper d'auth pour les routes /internal/* et /api/internal/* (founder-only).
 *
 * 2 modes d'auth supportés :
 *   1. Header `x-internal-secret` matched à env.INTERNAL_API_SECRET (curl/scripts)
 *   2. Session Supabase Auth + email ∈ FOUNDER_EMAILS (mini-UI interne)
 *
 * FOUNDER_EMAILS = env var comma-separated (ex: "moi@x.com,co@y.com").
 */

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { env } from '@/lib/env';

// Liste chargée depuis env.FOUNDER_EMAILS (comma-separated). Repo public =
// on ne hardcode plus l'email founder dans le code source.
export function getFounderEmails(): readonly string[] {
  return (process.env.FOUNDER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false;
  return getFounderEmails().includes(email.toLowerCase());
}

/**
 * Vérifie si la requête est authentifiée comme founder (cookie Supabase Auth).
 * Retourne l'email si OK, null sinon.
 */
export async function getFounderEmail(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    const email = user.email.toLowerCase();
    return isFounder(email) ? email : null;
  } catch {
    return null;
  }
}

/**
 * Auth combinée pour les routes API internes. Accepte :
 *   - x-internal-secret header (curl, scripts)
 *   - Supabase Auth cookie + email founder (UI interne)
 *
 * Retourne true si autorisé.
 */
export async function isAuthorizedInternalCall(req: Request): Promise<boolean> {
  // Mode 1 : header secret
  const provided = req.headers.get('x-internal-secret');
  const expected = env.INTERNAL_API_SECRET;
  if (expected && provided && provided === expected) {
    return true;
  }

  // Mode 2 : Supabase Auth founder
  const email = await getFounderEmail();
  return email !== null;
}
