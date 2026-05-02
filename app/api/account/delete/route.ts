/**
 * app/api/account/delete/route.ts
 *
 * POST /api/account/delete
 *
 * Suppression définitive du compte (RGPD article 17 — droit à l'effacement).
 *
 * Étapes :
 *   1. Annule l'abonnement Stripe immédiatement (cancel_at_period_end: false)
 *   2. Supprime toutes les générations de l'utilisateur
 *   3. Supprime le profil
 *   4. Envoie un email de confirmation
 *
 * Le token côté client n'est pas révocable nativement (HMAC sans état), mais
 * la prochaine requête vers /api/generate échouera car le profil n'existe plus.
 *
 * Corps : { token, confirm: "SUPPRIMER" }
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthedEmail } from '@/lib/auth-server';
import { getSupabase } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { env } from '@/lib/env';
import { sendDeletionConfirmedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const email = await getAuthedEmail(req, body);
  if (!email) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  if (body.confirm !== 'SUPPRIMER') {
    return NextResponse.json(
      { error: 'Confirmation manquante. Envoie le mot SUPPRIMER pour valider.' },
      { status: 400 },
    );
  }

  const db = getSupabase();
  const { data: profile } = await db
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('email', email)
    .maybeSingle();

  // 1. Annulation Stripe (best-effort, non-bloquant)
  if (profile?.stripe_subscription_id && env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (e) {
      // On log mais on continue : la suppression DB doit aboutir même si Stripe est en panne.
      console.error('delete: erreur cancel Stripe —', e instanceof Error ? e.message : e);
    }
  }

  // 2. Suppression cascade des générations (foreign key sur user_email)
  await db.from('generations').delete().eq('user_email', email);

  // 3. Suppression du profil
  const { error: profileErr } = await db.from('profiles').delete().eq('email', email);
  if (profileErr) {
    console.error('delete: erreur suppression profil —', profileErr.message);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression. Contacte-nous à contact@kooach.fr.' },
      { status: 500 },
    );
  }

  // 4. Suppression du user Supabase Auth (admin) + signOut de la session courante
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // signOut côté navigateur (cookies effacés)
      await supabase.auth.signOut();
      // Suppression admin du user (nécessite service_role via lib/supabase)
      await db.auth.admin.deleteUser(user.id);
    }
  } catch (e) {
    console.error('delete: erreur cleanup Supabase Auth —', e instanceof Error ? e.message : e);
  }

  // 5. Email de confirmation (best-effort)
  try {
    await sendDeletionConfirmedEmail(email);
  } catch (e) {
    console.error('delete: erreur email confirmation —', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
