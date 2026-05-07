/**
 * lib/lead-magnet/generate.ts
 *
 * Génère 10 accroches Instagram pour un coach sportif FR via Claude
 * (Vercel AI SDK + AI Gateway), en s'appuyant sur 10 patterns de hook
 * différents pour maximiser la diversité du résultat.
 */

import { generateObject } from 'ai';
import { getModel } from '@/lib/ai-model';
import { hooksOutputSchema, type HooksOutput, NICHE_LABELS, GOAL_LABELS, type LeadMagnetRequest } from '@/lib/lead-magnet/schema';

const SYSTEM_PROMPT = `Tu es un copywriter français expert en hooks Instagram pour le marché du coaching sportif FR.

Tu connais à froid les 10 patterns qui scrollent net dans le fitness. Pour chaque accroche, tu indiques le NOM FRANÇAIS du pattern utilisé EXACTEMENT comme ci-dessous (en minuscules, accents inclus) :

- "casse-croyance" : démonter une idée reçue largement répandue
- "contre-courant" : prendre l'inverse de l'avis majoritaire
- "mini-histoire" : ouvrir sur une scène concrète et émotionnelle (un client, un moment précis)
- "liste promesse" : promettre N éléments numérotés (3 erreurs, 5 signes…)
- "douleur ciblée" : nommer une frustration spécifique que ressent l'audience
- "effet teasing" : créer un écart d'information qui force à lire la suite
- "preuve client" : citer un cas concret avec résultat chiffré
- "urgence" : timing serré ou enjeu immédiat
- "chiffre choc" : un chiffre précis qui surprend ou crédibilise (84%, 4 mois, 8 personnes sur 10…)
- "recadrage" : reformuler le problème sous un angle inattendu

RÈGLES ABSOLUES :
- 100% en français, jamais en anglais — ni dans le texte, ni dans la category
- 1 à 3 phrases courtes max par accroche, jamais plus
- Pas de hashtags, pas d'emojis (l'utilisateur les ajoutera)
- Ton coach sportif terrain : direct, parlé, jamais polished/corporate
- Zéro cliché motivationnel ("crois en toi", "le voyage commence par un pas", "donne le meilleur de toi-même")
- Pas de phrase qui pourrait être dite par n'importe quel coach — chaque accroche doit être SPÉCIFIQUE au sujet donné
- Évite "Tu sais ce que…", "T'es-tu déjà demandé…" et autres openers usés
- Pas de mention "coach" / "coaching" dans l'accroche elle-même (c'est implicite)
- Les 10 accroches doivent couvrir les 10 patterns DIFFÉRENTS ci-dessus, pas de doublon

Tu réponds en JSON strict via le schéma fourni. Aucun texte hors JSON.`;

function buildUserPrompt(input: LeadMagnetRequest): string {
  const niche = NICHE_LABELS[input.niche];
  const goal = GOAL_LABELS[input.goal];

  return `NICHE DU COACH : ${niche}
SUJET DU POST : ${input.topic}
OBJECTIF DU POST : ${goal}

Génère exactement 10 accroches Instagram pour ce coach, chacune utilisant un pattern différent parmi les 10 du système : casse-croyance, contre-courant, mini-histoire, liste promesse, douleur ciblée, effet teasing, preuve client, urgence, chiffre choc, recadrage.

Pour chaque accroche, indique dans le champ \`category\` le NOM FRANÇAIS EXACT du pattern utilisé (en minuscules, accents inclus, sans guillemets).

Les 10 accroches doivent toutes parler du même sujet (${input.topic}) mais l'attaquer sous 10 angles différents. L'objectif du post est de ${goal.toLowerCase()} — calibre le ton et le hook en conséquence.`;
}

/**
 * Génère 10 accroches via Claude. Lit la clé d'API via la convention
 * Vercel AI SDK : `AI_GATEWAY_API_KEY` (préféré) ou fallback `ANTHROPIC_API_KEY`.
 */
export async function generateHooks(input: LeadMagnetRequest): Promise<HooksOutput> {
  const { object } = await generateObject({
    model: getModel(),
    schema: hooksOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    temperature: 0.85,
    maxRetries: 2,
  });

  return object;
}
