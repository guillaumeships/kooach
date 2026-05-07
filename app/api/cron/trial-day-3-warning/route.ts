/**
 * app/api/cron/trial-day-3-warning/route.ts
 *
 * Cron Vercel quotidien — chaque jour à 9h UTC (Étape B no-CC trial).
 *
 * Remplace l'ancien handler webhook Stripe `customer.subscription.trial_will_end`
 * (qui ne se déclenche plus puisque Stripe ne gère plus le trial).
 *
 * Scan profiles dont :
 *   - subscription_active = true
 *   - stripe_subscription_id IS NULL (en trial Kooach, pas encore payé)
 *   - trial_end ∈ [now + 2.5d, now + 3.5d] (fenêtre 24h centrée sur J-3)
 *   - trial_day3_sent_at IS NULL (idempotence)
 *
 * Pour chaque match : envoie sendTrialEndingEmail + set trial_day3_sent_at.
 *
 * Pourquoi 9h UTC : décalé d'1h vs autres crons (10h trial-day-one) pour
 * étaler la charge Resend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendTrialEndingEmail } from '@/lib/email';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const maxDuration = 300;

const DAY_MS = 24 * 60 * 60 * 1000;

interface ProfileRow {
  email: string;
  trial_end: string;
  trial_day3_sent_at: string | null;
  subscription_active: boolean | null;
  stripe_subscription_id: string | null;
}

export async function GET(req: NextRequest) {
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

  // Gotcha #12 : filtre côté JS pour rester safe
  const { data: rows, error: sErr } = await db
    .from('profiles')
    .select('email, trial_end, trial_day3_sent_at, subscription_active, stripe_subscription_id')
    .eq('subscription_active', true)
    .is('stripe_subscription_id', null)
    .is('trial_day3_sent_at', null)
    .not('trial_end', 'is', null);

  if (sErr) {
    return NextResponse.json({ error: 'DB read failed', details: sErr.message }, { status: 500 });
  }

  const candidates = ((rows ?? []) as ProfileRow[]).filter((p) => {
    if (!p.trial_end) return false;
    const trialEndMs = new Date(p.trial_end).getTime();
    const daysUntilEnd = (trialEndMs - now) / DAY_MS;
    // Fenêtre [2.5j, 3.5j] avant la fin du trial — 1 jour de tolérance pour
    // capturer même si le cron skip un run.
    return daysUntilEnd >= 2.5 && daysUntilEnd <= 3.5;
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, total: 0, sent: 0, errors: 0 });
  }

  let sent = 0;
  let errors = 0;
  const errorDetails: Array<{ email: string; error: string }> = [];

  for (const p of candidates) {
    try {
      await sendTrialEndingEmail(p.email);
    } catch (e) {
      errors++;
      errorDetails.push({ email: p.email, error: e instanceof Error ? e.message : 'unknown' });
      continue;
    }

    const { error: updErr } = await db
      .from('profiles')
      .update({ trial_day3_sent_at: new Date(now).toISOString() })
      .eq('email', p.email);

    if (updErr) {
      errors++;
      errorDetails.push({ email: p.email, error: `DB update: ${updErr.message}` });
    } else {
      sent++;
    }

    await sleep(200);
  }

  return NextResponse.json({
    ok: true,
    total: candidates.length,
    sent,
    errors,
    errorDetails: errorDetails.slice(0, 5),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
