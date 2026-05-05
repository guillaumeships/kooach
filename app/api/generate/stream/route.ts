/**
 * app/api/generate/stream/route.ts
 *
 * Route POST /api/generate/stream — variante STREAMING de /api/generate.
 *
 * Pourquoi un endpoint séparé :
 *   - /api/generate retourne un JSON complet (utilisé pour le regen unitaire)
 *   - /api/generate/stream renvoie un stream Vercel AI SDK (génération initiale
 *     des 7 contenus, perçue 10× plus rapide car les champs apparaissent au fil
 *     de l'eau côté client)
 *
 * Le hook client `useGenerate` consomme ce stream via `useObject` du SDK.
 *
 * Sécurité : pareil que /api/generate (auth + rate limit + subscription).
 * Sauvegarde DB : asynchrone via `onFinish` du streamObject.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { streamGenerationContent } from '@/lib/anthropic';
import { getSupabase } from '@/lib/supabase';
import type { GenerationResult } from '@/lib/supabase';
import { checkAndIncrementDailyGen, checkMonthlyGen, RATE_LIMITS } from '@/lib/rate-limit';

export const maxDuration = 60;

const CORS = {
  'Access-Control-Allow-Origin': 'https://kooach.fr',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError('Corps de requête JSON invalide.', 400);
  }

  const { token, specialty, style, keywords, target, posts, objectif, theme } = body;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const userEmail = await getAuthedEmail(req, body);
  if (!userEmail) {
    return jsonError('Accès non autorisé. Connecte-toi à nouveau.', 401);
  }
  void token;

  // ── Validation profil ──────────────────────────────────────────────────────
  if (
    typeof specialty !== 'string' || !specialty.trim() ||
    typeof style !== 'string' || !style.trim() ||
    typeof keywords !== 'string' || !keywords.trim() ||
    typeof target !== 'string' || !target.trim()
  ) {
    return jsonError('Tous les champs du profil sont requis.', 400);
  }

  if (
    specialty.length > 300 || style.length > 500 ||
    keywords.length > 200 || target.length > 500
  ) {
    return jsonError('Un ou plusieurs champs dépassent la longueur autorisée.', 400);
  }

  // ── Subscription active ────────────────────────────────────────────────────
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_active')
    .eq('email', userEmail)
    .maybeSingle();

  if (profile && profile.subscription_active === false) {
    return jsonError(
      "Ton abonnement n'est plus actif. Reprends ton abonnement pour continuer.",
      403,
    );
  }

  // ── Rate limit mensuel (priorité — protège la marge brute) ────────────────
  const monthCheck = await checkMonthlyGen(userEmail, RATE_LIMITS.MONTHLY_FULL_GEN);
  if (!monthCheck.allowed) {
    return jsonError(
      `Limite mensuelle atteinte (${RATE_LIMITS.MONTHLY_FULL_GEN} générations/mois). Réessaie dans quelques jours, ou écris-nous à contact@kooach.fr si tu as un usage exceptionnel.`,
      429,
    );
  }

  // ── Rate limit quotidien (anti-burst, complémentaire au mensuel) ──────────
  const rateCheck = await checkAndIncrementDailyGen(userEmail, RATE_LIMITS.DAILY_FULL_GEN);
  if (!rateCheck.allowed) {
    return jsonError(
      `Limite quotidienne atteinte (${RATE_LIMITS.DAILY_FULL_GEN} générations/jour). Réessaie demain.`,
      429,
    );
  }

  // ── History awareness — fetch les 3 derniers post_emotionnel pour que
  //    Claude évite les angles déjà utilisés (uniqueness inter-runs). ────────
  const { data: recentRows } = await supabase
    .from('generations')
    .select('post_emotionnel')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(3);
  const recentSnippets = (recentRows ?? [])
    .map((r) => r.post_emotionnel)
    .filter((s): s is string => typeof s === 'string' && s.length > 30);

  // ── Streaming AI + sauvegarde dans onFinish ───────────────────────────────
  // objectif (Attirer DMs / Décrocher RDV / Vendre / Notoriété) reçoit un
  // calibrage explicite dans le prompt user (pas juste suffix system).
  // recentSnippets passe les 3 derniers angles → Claude varie automatiquement.
  // Combiné avec les ANGLES_ATTAQUE random + temperature 0.85 → même profil
  // utilisateur ne reçoit jamais 2 fois le même output.
  const result = streamGenerationContent({
    specialty,
    style,
    keywords,
    target,
    posts: typeof posts === 'string' ? posts : undefined,
    objectif: typeof objectif === 'string' ? objectif : undefined,
    theme: typeof theme === 'string' ? theme : undefined,
    recentSnippets,
    onFinish: async ({ object }) => {
      if (!object) return; // schema validation failed → on n'enregistre rien
      await persistGeneration({ userEmail, profile: { specialty, style, keywords, target, posts }, result: object });
    },
  });

  return result.toTextStreamResponse({ headers: CORS });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sauvegarde DB + calcul streak (post-génération)
// ─────────────────────────────────────────────────────────────────────────────

async function persistGeneration({
  userEmail,
  profile,
  result,
}: {
  userEmail: string;
  profile: { specialty: string; style: string; keywords: string; target: string; posts?: unknown };
  result: Partial<GenerationResult>;
}) {
  try {
    const supabase = getSupabase();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Calcul streak
    const { data: streakProfile } = await supabase
      .from('profiles')
      .select('last_generated_at, streak_count')
      .eq('email', userEmail)
      .maybeSingle();

    let streakCount = streakProfile?.streak_count ?? 0;
    const lastGen = streakProfile?.last_generated_at
      ? new Date(streakProfile.last_generated_at)
      : null;

    if (lastGen) {
      const lastGenDayStr = lastGen.toISOString().slice(0, 10);
      const diffHours = (now.getTime() - lastGen.getTime()) / 3_600_000;
      if (lastGenDayStr !== todayStr && diffHours <= 48) {
        streakCount += 1;
      } else if (diffHours > 48) {
        streakCount = 1;
      }
    } else {
      streakCount = 1;
    }

    // Upsert profile
    await supabase.from('profiles').upsert(
      {
        email: userEmail,
        specialty: profile.specialty,
        style: profile.style,
        keywords: profile.keywords,
        target: profile.target,
        example_posts:
          typeof profile.posts === 'string' && profile.posts.trim()
            ? profile.posts.trim().slice(0, 4000)
            : null,
        updated_at: now.toISOString(),
        last_generated_at: now.toISOString(),
        streak_count: streakCount,
      },
      { onConflict: 'email' },
    );

    // Insert generation
    await supabase.from('generations').insert({
      user_email: userEmail,
      post_emotionnel: result.post_emotionnel ?? null,
      post_educatif: result.post_educatif ?? null,
      post_motivationnel: result.post_motivationnel ?? null,
      bio_instagram: result.bio_instagram ?? null,
      newsletter: result.newsletter ?? null,
      email_relance: result.email_relance ?? null,
      reel_idee: result.reel_idee ?? null,
      reel_script: result.reel_script ?? null,
    });
  } catch (err) {
    console.error('persistGeneration error:', err);
    // Non-bloquant : la génération a déjà été streamée à l'user
  }
}
