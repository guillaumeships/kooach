/**
 * lib/supabase.ts
 *
 * Client Supabase avec la clé service_role (bypass RLS).
 *
 * Pattern singleton lazy : le client est créé à la première utilisation,
 * pas au chargement du module. Cela évite que createClient() soit appelé
 * pendant le build Next.js, quand les variables d'env ne sont pas encore
 * disponibles.
 *
 * Usage dans une route API :
 *   import { getSupabase } from '@/lib/supabase'
 *   const db = getSupabase()
 *   const { data, error } = await db.from('profiles').select('*')...
 *
 * ATTENTION : ne jamais importer ce fichier dans du code client (navigateur).
 * La service_role key ne doit jamais être exposée côté front.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Re-export des types pour simplifier les imports dans les routes
// → import { getSupabase, type Profile } from '@/lib/supabase'
export type {
  Profile,
  Generation,
  GenerationInput,
  GenerationResult,
} from '@/types/database';

// Instance unique — null jusqu'au premier appel de getSupabase()
let _client: SupabaseClient | null = null;

/**
 * Retourne le client Supabase, en le créant au premier appel.
 * Les appels suivants retournent la même instance (singleton).
 */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          // On gère l'auth manuellement avec les tokens HMAC — on désactive la gestion Supabase
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return _client;
}
