/**
 * app/api/cron/trial-expired/route.ts
 *
 * Cron Vercel quotidien — chaque jour à 0h UTC (Étape B no-CC trial).
 *
 * Scan profiles dont :
 *   - subscription_active = true
 *   - trial_end < now
 *   - stripe_subscription_id IS NULL
 *
 * Pour chaque match : passe subscription_active = false. L'user perd l'accès
 * à /app (sera redirect vers /app/upgrade) jusqu'à ce qu'il mette sa CB via
 * Stripe Checkout.
 *
 * Pourquoi ce cron : sans Stripe trial_period_days, c'est nous qui devons
 * désactiver l'accès quand le trial Kooach-managed expire. Tourne à 0h UTC
 * pour que la "fin du trial" soit cohérente à la milliseconde près sans
 * dépendre du moment où le cron tourne.
 *
 * Idempotent : si subscription_active est déjà false, le UPDATE est no-op.
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const maxDuration = 60;

interface ProfileRow {
  email: string;
  trial_end: string | null;
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
  const nowIso = new Date().toISOString();

  // Gotcha #12 : on filtre côté JS pour rester safe avec supabase-js
  const { data: rows, error: sErr } = await db
    .from('profiles')
    .select('email, trial_end, subscription_active, stripe_subscription_id')
    .eq('subscription_active', true)
    .is('stripe_subscription_id', null)
    .not('trial_end', 'is', null)
    .lt('trial_end', nowIso);

  if (sErr) {
    return NextResponse.json({ error: 'DB read failed', details: sErr.message }, { status: 500 });
  }

  const candidates = (rows ?? []) as ProfileRow[];

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, total: 0, deactivated: 0 });
  }

  let deactivated = 0;
  let errors = 0;
  const errorDetails: Array<{ email: string; error: string }> = [];

  for (const p of candidates) {
    const { error: updErr } = await db
      .from('profiles')
      .update({
        subscription_active: false,
        updated_at: nowIso,
      })
      .eq('email', p.email);

    if (updErr) {
      errors++;
      errorDetails.push({ email: p.email, error: updErr.message });
    } else {
      deactivated++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: candidates.length,
    deactivated,
    errors,
    errorDetails: errorDetails.slice(0, 5),
  });
}
