/**
 * lib/rate-limit.ts
 *
 * Rate limiting par utilisateur, stocké en DB (pas de Redis nécessaire).
 *
 * Modèle : un compteur par profil (`daily_gen_count`) qui se reset toutes les
 * 24h. Si l'utilisateur dépasse la limite, on refuse la génération avec un 429.
 *
 * Logique :
 *   - Si daily_gen_reset_at est null OU > 24h dans le passé → reset à 0
 *   - Si compteur >= limite → refuse
 *   - Sinon incrémente
 *
 * Pourquoi DB et pas mémoire process : Vercel utilise des instances éphémères
 * qui peuvent redémarrer. Un compteur en RAM ne survit pas.
 *
 * Pourquoi pas Upstash/Redis : ajouter une dépendance externe juste pour ça
 * c'est over-engineered tant qu'on a < 1000 users actifs/jour.
 */

import { getSupabase } from '@/lib/supabase';

// Limites configurables (pourront passer en variables d'env si besoin).
// Calibrées pour assurer une marge brute saine (~74%) à 29€/mois :
//   - 100 gens × 0.05€ = 5.00€ coût AI worst-case
//   - 15 régen/jour × 30j × 0.007€ ≈ 3.15€ coût AI worst-case (réaliste ~0.50€)
//   - Total réaliste ~5.50€/user/mois + Stripe ~1.12€ ≈ 6.62€ → marge ~22€ (74%)
//
// Positionnement "quasi-illimité" aligné marché SaaS 2026 (Jasper/Copy.ai
// vendent unlimited words avec fair-use). 100 gens = 700 contenus/mois,
// aucun coach normal n'atteint le plafond — c'est un simple filet anti-spam.
//
// DAILY 5 = burst confort (un user peut générer 5 d'affilée s'il a besoin).
export const RATE_LIMITS = {
  // Génération complète (les 7 contenus d'un coup)
  DAILY_FULL_GEN: 5,
  MONTHLY_FULL_GEN: 100,
  // Régénération d'une seule card (coût ~1/7e d'une gen complète)
  DAILY_SINGLE_REGEN: 15,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Vérifie ET incrémente le compteur quotidien dans une seule opération.
 *
 * `weight` : combien d'unités cette action consomme (1 par card régénérée,
 * 1 par génération complète — on traite les 2 dans le même compteur pour
 * faire simple, mais avec deux limites différentes selon le contexte).
 *
 * Retourne `allowed: false` si la limite est atteinte.
 */
export async function checkAndIncrementDailyGen(
  email: string,
  limit: number,
  weight = 1,
): Promise<RateLimitResult> {
  const db = getSupabase();
  const now = new Date();

  const { data: profile, error } = await db
    .from('profiles')
    .select('daily_gen_count, daily_gen_reset_at')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    // En cas d'erreur DB on laisse passer — on préfère un faux positif (laisser
    // un user spammer marginalement) qu'un faux négatif (bloquer un client payant).
    console.error('rate-limit: erreur lecture profile —', error.message);
    return { allowed: true, remaining: limit, resetAt: new Date(now.getTime() + DAY_MS) };
  }

  const lastReset = profile?.daily_gen_reset_at ? new Date(profile.daily_gen_reset_at) : null;
  const needsReset = !lastReset || now.getTime() - lastReset.getTime() >= DAY_MS;

  const currentCount = needsReset ? 0 : (profile?.daily_gen_count ?? 0);
  const newCount = currentCount + weight;

  if (newCount > limit) {
    const resetAt = lastReset ?? now;
    return {
      allowed: false,
      remaining: Math.max(0, limit - currentCount),
      resetAt: new Date(resetAt.getTime() + DAY_MS),
    };
  }

  await db.from('profiles').update({
    daily_gen_count: newCount,
    daily_gen_reset_at: needsReset ? now.toISOString() : lastReset!.toISOString(),
  }).eq('email', email);

  return {
    allowed: true,
    remaining: limit - newCount,
    resetAt: new Date((needsReset ? now : lastReset!).getTime() + DAY_MS),
  };
}

/**
 * Vérifie le quota mensuel via COUNT(*) sur les 30 derniers jours dans la
 * table `generations`. Pas de colonne dédiée — économise une migration.
 *
 * Cette fonction NE compte PAS la régénération unitaire (qui passe par
 * /api/generate avec `only`) — seules les générations complètes (les 7
 * contenus d'un coup) sont décomptées du mensuel, car le coût AI réel
 * gros est sur la full gen (0.05€) vs régen unitaire (~0.007€).
 */
export async function checkMonthlyGen(
  email: string,
  limit: number,
): Promise<RateLimitResult> {
  const db = getSupabase();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const { count, error } = await db
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    // Fail-open (cf checkAndIncrementDailyGen) : on préfère laisser passer
    // qu'engager un faux négatif sur un client payant.
    console.error('rate-limit: erreur count monthly —', error.message);
    return { allowed: true, remaining: limit, resetAt: new Date(now.getTime() + 30 * DAY_MS) };
  }

  const used = count ?? 0;
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    // Le reset est rolling 30 jours : la plus vieille génération sortira
    // de la fenêtre dans 30j-(now-old). Approximation acceptable : on
    // affiche dans 30j depuis maintenant.
    resetAt: new Date(now.getTime() + 30 * DAY_MS),
  };
}
