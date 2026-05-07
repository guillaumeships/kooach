/**
 * app/api/cron/weekly-recap/route.ts
 *
 * Cron Vercel — chaque dimanche 19h Europe/Paris.
 * Pattern Spotify Wrapped weekly. Le mécanisme #1 de réengagement pour
 * un SaaS de création récurrente.
 *
 * Logique :
 *   1. Auth via Bearer CRON_SECRET (header Authorization, envoyé par Vercel)
 *   2. Scan profiles avec subscription_active=true et weekly_recap_optout=false
 *   3. Pour chaque user : agrège ses generations cette semaine + précédente
 *   4. Si totalGen=0 ET inscrit depuis <7j → skip (trop tôt pour le récap)
 *   5. Sinon envoie l'email weekly recap (variante "comeback" si weekCount=0)
 *   6. Sequential pour ne pas exploser le rate limit Resend (1 email/sec OK)
 *
 * Configuré dans vercel.json schedule "0 18 * * 0" (UTC 18h = 19h CET hiver,
 * 20h CEST été — acceptable, dimanche soir reste un slot premium).
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendWeeklyRecapEmail, type WeeklyRecapStats } from '@/lib/email-weekly';
import { getSupabase } from '@/lib/supabase';
import { HISTORY_LABELS } from '@/lib/cards-config';
import type { GenerationResult } from '@/types/database';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const maxDuration = 300; // 5 min max (large user base safe)

interface ProfileRow {
  email: string;
  subscription_active: boolean | null;
  weekly_recap_optout: boolean | null;
  streak_count: number | null;
  created_at: string;
}

interface GenerationRow {
  id: string;
  user_email: string;
  created_at: string;
  post_emotionnel: string | null;
  post_educatif: string | null;
  post_motivationnel: string | null;
  bio_instagram: string | null;
  newsletter: string | null;
  email_relance: string | null;
  reel_idee: string | null;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  const weekAgo = new Date(now - WEEK_MS).toISOString();
  const twoWeeksAgo = new Date(now - 2 * WEEK_MS).toISOString();
  const sevenDaysAgo = new Date(now - WEEK_MS).toISOString();

  // ── Liste des destinataires ───────────────────────────────────────────────
  const { data: profiles, error: pErr } = await db
    .from('profiles')
    .select('email, subscription_active, weekly_recap_optout, streak_count, created_at')
    .eq('subscription_active', true)
    .eq('weekly_recap_optout', false);

  if (pErr) {
    return NextResponse.json({ error: 'DB read profiles failed', details: pErr.message }, { status: 500 });
  }

  const eligible = (profiles ?? []) as ProfileRow[];
  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, errors: 0, total: 0 });
  }

  // ── Generations sur 2 semaines (pour calcul delta) ────────────────────────
  // Note : table en colonnes plates (1 row = 1 séquence de 7 contenus).
  const { data: gens, error: gErr } = await db
    .from('generations')
    .select(
      'id, user_email, created_at, post_emotionnel, post_educatif, post_motivationnel, bio_instagram, newsletter, email_relance, reel_idee',
    )
    .gte('created_at', twoWeeksAgo)
    .order('created_at', { ascending: false });

  if (gErr) {
    return NextResponse.json({ error: 'DB read generations failed', details: gErr.message }, { status: 500 });
  }

  const byEmail = new Map<string, GenerationRow[]>();
  for (const g of (gens ?? []) as GenerationRow[]) {
    const arr = byEmail.get(g.user_email) ?? [];
    arr.push(g);
    byEmail.set(g.user_email, arr);
  }

  // ── Envoi sequential pour respecter le rate limit Resend ──────────────────
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails: Array<{ email: string; error: string }> = [];

  for (const profile of eligible) {
    const userGens = byEmail.get(profile.email) ?? [];
    const weekCount = userGens.filter((g) => g.created_at >= weekAgo).length;
    const prevWeekCount = userGens.filter((g) => g.created_at < weekAgo).length;

    // Skip si user inscrit depuis <7j ET 0 contenu (trop tôt pour récap utile)
    const memberSince = new Date(profile.created_at).getTime();
    const isFreshAccount = profile.created_at > sevenDaysAgo;
    if (isFreshAccount && weekCount === 0) {
      skipped++;
      continue;
    }
    void memberSince;

    // Top contenu = le plus récent de la semaine (snippet)
    const lastGen = userGens.find((g) => g.created_at >= weekAgo);
    const topContent = extractTopContent(lastGen ?? null);

    // Total generations all-time pour le user
    const { count: totalCount } = await db
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', profile.email);

    const stats: WeeklyRecapStats = {
      email: profile.email,
      weekCount,
      prevWeekCount,
      streakCount: profile.streak_count ?? 0,
      totalGenerations: totalCount ?? 0,
      topContent,
    };

    const r = await sendWeeklyRecapEmail(stats);
    if (r.ok) {
      sent++;
    } else {
      errors++;
      errorDetails.push({ email: profile.email, error: r.error ?? 'unknown' });
    }
    // 200ms throttle — Resend tolère 10 req/s mais on reste safe
    await sleep(200);
  }

  return NextResponse.json({
    ok: true,
    total: eligible.length,
    sent,
    skipped,
    errors,
    errorDetails: errorDetails.slice(0, 5),  // ne pas surcharger la réponse
  });
}

/**
 * Extrait le 1er contenu non-vide d'une row generation (colonnes plates).
 * Ordre de priorité : post_emotionnel > post_educatif > post_motivationnel >
 * bio > newsletter > email > reel.
 */
function extractTopContent(gen: GenerationRow | null): { label: string; snippet: string } | undefined {
  if (!gen) return undefined;
  const order: (keyof GenerationRow & keyof GenerationResult)[] = [
    'post_emotionnel', 'post_educatif', 'post_motivationnel',
    'bio_instagram', 'newsletter', 'email_relance', 'reel_idee',
  ];
  for (const k of order) {
    const v = gen[k];
    if (typeof v === 'string' && v.trim().length > 20) {
      const label = HISTORY_LABELS[k]?.label ?? String(k);
      const snippet = smartSnippet(v.trim().replace(/\s+/g, ' '), 160);
      return { label, snippet };
    }
  }
  return undefined;
}

/**
 * Coupe un texte à la fin d'une phrase la plus proche de `maxLength`.
 * Évite les coupures abruptes en milieu de citation/phrase.
 *   - Si on trouve un `. ! ?` entre 60% et 100% de maxLength → coupe juste après
 *   - Sinon coupe à maxLength au mot le plus proche (pas mid-mot)
 */
function smartSnippet(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const minLength = Math.floor(maxLength * 0.6);
  const window = text.slice(0, maxLength);

  // Cherche le dernier .!? dans la fenêtre [minLength, maxLength]
  const sentenceEnd = window.search(/[.!?](?=\s|$)(?![.!?])/g);
  let lastSentence = -1;
  let m: RegExpExecArray | null;
  const re = /[.!?](?=\s|$)/g;
  while ((m = re.exec(window)) !== null) {
    if (m.index >= minLength) lastSentence = m.index;
  }
  void sentenceEnd;

  if (lastSentence !== -1) {
    return text.slice(0, lastSentence + 1).trim();
  }
  // Fallback : couper au mot le plus proche
  const lastSpace = window.lastIndexOf(' ');
  if (lastSpace >= minLength) return text.slice(0, lastSpace).trim() + '…';
  return window + '…';
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
