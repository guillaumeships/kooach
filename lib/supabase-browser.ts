/**
 * lib/supabase-browser.ts
 *
 * Client Supabase pour le navigateur. Utilisé dans les composants client
 * (pages /login, /signup, /forgot-password, etc.) pour s'inscrire, se
 * connecter, gérer la session.
 *
 * ⚠️  Utilise la clé `anon` publique (NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * Cette clé est exposée côté navigateur — c'est attendu, Supabase la limite
 * via les RLS policies.
 *
 * Pour la lecture/écriture privilégiée (service_role), utiliser
 * lib/supabase.ts côté serveur uniquement.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
