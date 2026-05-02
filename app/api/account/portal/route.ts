/**
 * app/api/account/portal/route.ts
 *
 * POST /api/account/portal
 *
 * Génère une URL one-shot vers le Stripe Customer Portal pour que l'utilisateur
 * puisse gérer son abonnement (annuler, changer de carte, voir les factures)
 * sans qu'on ait à coder ces écrans.
 *
 * Corps : { token }
 * Retour : { url: "https://billing.stripe.com/p/session/..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthedEmail } from '@/lib/auth-server';
import { getSupabase } from '@/lib/supabase';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // Body vide accepté quand l'auth est Supabase (cookie)
  }

  const email = await getAuthedEmail(req, body);
  if (!email) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  // STRIPE_SECRET_KEY est nécessaire pour cette route — message clair si absente
  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Configuration Stripe incomplète.' },
      { status: 500 },
    );
  }

  const db = getSupabase();
  const { data: profile } = await db
    .from('profiles')
    .select('stripe_customer_id')
    .eq('email', email)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun abonnement Stripe trouvé pour ce compte." },
      { status: 404 },
    );
  }

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: 'https://kooach.fr/app',
      // Si STRIPE_PORTAL_CONFIG_ID est défini, on utilise cette config.
      // Sinon Stripe utilise la config par défaut.
      ...(env.STRIPE_PORTAL_CONFIG_ID ? { configuration: env.STRIPE_PORTAL_CONFIG_ID } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('portal: erreur Stripe —', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Impossible de créer la session de gestion. Réessaie.' },
      { status: 502 },
    );
  }
}
