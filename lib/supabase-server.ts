/**
 * lib/supabase-server.ts
 *
 * Client Supabase pour le serveur Next.js (Server Components, Route Handlers,
 * Server Actions). Utilise la clé `anon` mais lit/écrit les cookies de
 * session pour reconnaître l'utilisateur connecté.
 *
 * Différent de lib/supabase.ts qui utilise la `service_role` (bypass RLS).
 * Ici, on respecte les RLS — on ne lit que ce que l'user authentifié peut voir.
 *
 * Usage typique :
 *   const supabase = await createSupabaseServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Erreur ignorée : appel depuis un Server Component sans
            // possibilité d'écrire les cookies. Le middleware se charge
            // de rafraîchir les sessions de toute façon.
          }
        },
      },
    },
  );
}
