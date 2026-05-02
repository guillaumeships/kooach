/**
 * app/api/generate/route.ts
 *
 * Route POST /api/generate — cœur du produit.
 *
 * Deux modes :
 *   1. preview_mode: true  → génère un post de démo sans token (landing page)
 *   2. mode normal         → génère les 7 contenus (ou un seul si `only` fourni)
 *
 * Sécurité :
 *   - Token HMAC vérifié + profil actif (subscription_active = true)
 *   - Rate limit DB-based : 20 générations complètes / 50 régénérations par jour
 *   - Mode preview : rate limit IP-based léger (instance-mémoire) pour éviter l'abus
 *
 * Corps JSON attendu (mode normal) :
 *   { token, specialty, style, keywords, target, theme?, only?, posts?, objectif? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthedEmail } from '@/lib/auth-server';
import { generateContent, generatePreview, SINGLE_CFG } from '@/lib/anthropic';
import type { SingleContentKey } from '@/lib/anthropic';
import { getSupabase } from '@/lib/supabase';
import type { GenerationResult } from '@/lib/supabase';
import { checkAndIncrementDailyGen, checkMonthlyGen, RATE_LIMITS } from '@/lib/rate-limit';

// Vercel : autorise jusqu'à 60s d'exécution (sinon timeout par défaut ~10s sur
// Hobby). Anthropic peut prendre 30-50s pour générer les 7 contenus complets.
// Le timeout SDK Anthropic dans lib/anthropic.ts est à 55s pour garder 5s de
// marge avant que Vercel ne coupe.
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  'https://kooach.fr',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMIT IP-BASED POUR LE MODE PREVIEW (anti-abus landing page)
// ─────────────────────────────────────────────────────────────────────────────
// Bucket en mémoire : limite 5 previews par IP par heure.
// Imparfait sur Vercel (instances éphémères = bucket reset) mais suffit comme
// barrière minimale contre un attaquant naïf.

const PREVIEW_LIMIT_PER_HOUR = 5;
const PREVIEW_WINDOW_MS = 60 * 60 * 1000;
const previewBucket = new Map<string, number[]>();

function checkPreviewRate(ip: string): boolean {
  const now = Date.now();
  const recent = (previewBucket.get(ip) ?? []).filter((t) => now - t < PREVIEW_WINDOW_MS);
  if (recent.length >= PREVIEW_LIMIT_PER_HOUR) return false;
  recent.push(now);
  previewBucket.set(ip, recent);
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLÉS REQUISES PAR MODE
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_BY_ONLY: Record<SingleContentKey, (keyof GenerationResult)[]> = {
  post_emotionnel:    ['post_emotionnel'],
  post_educatif:      ['post_educatif'],
  post_motivationnel: ['post_motivationnel'],
  bio_instagram:      ['bio_instagram'],
  newsletter:         ['newsletter'],
  email_relance:      ['email_relance'],
  reel:               ['reel_idee', 'reel_script'],
};

const ALL_REQUIRED_KEYS: (keyof GenerationResult)[] = [
  'post_emotionnel', 'post_educatif', 'post_motivationnel',
  'newsletter', 'bio_instagram', 'email_relance', 'reel_idee', 'reel_script',
];

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Corps de requête JSON invalide.' }, 400);
  }

  const {
    token, specialty, style, keywords, target, theme, only, posts, objectif,
    preview_mode, specialite, cible,
  } = body;

  // ── MODE PREVIEW — sans token, pour la landing page ──────────────────────
  if (preview_mode === true) {
    const ip = getClientIp(req);
    if (!checkPreviewRate(ip)) {
      return json(
        { error: 'Trop de demandes. Réessaie dans une heure.' },
        429,
      );
    }

    const spec = (typeof specialite === 'string' ? specialite : '').slice(0, 200).trim();
    const tgt  = (typeof cible      === 'string' ? cible      : '').slice(0, 200).trim();

    if (!spec || !tgt) {
      return json({ error: 'Spécialité et cible requis.' }, 400);
    }

    try {
      const text = await generatePreview(spec, tgt);
      return json({ post_emotionnel: text });
    } catch (err) {
      console.error('Preview error:', err);
      return json({ error: 'Erreur interne.' }, 500);
    }
  }

  // ── VALIDATION AUTH (Supabase priorité, HMAC fallback) ──────────────────
  const userEmail = await getAuthedEmail(req, body);
  if (!userEmail) {
    return json({ error: 'Accès non autorisé. Connecte-toi à nouveau.' }, 401);
  }
  // `token` reste utilisé pour la rétro-compatibilité du fallback HMAC
  void token;

  // ── VALIDATION DES CHAMPS PROFIL ──────────────────────────────────────────
  if (
    typeof specialty !== 'string' || !specialty.trim() ||
    typeof style     !== 'string' || !style.trim()     ||
    typeof keywords  !== 'string' || !keywords.trim()  ||
    typeof target    !== 'string' || !target.trim()
  ) {
    return json({ error: 'Tous les champs du profil sont requis.' }, 400);
  }

  if (
    specialty.length > 300 || style.length > 500 ||
    keywords.length > 200 || target.length > 500
  ) {
    return json({ error: 'Un ou plusieurs champs dépassent la longueur autorisée.' }, 400);
  }

  if (only !== undefined && (typeof only !== 'string' || !(only in SINGLE_CFG))) {
    return json({ error: 'Paramètre only invalide.' }, 400);
  }

  // ── VÉRIFICATION ABONNEMENT ACTIF ─────────────────────────────────────────
  // On lit le profil pour s'assurer que l'abo est toujours actif. Un user qui
  // a annulé son abo a un token signé valide mais subscription_active=false.
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_active')
    .eq('email', userEmail)
    .maybeSingle();

  // Si pas de profil (ancien user pré-Stripe migration) on laisse passer pour
  // ne pas casser leur expérience. Si profil existe et inactif → 403.
  if (profile && profile.subscription_active === false) {
    return json(
      { error: 'Ton abonnement n\'est plus actif. Reprends ton abonnement pour continuer.' },
      403,
    );
  }

  // ── RATE LIMIT MENSUEL (génération complète seulement, pas regen) ─────────
  if (!only) {
    const monthCheck = await checkMonthlyGen(userEmail, RATE_LIMITS.MONTHLY_FULL_GEN);
    if (!monthCheck.allowed) {
      return json(
        {
          error: `Limite mensuelle atteinte (${RATE_LIMITS.MONTHLY_FULL_GEN} générations/mois). Réessaie dans quelques jours, ou écris-nous à contact@kooach.fr si tu as un usage exceptionnel.`,
          resetAt: monthCheck.resetAt.toISOString(),
        },
        429,
      );
    }
  }

  // ── RATE LIMIT QUOTIDIEN ──────────────────────────────────────────────────
  const limit = only ? RATE_LIMITS.DAILY_SINGLE_REGEN : RATE_LIMITS.DAILY_FULL_GEN;
  const rateCheck = await checkAndIncrementDailyGen(userEmail, limit);
  if (!rateCheck.allowed) {
    return json(
      {
        error: `Limite quotidienne atteinte (${limit} ${only ? 'régénérations' : 'générations'}/jour). Réessaie demain.`,
        resetAt: rateCheck.resetAt.toISOString(),
      },
      429,
    );
  }

  // ── APPEL IA ──────────────────────────────────────────────────────────────
  let result: Partial<GenerationResult>;
  try {
    result = await generateContent({
      specialty,
      style,
      keywords,
      target,
      posts:    typeof posts    === 'string' ? posts    : undefined,
      objectif: typeof objectif === 'string' ? objectif : undefined,
      theme:    typeof theme    === 'string' ? theme    : undefined,
      only:     typeof only     === 'string' ? (only as SingleContentKey) : undefined,
    });
  } catch (err) {
    console.error('generateContent error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur API Anthropic.';
    // Détection timeout → message plus clair pour l'user
    const isTimeout = msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('aborted');
    return json(
      { error: isTimeout ? 'La génération a pris trop de temps. Réessaie.' : msg },
      isTimeout ? 504 : 502,
    );
  }

  // ── VÉRIFICATION DES CLÉS REQUISES ───────────────────────────────────────
  const requiredKeys = (typeof only === 'string')
    ? (REQUIRED_BY_ONLY[only as SingleContentKey] ?? [])
    : ALL_REQUIRED_KEYS;

  const missing = requiredKeys.filter(
    (k) => !(k in result) || result[k] == null || result[k] === '',
  );
  if (missing.length > 0) {
    console.error('Clés manquantes dans la réponse du modèle:', missing);
    return json(
      { error: `Réponse incomplète du modèle. Clés manquantes : ${missing.join(', ')}` },
      500,
    );
  }

  // ── SAUVEGARDE SUPABASE ───────────────────────────────────────────────────
  // Non-bloquant : une erreur DB ne fait pas échouer la requête
  let streakCount = 0;

  try {
    const now = new Date();

    if (!only) {
      // Génération complète : calcul du streak
      const { data: streakProfile } = await supabase
        .from('profiles')
        .select('last_generated_at, streak_count')
        .eq('email', userEmail)
        .maybeSingle();

      const todayStr = now.toISOString().slice(0, 10);
      streakCount = streakProfile?.streak_count ?? 0;
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

      await supabase.from('profiles').upsert(
        {
          email: userEmail,
          specialty,
          style,
          keywords,
          target,
          example_posts:     typeof posts === 'string' && posts.trim() ? posts.trim().slice(0, 4000) : null,
          updated_at:        now.toISOString(),
          last_generated_at: now.toISOString(),
          streak_count:      streakCount,
        },
        { onConflict: 'email' },
      );
    } else {
      await supabase.from('profiles').upsert(
        {
          email: userEmail,
          specialty,
          style,
          keywords,
          target,
          example_posts: typeof posts === 'string' && posts.trim() ? posts.trim().slice(0, 4000) : null,
          updated_at: now.toISOString(),
        },
        { onConflict: 'email' },
      );
    }

    await supabase.from('generations').insert({
      user_email:         userEmail,
      post_emotionnel:    result.post_emotionnel    ?? null,
      post_educatif:      result.post_educatif      ?? null,
      post_motivationnel: result.post_motivationnel ?? null,
      bio_instagram:      result.bio_instagram      ?? null,
      newsletter:         result.newsletter         ?? null,
      email_relance:      result.email_relance      ?? null,
      reel_idee:          result.reel_idee          ?? null,
      reel_script:        result.reel_script        ?? null,
    });
  } catch (dbErr) {
    console.error('Erreur sauvegarde Supabase:', dbErr);
  }

  return only ? json(result) : json({ ...result, streak_count: streakCount });
}
