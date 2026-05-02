/**
 * lib/auth-server.ts
 *
 * Helper unifié pour identifier l'utilisateur connecté côté serveur.
 *
 * Pendant la transition (Phase 5), Kooach accepte deux modes d'authentification :
 *   1. Session Supabase Auth (cookies HTTP-only) — nouveau système
 *   2. Token HMAC en body JSON (legacy magic link) — ancien système
 *
 * Cette fonction retourne l'email de l'utilisateur authentifié, peu importe
 * le mode utilisé. Les routes API peuvent ainsi servir les nouveaux et les
 * anciens utilisateurs sans dupliquer la logique.
 *
 * Usage :
 *   const email = await getAuthedEmail(req, body);
 *   if (!email) return json({ error: 'Non autorisé' }, 401);
 */

import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getTokenEmail } from '@/lib/token';

/**
 * Tente d'identifier l'utilisateur via Supabase Auth (cookies) puis,
 * en fallback, via le token HMAC dans le body JSON.
 *
 * @param req  La NextRequest (pour lire les cookies)
 * @param body Le body JSON de la requête (pour lire `body.token`)
 */
export async function getAuthedEmail(
  _req: NextRequest,
  body?: Record<string, unknown>,
): Promise<string | null> {
  // 1. Supabase Auth (priorité)
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) return user.email.toLowerCase();
  } catch {
    // Si la session Supabase échoue, on tente le fallback HMAC
  }

  // 2. Fallback HMAC token (legacy magic link)
  if (body && 'token' in body) {
    const email = getTokenEmail(body.token);
    if (email) return email.toLowerCase();
  }

  return null;
}
