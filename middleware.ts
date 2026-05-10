/**
 * middleware.ts
 *
 * Middleware Next.js qui :
 *   1. Rafraîchit automatiquement la session Supabase Auth (refresh token)
 *   2. Capture les UTM params en cookie 30j (attribution acquisition)
 *
 * Sans le refresh, les access tokens expirent silencieusement et l'utilisateur
 * se voit déconnecté. Sans la capture UTM, on ne sait pas quel canal convertit
 * (cold email vs blog vs lead magnet vs Twitter).
 *
 * On exclut les routes statiques et le webhook Stripe (pas de cookies).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const UTM_COOKIE  = 'kk_utm';
const UTM_PARAMS  = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
const UTM_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/**
 * Capture les UTM params de l'URL si présents et les écrit en cookie kk_utm.
 * Le cookie est stocké en JSON compact pour préserver tous les params (utile
 * pour discrimer cold|beta-mai vs blog|article-1 vs lead-magnet|hooks-J0).
 *
 * Si le cookie existe déjà ET aucune nouvelle UTM dans l'URL, on ne touche pas
 * (premier touchpoint gagne — le canal de découverte initial est plus signifiant).
 */
function captureUtm(req: NextRequest, response: NextResponse): void {
  const url    = req.nextUrl;
  const params = url.searchParams;

  // Cherche au moins un UTM param dans l'URL
  const found: Record<string, string> = {};
  for (const key of UTM_PARAMS) {
    const v = params.get(key);
    if (v && v.length > 0 && v.length < 200) {
      found[key] = v;
    }
  }

  if (Object.keys(found).length === 0) return; // rien à capturer

  // First-touch wins : si cookie déjà set, on ne le remplace pas
  if (req.cookies.get(UTM_COOKIE)) return;

  found.captured_at = new Date().toISOString();

  response.cookies.set({
    name:     UTM_COOKIE,
    value:    JSON.stringify(found),
    maxAge:   UTM_MAX_AGE,
    path:     '/',
    sameSite: 'lax',
    httpOnly: false, // lisible côté client si besoin (debug, analytics)
    secure:   process.env.NODE_ENV === 'production',
  });
}

export async function middleware(req: NextRequest) {
  // 🚧 MAINTENANCE MODE — projet Kooach en pause (reset OS 22/05/2026).
  // Toutes les routes (sauf assets statiques et webhook Stripe via matcher)
  // sont rewrite vers /maintenance. Pour réactiver : retirer ce bloc.
  if (req.nextUrl.pathname !== '/maintenance') {
    return NextResponse.rewrite(new URL('/maintenance', req.url));
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Lit l'utilisateur courant (refresh token automatique si nécessaire)
  await supabase.auth.getUser();

  // Capture les UTM params en cookie 30j (premier touchpoint gagne)
  captureUtm(req, response);

  return response;
}

// Exclut les routes statiques et le webhook Stripe (qui n'a pas besoin de session)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|eot)$).*)',
  ],
};
