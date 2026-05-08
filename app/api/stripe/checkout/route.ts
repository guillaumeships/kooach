/**
 * app/api/stripe/checkout/route.ts
 *
 * GET /api/stripe/checkout
 *
 * Crée une Stripe Checkout Session pour l'utilisateur authentifié et redirige
 * vers son URL de paiement.
 *
 * Pourquoi via API et pas un Payment Link statique :
 *   Les Payment Links statiques (buy.stripe.com/...) ignorent silencieusement
 *   le query param `client_reference_id` quand l'user paye via Stripe Link /
 *   Apple Pay (le mail Stripe écrase la référence). Conséquence : on n'avait
 *   AUCUN moyen fiable de lier le paiement au compte Supabase Auth, et le
 *   webhook créait des profils sur le mauvais email (cf gotcha #25).
 *
 *   Avec une Checkout Session créée via API, `client_reference_id` est
 *   garanti dans le payload du webhook (Stripe ne le perd jamais).
 *
 * Sécurité : route auth-gated (Supabase Auth cookie). Si pas de user
 * authentifié -> redirect /login.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { env } from '@/lib/env';

// Prix Pro 29€/mois (configuré côté Stripe Dashboard)
// Le trial 7j est désormais géré côté Kooach via /api/profile/init (no-CC trial).
// Stripe Checkout démarre une sub PAYÉE immédiatement quand le trial Kooach est terminé.
const PRICE_PRO = 'price_1TSIaPLREN5AzLTrVmZDhWSX';

/**
 * Lit le cookie kk_utm posé par middleware.ts et retourne une chaîne compacte
 * pour metadata Stripe. Format : "source=cold|campaign=beta-mai|medium=email".
 * Stripe metadata accepte 50 clés max et 500 chars / value, on reste safe.
 */
function readUtmFromCookie(req: NextRequest): { acquisition_source?: string } {
  const raw = req.cookies.get('kk_utm')?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const parts: string[] = [];
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref']) {
      if (parsed[k]) parts.push(`${k.replace(/^utm_/, '')}=${parsed[k]}`);
    }
    if (parts.length === 0) return {};
    return { acquisition_source: parts.join('|').slice(0, 480) };
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.redirect('https://kooach.fr/login?next=/api/stripe/checkout');
  }

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Configuration Stripe incomplète.' },
      { status: 500 },
    );
  }

  // Récupère l'attribution depuis le cookie UTM (middleware) — passée en
  // metadata Stripe pour que le webhook puisse la persister sur le profil.
  const utm = readUtmFromCookie(req);

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_PRO, quantity: 1 }],
      // Pré-rempli ET stable : Stripe ne permet pas de changer customer_email
      // au checkout (même avec Link auto-fill qui peut afficher un autre mail
      // pour la facturation, Stripe utilise customer_email pour le compte).
      customer_email:       user.email,
      // Référence stable au compte Supabase. Le webhook lit ça en priorité.
      client_reference_id:  user.email,
      success_url:          'https://kooach.fr/success',
      cancel_url:           'https://kooach.fr/app/upgrade',
      allow_promotion_codes: true,
      // Pas de subscription_data.trial_period_days — le trial 7j Kooach a déjà
      // eu lieu (cf. /api/profile/init). Stripe Checkout = paiement immédiat 29€.
      metadata: utm,
    });

    if (!session.url) {
      throw new Error('Session URL manquante');
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (e) {
    console.error('stripe/checkout: erreur —', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Impossible de créer la session de paiement. Réessaie.' },
      { status: 502 },
    );
  }
}
