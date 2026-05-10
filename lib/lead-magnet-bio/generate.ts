/**
 * lib/lead-magnet-bio/generate.ts
 *
 * Génère 5 bios Instagram pour un coach sportif FR via Claude (Vercel AI SDK
 * + Gateway), en utilisant 5 angles différents : autorité, transformation,
 * locale, lifestyle, expertise. Permet au coach de choisir / mixer.
 */

import { generateObject } from 'ai';
import { getModel } from '@/lib/ai-model';
import {
  biosOutputSchema,
  type BiosOutput,
  BIO_NICHE_LABELS,
  BIO_GOAL_LABELS,
  type BioRequest,
} from '@/lib/lead-magnet-bio/schema';

const SYSTEM_PROMPT = `Tu es un copywriter français expert en bios Instagram pour le marché du coaching sportif FR.

Une bio Instagram efficace tient en 150 caractères max et doit faire 3 choses :
1. Dire POUR QUI tu es (la niche, en 1-2 mots clairs)
2. Dire CE QUE tu transformes (le résultat tangible, pas le service)
3. Provoquer L'ACTION (clic sur le lien, DM, suivre)

Tu génères exactement 5 bios différentes, chacune sous un angle distinct :

- "autorite" : mise en avant du diplôme, expérience, certification (STAPS, années d'exp, athlètes coachés)
- "transformation" : focus sur le résultat client tangible (kg perdus, transfo, prise de masse)
- "locale" : ancrage géographique fort (ville, région, "à 5 min de [lieu connu]")
- "lifestyle" : tonalité aspirationnelle, vie/identité du coach (sport + nutrition + mindset)
- "expertise" : niche ultra-pointue, "celui/celle qui fait [truc spécifique]" (ex: prépa physique foot 12 ans pros)

RÈGLES ABSOLUES :
- 100% en français, jamais en anglais
- Max 150 caractères TOTAL par bio (espaces inclus, hashtags inclus)
- Au max 1-2 emojis par bio, bien placés (pas en série)
- Sauts de ligne autorisés et même encouragés (1 par phrase courte) — Instagram supporte
- Ton COACH SPORTIF TERRAIN : direct, parlé, concret. JAMAIS corporate / motivationnel cliché
- Pas de "passionné de fitness" / "passion fitness" / "amoureux du sport" (mort)
- Pas de "let's go" / "no pain no gain" / "transforme ta vie" (overused)
- Chaque bio doit être SPÉCIFIQUE à la niche/spécialité données — jamais générique
- La 5e bio (expertise) doit citer un truc précis et crédible (chiffre, type de client, lieu d'exercice)

Tu réponds en JSON strict via le schéma fourni. Aucun texte hors JSON.`;

function buildUserPrompt(input: BioRequest): string {
  const niche = BIO_NICHE_LABELS[input.niche];
  const goal = BIO_GOAL_LABELS[input.goal];
  const cityLine = input.city && input.city.length > 0 ? `VILLE / ZONE : ${input.city}` : 'VILLE / ZONE : non précisée';

  return `NICHE DU COACH : ${niche}
SPÉCIALITÉ / ANGLE PERSO : ${input.specialty}
${cityLine}
OBJECTIF DE LA BIO : ${goal}

Génère exactement 5 bios Instagram pour ce coach, chacune sous un angle différent : autorite, transformation, locale, lifestyle, expertise.

Pour chaque bio, indique dans le champ \`category\` le nom de l'angle utilisé (en minuscules, sans accents : autorite, transformation, locale, lifestyle, expertise).

Si VILLE est précisée → la bio "locale" DOIT obligatoirement la nommer.
Si VILLE n'est pas précisée → la bio "locale" peut ancrer la proximité autrement (zone, "à domicile dans toute la France", etc.).

L'objectif final de la bio est : ${goal.toLowerCase()}. Calibre l'appel à l'action en conséquence (DM, RDV, lien, etc.). Le call-to-action doit être DANS la bio elle-même (max 1 ligne en bas).

Chaque bio doit faire MAXIMUM 150 caractères au total. Compte. Ne dépasse jamais.`;
}

/**
 * Génère 5 bios Instagram. Lit la clé d'API via Vercel AI SDK :
 * `AI_GATEWAY_API_KEY` (préféré) ou fallback `ANTHROPIC_API_KEY`.
 */
export async function generateBios(input: BioRequest): Promise<BiosOutput> {
  const { object } = await generateObject({
    model: getModel(),
    schema: biosOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(input),
    temperature: 0.85,
    maxRetries: 2,
  });

  return object;
}
