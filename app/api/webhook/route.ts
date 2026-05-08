/**
 * app/api/webhook/route.ts
 *
 * Webhook Stripe — reçoit les événements de paiement et de cycle de vie
 * d'abonnement.
 *
 * IMPORTANT : utilise req.text() et non req.json().
 * La signature Stripe est calculée sur le body brut exact reçu par Stripe.
 * Tout re-parsing JSON avant la vérification invaliderait la signature.
 *
 * Événements gérés :
 *   - checkout.session.completed       → crée profil + token + email d'accès
 *   - customer.subscription.deleted    → marque profil inactif (révoque accès)
 *   - customer.subscription.updated    → si statut "canceled"/"unpaid", inactif
 *
 * Idempotence : chaque event_id reçu est stocké dans la table stripe_events.
 * Si Stripe retry l'événement, on skip → pas de double email, pas de doublon DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { makeToken } from '@/lib/token';
import { getSupabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { sendAccessEmail, sendWelcomeEmail, sendTrialEndingEmail } from '@/lib/email';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES STRIPE (minimal — on ne dépend pas du SDK Stripe pour le webhook)
// ─────────────────────────────────────────────────────────────────────────────

interface StripeCheckoutSession {
  id: string;
  customer: string | null;
  subscription: string | null;
  customer_details: { email?: string | null } | null;
  customer_email: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
}

interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession | StripeSubscription };
}

// ─────────────────────────────────────────────────────────────────────────────
// VÉRIFICATION DE SIGNATURE STRIPE
// ─────────────────────────────────────────────────────────────────────────────

function verifyStripe(rawBody: string, header: string, secret: string): boolean {
  const t: string[] = [];
  const sigs: string[] = [];

  header.split(',').forEach((part) => {
    const i = part.indexOf('=');
    const k = part.slice(0, i);
    const v = part.slice(i + 1);
    if (k === 't') t.push(v);
    else if (k === 'v1') sigs.push(v);
  });

  if (!t.length || !sigs.length) return false;

  const expected = createHmac('sha256', secret)
    .update(`${t[0]}.${rawBody}`)
    .digest('hex');

  return sigs.some((s) => {
    try {
      return timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IDEMPOTENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tente d'enregistrer l'event_id. Retourne true si c'est un nouvel event,
 * false si on l'a déjà traité (Stripe l'a renvoyé).
 */
async function recordEvent(eventId: string, type: string): Promise<boolean> {
  const db = getSupabase();
  const { error } = await db.from('stripe_events').insert({
    event_id: eventId,
    type,
  });
  // Code 23505 = unique violation Postgres → déjà inséré → doublon
  if (error && error.code === '23505') return false;
  if (error) {
    console.error('webhook: erreur insert stripe_events —', error.message);
    // En cas d'erreur DB on laisse passer (préfère re-traiter qu'ignorer)
    return true;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS PAR TYPE D'ÉVÉNEMENT
// ─────────────────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
  // Priorité au client_reference_id (= email signup Supabase, passé en query
  // param sur le Payment Link via /signup/checkout). C'est la SEULE référence
  // stable au compte Kooach : l'user peut payer via Stripe Link / Apple Pay
  // avec un mail différent, mais le client_reference_id reste celui du signup.
  // Fallback sur customer_details.email pour compat legacy (paiements directs
  // sans passer par /signup/checkout — ex: lien partagé manuellement).
  const email =
    session.client_reference_id ??
    session.customer_details?.email ??
    session.customer_email;
  if (!email) {
    console.error('webhook: email manquant — session', session.id);
    return;
  }
  const normalizedEmail = email.toLowerCase();

  const db = getSupabase();

  // 1. Garde anti-écrasement : si un profil avec ce mail existe DÉJÀ avec un
  //    autre stripe_subscription_id actif, on REFUSE l'écrasement. Ce cas se
  //    produit si client_reference_id est null (Payment Link partagé sans
  //    passer par /signup/checkout) ET que le mail Stripe matche un user
  //    Kooach existant. Sans ce guard, on perdrait les IDs Stripe originaux
  //    de cet user (cas observé 2026-05-08 sur le profil FOUNDER).
  const { data: existing } = await db
    .from('profiles')
    .select('stripe_subscription_id, subscription_active, acquisition_source')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (
    existing?.subscription_active &&
    existing.stripe_subscription_id &&
    existing.stripe_subscription_id !== session.subscription
  ) {
    console.error(
      'webhook: refus écrasement — profile existant actif avec sub différente',
      { email: normalizedEmail, existing: existing.stripe_subscription_id, incoming: session.subscription },
    );
    return;
  }

  // 2. Crée/met à jour le profil avec les IDs Stripe + acquisition source
  //    L'acquisition_source vient du cookie UTM (middleware) qu'on a passé en
  //    metadata Stripe à la création de la session checkout. Format compact :
  //    "source=cold|campaign=beta-mai|medium=email". Permet de tracker quel
  //    canal convertit (cold email vs blog vs lead magnet vs Twitter).
  const acquisitionSource = session.metadata?.acquisition_source ?? null;

  // Étape B 2026-05-21 — Bascule no-CC trial :
  //   Le trial 7j est désormais géré côté Kooach (set au signup dans
  //   /api/profile/init). Quand l'user arrive ici (checkout terminé), il
  //   sort du trial et passe payant. On clear trial_end (null) pour que
  //   l'UI cesse d'afficher le countdown trial.
  //
  //   Avant : Stripe gérait le trial → trial_end = now+7d à chaque checkout.
  //   Maintenant : Stripe Checkout = paiement immédiat 29€, donc trial_end null.
  const profileUpdate: Record<string, unknown> = {
    email:                  normalizedEmail,
    stripe_customer_id:     session.customer ?? null,
    stripe_subscription_id: session.subscription ?? null,
    subscription_active:    true,
    trial_end:              null,
    updated_at:             new Date().toISOString(),
  };
  // First-touch wins : ne remplace pas une source déjà set sur le profil.
  // On set uniquement si le profil est nouveau OU n'a pas encore de source.
  const existingWithSource = existing as { acquisition_source?: string | null } | null;
  if (acquisitionSource && !existingWithSource?.acquisition_source) {
    profileUpdate.acquisition_source = acquisitionSource;
  }

  const { error } = await db.from('profiles').upsert(
    profileUpdate,
    { onConflict: 'email' },
  );
  if (error) {
    console.error('webhook: erreur upsert profile —', error.message);
  }

  // 2. Vérifie si l'utilisateur existe dans Supabase Auth.
  //    - S'il existe : il s'est inscrit via /signup avant de payer, rien à faire.
  //    - S'il n'existe pas : paiement direct (legacy ou payment link), on l'invite
  //      à définir son mot de passe via Supabase. Si l'invite échoue (Supabase Auth
  //      non configuré, etc.), on retombe sur le système magic link HMAC.
  let supabaseUserExists = false;
  try {
    const { data: { users } } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    supabaseUserExists = users.some((u) => u.email?.toLowerCase() === normalizedEmail);
  } catch (e) {
    console.error('webhook: erreur listUsers —', e instanceof Error ? e.message : e);
  }

  if (!supabaseUserExists) {
    // Pas de compte Auth → on invite (Supabase enverra un mail "définis ton mot de passe")
    try {
      await db.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo: 'https://kooach.fr/auth/reset-password',
      });
      return; // Mail Supabase envoyé, pas besoin du magic link legacy
    } catch (e) {
      console.error('webhook: erreur invite Supabase —', e instanceof Error ? e.message : e);
      // Fallback : envoie le magic link HMAC pour que l'utilisateur ne soit pas bloqué
      try {
        const token = makeToken(normalizedEmail);
        await sendAccessEmail(normalizedEmail, token);
      } catch (e2) {
        console.error('webhook: erreur fallback magic link —', e2 instanceof Error ? e2.message : e2);
      }
    }
    return;
  }

  // L'user Supabase existe déjà (cas standard signup → checkout) : on envoie
  // un welcome email avec lien direct /app + 3 conseils + invitation à répondre.
  // Sans ça, le coach paye et ne reçoit AUCUN mail → red flag immédiat.
  try {
    await sendWelcomeEmail(normalizedEmail);
  } catch (e) {
    console.error('webhook: erreur welcome email —', e instanceof Error ? e.message : e);
  }
}

async function handleSubscriptionDeleted(sub: StripeSubscription): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from('profiles')
    .update({
      subscription_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', sub.customer);

  if (error) {
    console.error('webhook: erreur update profile (deletion) —', error.message);
  }
}

/**
 * Handler `customer.subscription.trial_will_end` — Stripe envoie cet event
 * 3 JOURS avant la fin du trial. C'est le moment critique de conversion :
 * sans rappel, l'user oublie qu'il a un trial = chargeback OU abandon par
 * défaut. Avec rappel = +10-30% conversion trial→paid (data ChartMogul 2026).
 */
async function handleTrialWillEnd(sub: StripeSubscription): Promise<void> {
  const db = getSupabase();

  // Lookup email via stripe_customer_id (le payload sub n'a pas l'email)
  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('stripe_customer_id', sub.customer)
    .maybeSingle();

  if (!profile?.email) {
    console.error('webhook: trial_will_end — pas de profil pour customer', sub.customer);
    return;
  }

  try {
    await sendTrialEndingEmail(profile.email);
  } catch (e) {
    console.error('webhook: erreur trial-ending email —', e instanceof Error ? e.message : e);
  }
}

async function handleSubscriptionUpdated(sub: StripeSubscription): Promise<void> {
  // Statuts qui doivent désactiver l'accès : canceled, unpaid, incomplete_expired
  const inactiveStatuses = new Set(['canceled', 'unpaid', 'incomplete_expired']);
  const active = !inactiveStatuses.has(sub.status);

  const db = getSupabase();
  const { error } = await db
    .from('profiles')
    .update({
      subscription_active: active,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', sub.customer);

  if (error) {
    console.error('webhook: erreur update profile (update) —', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let secret: string;
  try {
    secret = env.STRIPE_WEBHOOK_SECRET;
  } catch {
    return NextResponse.json({ error: 'Configuration invalide.' }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  if (!verifyStripe(rawBody, sig, secret)) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
  }

  // Idempotence : skip si on a déjà traité cet event
  const isNew = await recordEvent(event.id, event.type);
  if (!isNew) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as StripeCheckoutSession);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.trial_will_end':
        // Stripe envoie cet event 3 jours avant la fin du trial → email rappel
        await handleTrialWillEnd(event.data.object as StripeSubscription);
        break;

      // Stripe exige un 200 pour tous les autres événements
    }
  } catch (e) {
    console.error('webhook: erreur handler —', event.type, e instanceof Error ? e.message : e);
    // 200 quand même : ne pas faire retry Stripe sur une erreur applicative
  }

  return NextResponse.json({ received: true });
}
