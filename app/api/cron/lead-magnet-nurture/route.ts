/**
 * app/api/cron/lead-magnet-nurture/route.ts
 *
 * Cron Vercel quotidien — chaque jour à 09h UTC.
 * Envoie la séquence J1/J3/J7 aux subscribers du lead magnet.
 *
 * Logique idempotente :
 *   - Pour chaque subscriber non-unsubscribed
 *   - Calcule daysSinceCreated = (now - created_at)
 *   - Si daysSinceCreated >= 7 ET email_j7_sent_at IS NULL → envoie J7
 *   - Sinon si daysSinceCreated >= 3 ET email_j3_sent_at IS NULL → envoie J3
 *   - Sinon si daysSinceCreated >= 1 ET email_j1_sent_at IS NULL → envoie J1
 *   - On envoie 1 email max par jour par user (priorité au plus avancé)
 *   - Set le timestamp correspondant après envoi (idempotence)
 *
 * Skip aussi si un subscriber a 7 jours d'écart entre 2 emails déjà envoyés
 * (anti-spam : on ne renvoie jamais un J3 qui aurait été manqué après J7).
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendNurtureJ1Email, sendNurtureJ3Email, sendNurtureJ7Email } from '@/lib/email-nurture';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const maxDuration = 300;

interface SubscriberRow {
  email: string;
  niche: string | null;
  topic: string | null;
  goal: string | null;
  created_at: string;
  email_j1_sent_at: string | null;
  email_j3_sent_at: string | null;
  email_j7_sent_at: string | null;
  unsubscribed_at: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  // ── Auth Vercel cron ──────────────────────────────────────────────────────
  const auth = req.headers.get('authorization') ?? '';
  const expected = env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabase();
  const now = Date.now();

  // ── Liste des subscribers non-unsubscribed ───────────────────────────────
  // Note : on filtre les rows complètement traitées (J1+J3+J7 envoyés) en JS
  // après fetch — le .or() Supabase JS combiné à .is() ne ramenait rien.
  const { data: subs, error: sErr } = await db
    .from('lead_magnet_subscribers')
    .select('email, niche, topic, goal, created_at, email_j1_sent_at, email_j3_sent_at, email_j7_sent_at, unsubscribed_at')
    .is('unsubscribed_at', null);

  if (sErr) {
    return NextResponse.json({ error: 'DB read failed', details: sErr.message }, { status: 500 });
  }

  const eligible = ((subs ?? []) as SubscriberRow[]).filter(
    (s) => s.email_j1_sent_at === null || s.email_j3_sent_at === null || s.email_j7_sent_at === null,
  );
  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, total: 0, sent: { j1: 0, j3: 0, j7: 0 }, errors: 0 });
  }

  let sentJ1 = 0, sentJ3 = 0, sentJ7 = 0, errors = 0;
  const errorDetails: Array<{ email: string; step: string; error: string }> = [];

  for (const sub of eligible) {
    const days = Math.floor((now - new Date(sub.created_at).getTime()) / DAY_MS);
    const args = { email: sub.email, niche: sub.niche, topic: sub.topic };

    // Détermine l'étape à envoyer maintenant — priorité au plus avancé
    let step: 'j1' | 'j3' | 'j7' | null = null;
    if (days >= 7 && !sub.email_j7_sent_at) step = 'j7';
    else if (days >= 3 && !sub.email_j3_sent_at) step = 'j3';
    else if (days >= 1 && !sub.email_j1_sent_at) step = 'j1';

    if (!step) continue;

    let result: { ok: boolean; error?: string };
    if (step === 'j1') result = await sendNurtureJ1Email(args);
    else if (step === 'j3') result = await sendNurtureJ3Email(args);
    else result = await sendNurtureJ7Email(args);

    if (!result.ok) {
      errors++;
      errorDetails.push({ email: sub.email, step, error: result.error ?? 'unknown' });
      // Pas de timestamp set → réessaye demain (best-effort retry)
      continue;
    }

    // Marque l'envoi côté DB pour idempotence
    const tsCol =
      step === 'j7' ? 'email_j7_sent_at'
      : step === 'j3' ? 'email_j3_sent_at'
      : 'email_j1_sent_at';

    const { error: updErr } = await db
      .from('lead_magnet_subscribers')
      .update({ [tsCol]: new Date(now).toISOString() })
      .eq('email', sub.email);

    if (updErr) {
      errors++;
      errorDetails.push({ email: sub.email, step, error: `DB update: ${updErr.message}` });
    } else {
      if (step === 'j1') sentJ1++;
      else if (step === 'j3') sentJ3++;
      else sentJ7++;
    }

    // Throttle 200ms pour Resend rate limit (10 req/s)
    await sleep(200);
  }

  return NextResponse.json({
    ok: true,
    total: eligible.length,
    sent: { j1: sentJ1, j3: sentJ3, j7: sentJ7 },
    errors,
    errorDetails: errorDetails.slice(0, 5),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
