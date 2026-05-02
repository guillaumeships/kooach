/**
 * app/api/profile/init/route.ts
 *
 * POST /api/profile/init — appelé depuis /signup juste après auth.signUp() réussi.
 *
 * Crée le profil DB avec :
 *   - email           = l'email du user authentifié (Supabase Auth)
 *   - trial_end       = now + 7 jours
 *   - subscription_active = true (accès complet pendant le trial)
 *   - stripe_customer_id / stripe_subscription_id = null (pas de Stripe)
 *   - acquisition_source = depuis le cookie kk_utm (middleware)
 *
 * Idempotent : si un profil existe déjà pour cet email (rejouage signup,
 * webhook qui a couru avant, etc.), on ne touche RIEN — on retourne juste
 * l'état actuel.
 *
 * Pourquoi cette route :
 *   Avant Étape B (mai 2026), le profil était créé uniquement par le webhook
 *   Stripe `checkout.session.completed`. Avec le passage au no-CC trial 7j,
 *   on a besoin que le profil existe DÈS le signup pour que l'user puisse
 *   utiliser /app sans avoir payé.
 *
 * Sécurité : route auth-gated (Supabase Auth cookie). Service role utilisée
 * pour bypass RLS et insérer dans profiles (RLS = service_role only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabase } from '@/lib/supabase';

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function readUtmFromCookie(req: NextRequest): string | null {
  const raw = req.cookies.get('kk_utm')?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const parts: string[] = [];
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref']) {
      if (parsed[k]) parts.push(`${k.replace(/^utm_/, '')}=${parsed[k]}`);
    }
    if (parts.length === 0) return null;
    return parts.join('|').slice(0, 480);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const email = user.email.toLowerCase();
  const db = getSupabase();

  // Idempotence : si le profil existe déjà, on retourne tel quel
  const { data: existing } = await db
    .from('profiles')
    .select('email, trial_end, subscription_active, stripe_customer_id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      created: false,
      trial_end: existing.trial_end,
      subscription_active: existing.subscription_active,
      has_stripe_customer: Boolean(existing.stripe_customer_id),
    });
  }

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString();
  const acquisitionSource = readUtmFromCookie(req);

  const insert: Record<string, unknown> = {
    email,
    trial_end:           trialEnd,
    subscription_active: true,
    stripe_customer_id:  null,
    stripe_subscription_id: null,
    updated_at:          new Date().toISOString(),
  };
  if (acquisitionSource) insert.acquisition_source = acquisitionSource;

  const { error } = await db.from('profiles').insert(insert);

  if (error) {
    // Cas race condition : profile inséré entre notre select et insert
    if (error.code === '23505') {
      return NextResponse.json({
        ok: true,
        created: false,
        trial_end: trialEnd,
        subscription_active: true,
        has_stripe_customer: false,
      });
    }
    console.error('profile/init: erreur insert —', error.message);
    return NextResponse.json({ error: 'Erreur création profil.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    created: true,
    trial_end: trialEnd,
    subscription_active: true,
    has_stripe_customer: false,
  });
}
