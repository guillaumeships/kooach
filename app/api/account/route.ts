/**
 * app/api/account/route.ts
 *
 * POST /api/account — retourne les infos du compte connecté.
 *
 * Authentifie via Supabase Auth (cookies) en priorité, fallback HMAC token
 * (legacy magic link). Cette route accepte les deux pendant la transition.
 *
 * Réponse :
 *   - email
 *   - subscription_active
 *   - has_stripe_customer
 *   - streak_count
 *   - token_expires_at (null si auth Supabase, timestamp si HMAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { getSupabase } from '@/lib/supabase';

interface TokenPayload { email: string; exp: number; }

function decodeTokenExp(token: unknown): number | null {
  if (typeof token !== 'string') return null;
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;
    const payload = token.slice(0, dot);
    const decoded: TokenPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    );
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

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

  const db = getSupabase();

  // Lecture profil + comptage des générations en parallèle
  const [profileRes, countRes] = await Promise.all([
    db
      .from('profiles')
      .select('subscription_active, stripe_customer_id, streak_count, last_generated_at, specialty, style, keywords, target, example_posts, created_at, trial_end')
      .eq('email', email)
      .maybeSingle(),
    db
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', email),
  ]);

  const profile = profileRes.data as
    | { subscription_active?: boolean; stripe_customer_id?: string | null; streak_count?: number;
        last_generated_at?: string | null; specialty?: string | null; style?: string | null;
        keywords?: string | null; target?: string | null; example_posts?: string | null;
        created_at?: string | null; trial_end?: string | null }
    | null;
  const totalGenerations = countRes.count ?? 0;

  return NextResponse.json({
    email,
    subscription_active:  profile?.subscription_active ?? true,
    has_stripe_customer:  Boolean(profile?.stripe_customer_id),
    streak_count:         profile?.streak_count ?? 0,
    last_generated_at:    profile?.last_generated_at ?? null,
    total_generations:    totalGenerations,
    member_since:         profile?.created_at ?? null,
    token_expires_at:     decodeTokenExp(body.token),
    // trial_end Stripe (fin du trial 7j) — alimente le countdown UI dans /app.
    // null pour les users HMAC legacy ou les abos hors trial.
    trial_end:            profile?.trial_end ?? null,
    // Profil retourné pour pré-remplir le formulaire de génération sur tous
    // les devices de l'utilisateur (le localStorage ne suit pas un device-switch).
    profile: {
      specialty:     profile?.specialty     ?? null,
      style:         profile?.style         ?? null,
      keywords:      profile?.keywords      ?? null,
      target:        profile?.target        ?? null,
      example_posts: profile?.example_posts ?? null,
    },
  });
}
