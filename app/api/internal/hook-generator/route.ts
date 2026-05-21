/**
 * app/api/internal/hook-generator/route.ts
 *
 * POST /api/internal/hook-generator
 *
 * Endpoint INTERNE (founder-only) qui génère UN post Instagram complet
 * calibré sur le style exact d'un coach, avec son hook d'ouverture
 * extrait (les 2 premières lignes).
 *
 * Usage : drafter rapidement un cold DM Value-First.
 *   1. Le founder copie 2-3 captions du prospect → /internal/hooks UI
 *   2. L'API génère 1 post complet calibré sur son style
 *   3. Le founder envoie le hook (2 lignes) dans le 1er DM
 *   4. Si le coach répond positivement, le founder envoie le post complet
 *      (cohérence garantie : le post complet contient EXACTEMENT le hook
 *      qui a été envoyé en preview)
 *
 * Auth : header `x-internal-secret` OU session Supabase founder.
 * Voir lib/internal-auth.ts.
 *
 * Body :
 *   {
 *     handle: "@coach_handle",           // string, requis
 *     posts:  ["texte post 1", "..."]    // string[], 1-5 posts récents
 *   }
 *
 * Réponse OK :
 *   {
 *     ok: true,
 *     handle: "...",
 *     hook: { line1: "...", line2: "..." },   // 2 premières lignes du post
 *     post: "..."                              // post Insta complet (200-280 mots)
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai-model';
import { isAuthorizedInternalCall, getFounderEmail } from '@/lib/internal-auth';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

// Limite Insta DM = 1000 chars/message. On vise 950 max pour sécurité
// (le DM teaser fait ~200 chars en plus, on ne le compte pas — le post est
// envoyé seul comme 2e message). Au-delà, Insta force le split = UX dégradée.
const MAX_POST_CHARS = 950;

const draftSchema = z.object({
  hook: z.object({
    line1: z.string().min(10).max(160),
    line2: z.string().min(10).max(160),
  }),
  post: z.string().min(400).max(MAX_POST_CHARS),
});

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un ghost-writer expert Instagram pour coachs sportifs francophones indépendants.

Ton rôle : analyser le style d'un coach via ses posts récents, puis générer UN post Instagram complet dans son style EXACT, avec son hook d'ouverture isolé pour preview.

═══════════════════════════════════════════════════════════════════
🎯 RÈGLE #1 — AUDIENCE (CRITIQUE)
═══════════════════════════════════════════════════════════════════

Le post s'adresse aux CLIENTS POTENTIELS du coach, jamais au coach lui-même.
Si le coach cible "femmes 30-50 perte de poids", tu écris POUR ces femmes.

❌ "Tu coaches depuis des mois..." → s'adresse à un coach (faux)
✅ "Combien de fois tu t'es dit 'lundi je recommence'..." → s'adresse à une cliente (correct)

═══════════════════════════════════════════════════════════════════
ANALYSE STYLE (à partir des posts fournis)
═══════════════════════════════════════════════════════════════════

Identifie :
- Ton (cash / pédagogue / motivant / intimiste / cru / chaleureux…)
- Vocabulaire récurrent (mots qu'IL utilise souvent)
- Structure typique des posts (question d'ouverture → exemple → leçon ? Story → punchline ?)
- Tutoiement vs vouvoiement
- Présence ou non d'emojis (ne JAMAIS en ajouter si le coach n'en met pas dans ses posts originaux)
- Longueur typique des paragraphes (court/punché vs long/narratif)

═══════════════════════════════════════════════════════════════════
FORMAT OUTPUT
═══════════════════════════════════════════════════════════════════

Tu génères UN post Insta complet, formaté pour Insta :
- Paragraphes courts séparés par une ligne vide
- Hook fort en première ligne qui arrête le scroll
- Corps qui développe le hook avec exemple concret / story / mécanique
- Closing avec call-to-action léger (DM, réflexion, action) — pas pushy

⚠️ LIMITE STRICTE DE TAILLE : le post complet (incluant le hook) doit faire ENTRE 600 ET 920 CARACTÈRES MAXIMUM (≈ 100-150 mots français).
Cette limite est NON-NÉGOCIABLE : le post doit tenir dans UN seul message Instagram (limite plateforme = 1000 chars/msg). Si tu dépasses 920 chars, le post sera coupé en 2 messages = UX dégradée pour le destinataire.

Pour rester dans la limite :
- Va à l'essentiel, pas de paragraphe filler
- 3-4 paragraphes courts maximum
- Pas de hashtags (le founder les ajoutera)
- Préfère la punchline serrée à la périphrase

Tu retournes :
- "hook.line1" = la PREMIÈRE LIGNE de ton post (punchline d'accroche)
- "hook.line2" = la DEUXIÈME ligne de ton post (relance/pivot)
- "post" = le post COMPLET (200-280 mots), qui DOIT commencer EXACTEMENT par "{hook.line1}\\n\\n{hook.line2}" puis continuer.

═══════════════════════════════════════════════════════════════════
RÈGLES DURES
═══════════════════════════════════════════════════════════════════

- TOUT en français, jamais en anglais
- Pas de hashtags (le founder les ajoutera lui-même)
- Pas de cliché motivationnel ("crois en toi", "tout est possible", "le voyage commence par un pas")
- Le ton doit COLLER au style identifié — pas un ton générique
- Le post DOIT commencer par hook.line1 + saut de ligne + hook.line2 (cohérence stricte)
- Ne génère QUE le JSON demandé. Pas de préambule, pas de commentaire`;

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authed = await isAuthorizedInternalCall(req);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { handle?: unknown; posts?: unknown };
  try {
    body = (await req.json()) as { handle?: unknown; posts?: unknown };
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const handle =
    typeof body.handle === 'string' ? body.handle.trim().replace(/^@/, '') : '';
  const postsRaw = Array.isArray(body.posts) ? body.posts : [];
  const posts = postsRaw
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 20)
    .slice(0, 5)
    .map((p) => p.trim().slice(0, 2000));

  if (!handle || posts.length < 1) {
    return NextResponse.json(
      { error: 'Body invalide : `handle` (string) et `posts` (1-5 strings >20 chars) requis.' },
      { status: 400 },
    );
  }

  const userPrompt = `Coach Instagram à analyser : @${handle}

Voici ${posts.length} de ses posts récents (texte brut copié depuis Instagram) :

${posts
    .map((p, i) => `═══ POST ${i + 1} ═══\n${p}`)
    .join('\n\n')}

Analyse son style (ton, vocabulaire, structure, tutoiement, emojis) et génère 1 post Insta complet dans SON style exact.

Le post DOIT commencer par hook.line1 + saut de ligne + hook.line2 (les 2 premières lignes du post = exactement le hook retourné séparément).

Format JSON strict :
{
  "hook": { "line1": "...", "line2": "..." },
  "post": "[line1]\\n\\n[line2]\\n\\n[reste du post 200-280 mots]"
}`;

  // Génération avec retry 1 fois si la limite chars est dépassée.
  //   Claude peut parfois ignorer la contrainte de taille → le schema zod fail
  //   (post.max(950)). On retry avec un prompt renforcé. Si encore raté → 502.
  async function tryGenerate(attempt: number) {
    const stricterPrompt = attempt > 0
      ? `${userPrompt}\n\n⚠️ ATTENTION : ton dernier essai dépassait ${MAX_POST_CHARS} chars. RÉ-ESSAIE en écrivant BEAUCOUP plus court (max 100 mots / 600-900 chars), tout en gardant le style et l'impact.`
      : userPrompt;
    return generateObject({
      model: getModel(),
      schema: draftSchema,
      system: SYSTEM_PROMPT,
      prompt: stricterPrompt,
      temperature: 0.85,
    });
  }

  try {
    let result;
    try {
      result = await tryGenerate(0);
    } catch (e) {
      // Probablement schema validation fail (post trop long) → retry 1 fois
      console.warn('hook-generator: 1er essai échoué, retry —', e instanceof Error ? e.message : e);
      result = await tryGenerate(1);
    }
    const object = result.object;

    // Guard : on vérifie que le post commence bien par le hook (sinon on prefix)
    let post = object.post;
    const expectedStart = `${object.hook.line1}\n\n${object.hook.line2}`;
    if (!post.startsWith(object.hook.line1)) {
      // Si Claude n'a pas commencé par line1, on force la cohérence
      post = `${expectedStart}\n\n${post}`;
    }

    // Auto-save en DB (cold_dm_drafts) si l'auth est founder via cookie Supabase.
    //   - On skip si l'auth est via x-internal-secret (curl/scripts) sans founder
    //     email identifiable.
    //   - Non bloquant : si l'insert DB échoue, on renvoie quand même le résultat.
    let draftId: string | null = null;
    try {
      const founderEmail = await getFounderEmail();
      if (founderEmail) {
        const db = getSupabase();
        const { data, error } = await db
          .from('cold_dm_drafts')
          .insert({
            founder_email:   founderEmail,
            prospect_handle: handle,
            source_posts:    posts,
            hook_line1:      object.hook.line1,
            hook_line2:      object.hook.line2,
            full_post:       post,
            status:          'draft',
          })
          .select('id')
          .single();
        if (error) {
          console.error('hook-generator: erreur insert draft —', error.message);
        } else {
          draftId = data?.id ?? null;
        }
      }
    } catch (e) {
      console.error('hook-generator: erreur auto-save draft —', e instanceof Error ? e.message : e);
    }

    return NextResponse.json({
      ok:     true,
      handle,
      hook:   object.hook,
      post,
      draftId, // null si pas sauvegardé (auth via secret header sans founder Supabase)
    });
  } catch (e) {
    console.error('hook-generator error:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Génération échouée. Réessaie ou vérifie le contenu des posts.' },
      { status: 502 },
    );
  }
}
