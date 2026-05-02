/**
 * app/auth/callback/route.ts
 *
 * Route handler appelée par Supabase après confirmation d'email (signup) ou
 * lien magique. On échange le `code` (PKCE) contre une session, puis on
 * redirige vers la page suivante.
 *
 * Query params attendus :
 *   - code: string (PKCE code) — fourni par Supabase
 *   - next: string (URL de redirection après auth) — optionnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si pas de code ou échec d'échange : retour login avec message d'erreur
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
