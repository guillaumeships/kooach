/**
 * app/api/cron/trial-day-one/route.ts
 *
 * Cron Vercel quotidien — chaque jour à 10h UTC.
 * Envoie l'email J+1 d'onboarding aux users qui ont démarré leur trial
 * il y a 24-72h et qui ne l'ont pas encore reçu.
 *
 * Logique idempotente :
 *   - Scan profiles avec trial_end IS NOT NULL ET day_one_sent_at IS NULL
 *   - trial_start = trial_end - 7d (calcul JS, pas SQL)
 *   - daysSinceTrialStart ∈ [1, 4) → envoie + set day_one_sent_at
 *   - Filet de sécurité : ne pas spammer un trial vieux de >4 jours
 *     (cas migration future, backfill, etc.)
 *
 * Pourquoi 10h UTC : décalé d'1h vs lead-magnet-nurture (9h UTC) pour
 * éviter de saturer Resend rate limit (10 req/s) si jamais un user a
 * souscrit au lead magnet AVANT de prendre le trial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendDayOneEmail } from '@/lib/email';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const maxDuration = 300;

interface ProfileRow {
  email: string;
  trial_end: string;
  day_one_sent_at: string | null;
  subscription_active: boolean | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

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

  // On filtre côté JS pour rester cohérent avec lead-magnet-nurture
  // (gotcha #12 : .is() + .or() combiné ne fonctionne pas en supabase-js)
  const { data: rows, error: sErr } = await db
    .from('profiles')
    .select('email, trial_end, day_one_sent_at, subscription_active')
    .is('day_one_sent_at', null)
    .not('trial_end', 'is', null);

  if (sErr) {
    return NextResponse.json({ error: 'DB read failed', details: sErr.message }, { status: 500 });
  }

  const candidates = ((rows ?? []) as ProfileRow[]).filter((p) => {
    if (!p.trial_end) return false;
    // On garde subscription_active = true (= n'a pas annulé en moins de 24h)
    // Si annulation rapide, pas d'email J+1 (UX : ne pas relancer un user
    // qui vient de dire non).
    if (p.subscription_active === false) return false;
    const trialEndMs = new Date(p.trial_end).getTime();
    const trialStartMs = trialEndMs - TRIAL_DAYS * DAY_MS;
    const daysSinceStart = (now - trialStartMs) / DAY_MS;
    return daysSinceStart >= 1 && daysSinceStart < 4;
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, total: 0, sent: 0, errors: 0 });
  }

  let sent = 0;
  let errors = 0;
  const errorDetails: Array<{ email: string; error: string }> = [];

  for (const p of candidates) {
    try {
      await sendDayOneEmail(p.email);
    } catch (e) {
      errors++;
      errorDetails.push({ email: p.email, error: e instanceof Error ? e.message : 'unknown' });
      continue;
    }

    const { error: updErr } = await db
      .from('profiles')
      .update({ day_one_sent_at: new Date(now).toISOString() })
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
