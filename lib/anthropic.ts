/**
 * lib/anthropic.ts
 *
 * Génération de contenu via Vercel AI SDK + AI Gateway.
 *
 * Pourquoi le gateway plutôt que le SDK Anthropic direct :
 *   - Fallback automatique entre providers (si Claude down, switch silencieux)
 *   - Observabilité gratuite (latence, coût, erreurs par modèle)
 *   - Zero data retention par défaut
 *   - Une seule clé `AI_GATEWAY_API_KEY` au lieu de gérer 1 clé/provider
 *
 * Le SDK lit `AI_GATEWAY_API_KEY` automatiquement, fallback sur `ANTHROPIC_API_KEY`
 * via `@ai-sdk/anthropic` direct si gateway absent.
 *
 * Exports :
 *   generateContent(params)  → 7 contenus (ou un seul si `only`)
 *   generatePreview(...)     → post de démo pour landing
 *   buildUserPrompt(...)     → prompt complet
 *   buildSinglePrompt(...)   → prompt single
 *   extractFirstJsonObject() → parser JSON robuste
 */

import { generateText, streamObject } from 'ai';
import type { GenerationResult } from '@/types/database';
import { GenerationContentSchema } from '@/lib/generation-schema';
import { getModel } from '@/lib/ai-model';

// ─────────────────────────────────────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Kooach, ghost-writer expert pour coachs sportifs français indépendants.
Tu écris comme un humain qui connaît le terrain — pas comme une IA qui récite des conseils.

═══════════════════════════════════════════════════════════════════
🎯 RÈGLE #1 — AUDIENCE & NARRATEUR (CRITIQUE — VIOLATION = ÉCHEC)
═══════════════════════════════════════════════════════════════════

Le coach utilise Kooach pour générer du contenu qu'IL VA PUBLIER sur
SES réseaux (Instagram, newsletter, email) pour ATTIRER ET ENGAGER
SES CLIENTS POTENTIELS.

→ NARRATEUR (qui parle)  : LE COACH ("je", "j'ai", "mes clients", "moi")
→ AUDIENCE  (à qui on parle) : LES CLIENTS POTENTIELS du coach
                                (= champ CIBLE CLIENT du brief)
                                Pronoms : "tu", "toi", "ton corps"…

❌ INTERDIT : générer un contenu adressé "au coach" lui-même.
   Erreur typique de l'IA : "Tu t'entraînes depuis des mois et personne
   ne le sait... tes clients potentiels..." → ça parle à un AUTRE coach.
   C'est faux. Le coach veut publier ce contenu sur SON Insta pour parler
   À SES futurs clients, pas à des confrères.

✅ CORRECT pour une cible "femmes 35-55 reprendre confiance" :
   "Marie, 47 ans, m'a dit hier : 'Je n'avais plus confiance en mon
   corps depuis 10 ans...' 6 mois plus tard, elle a couru son premier
   10 km. Toi qui me lis, tu te reconnais peut-être..."
   → le coach (NARRATEUR) raconte une story client, s'adresse à
   ses futures clientes (AUDIENCE), montre son expertise.

Cette règle s'applique à TOUS les contenus : posts, bio, newsletter,
email, réel idée et réel script. Sans exception.

═══════════════════════════════════════════════════════════════════
RÈGLES TECHNIQUES
═══════════════════════════════════════════════════════════════════

- Tout en français, jamais en anglais
- Adapter le ton EXACT au style du coach — si c'est direct, c'est direct. Si c'est doux, c'est doux.
- Zéro cliché motivationnel ("tu es capable", "crois en toi", "le voyage commence par un pas")
- Zéro liste à puces dans les posts Instagram — du texte qui coule, des paragraphes courts, du rythme
- Posts Instagram: 200-300 mots, emojis pertinents (pas excessifs), hook fort en première ligne qui arrête le scroll, bloc de 3 à 5 hashtags maximum séparés par \\n\\n — pertinents et ciblés, jamais plus de 5
- HASHTAGS — RÈGLE CRITIQUE : un hashtag est UN SEUL mot collé sans espace ni tiret. Ex CORRECT : #reprendrelesport · #coachsportifFR · #forceaufeminin · #transformationphysique. Ex INTERDIT : #reprendre le sport · #coach-sportif. Si plusieurs mots, on les colle ensemble (CamelCase ou tout minuscule). Instagram n'enregistre pas les hashtags avec espaces.
- Le post éducatif doit expliquer UN concept précis avec une mécanique claire — pas une liste de conseils génériques. Le coach explique à SES CLIENTS un point technique pour les aider.
- Newsletter: "Objet : [titre accrocheur]\\n\\n[corps 150-200 mots, ton de conversation intime]\\n\\nÀ très vite,\\n[Ton prénom]". IMPORTANT : laisse littéralement "[Ton prénom]" en placeholder à la fin (le coach le remplira lui-même par son vrai prénom). N'invente JAMAIS un prénom.
- Bio Instagram: MAXIMUM 150 caractères. La promesse que LE COACH fait à ses clients potentiels + appel à l'action (lien, DM…).
- Email de relance: au CLIENT INACTIF du coach. "Objet : [objet]\\n\\nBonjour [Prénom du client],\\n\\n[corps 3-4 paragraphes, chaleureux sans être insistant]\\n\\nÀ très vite,\\n[Ton prénom]". IMPORTANT : laisse "[Prénom du client]" et "[Ton prénom]" tels quels comme placeholders. Le coach les remplacera. N'invente JAMAIS de prénom.
- Réel idée: concept visuel très précis pour le tournage (angle caméra, décor, ambiance, ce que LE COACH fait visuellement face caméra). Décrit ce que le coach va filmer.
- Réel script: ce que LE COACH DIT À SES CLIENTS POTENTIELS face caméra. Texte parlé naturel 40-60 secondes, phrases courtes, rythme de quelqu'un qui parle — pas qui lit. S'adresse à un futur client ("toi qui veux progresser…"), JAMAIS à un autre coach.

Réponds UNIQUEMENT avec du JSON valide. Zéro markdown. Zéro backtick. Zéro commentaire.
IMPORTANT : Dans tes valeurs JSON, n'utilise jamais de guillemets doubles à l'intérieur du texte — utilise des guillemets simples ou reformule. Échappe tous les caractères spéciaux JSON correctement.`;

export const SINGLE_CFG = {
  post_emotionnel:    { shape: '"post_emotionnel": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags"',     label: 'post Instagram émotionnel (200-300 mots, emojis, hashtags)' },
  post_educatif:      { shape: '"post_educatif": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags"',       label: 'post Instagram éducatif (200-300 mots, emojis, hashtags)' },
  post_motivationnel: { shape: '"post_motivationnel": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags"',  label: 'post Instagram motivationnel (200-300 mots, emojis, hashtags)' },
  bio_instagram:      { shape: '"bio_instagram": "bio max 150 caractères"',                                                            label: "bio Instagram (MAXIMUM 150 caractères, appel à l'action)" },
  newsletter:         { shape: '"newsletter": "Objet : [titre]\\n\\n[corps]\\n\\nÀ très vite,\\n[Ton prénom]"',                                                         label: 'newsletter (Objet : [titre]\\n\\n[corps 150-200 mots, ton intime]\\n\\nÀ très vite,\\n[Ton prénom])' },
  email_relance:      { shape: '"email_relance": "Objet : [objet]\\n\\nBonjour [Prénom du client],\\n\\n[corps]\\n\\nÀ très vite,\\n[Ton prénom]"', label: 'email de relance client inactif (3-4 paragraphes, finit avec placeholders [Prénom du client] et [Ton prénom])' },
  reel:               { shape: '"reel_idee": "description détaillée du concept visuel",\n  "reel_script": "texte exact à dire devant la caméra"', label: 'idée de réel (concept visuel précis) + script réel (texte parlé 40-60 secondes)' },
} as const;

export type SingleContentKey = keyof typeof SINGLE_CFG;

// ─────────────────────────────────────────────────────────────────────────────
// VOICE CLONING & PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

function buildVoiceCloneBlock(posts: string): string {
  if (!posts || posts.trim().length < 30) return '';
  return `

═══════════════════════════════════════════════════════════════════
🎯 VOICE CLONING — DIRECTIVES PRIORITAIRES (à suivre absolument)
═══════════════════════════════════════════════════════════════════

Voici 2-3 vrais posts écrits par ce coach. Ce sont tes RÉFÉRENCES de style
absolues. Tu DOIS imiter avec précision :
1. Le ton (chaleureux / direct / cassant / pédagogue / poétique...)
2. Les expressions et tics de langage caractéristiques
3. La structure des phrases (courtes/longues, cadencées, ponctuation)
4. L'usage des emojis (lesquels, fréquence, placement)
5. La façon de hooker en première ligne
6. La façon de conclure (CTA, question, déclaration...)

Le contenu que tu génères doit pouvoir passer pour AUTHENTIQUEMENT écrit par
ce coach. Si quelqu'un qui le suit lit ton post, il ne doit pas pouvoir
distinguer ton écriture de la sienne.

INTERDIT formellement :
- Générer un style "marketing IA générique" différent de l'échantillon
- Lisser ou édulcorer le ton (si direct = direct, si rude = rude)
- Ajouter des emojis ou expressions qui ne sont pas dans son registre
- Changer la longueur typique des phrases qu'il utilise

RÉFÉRENCES — VRAIS POSTS DE CE COACH :
${posts}
═══════════════════════════════════════════════════════════════════
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANGLES D'ATTAQUE — variation pour éviter les outputs similaires entre users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 15 angles d'attaque calibrés coach sportif FR. À chaque génération complète,
 * on tire 1 angle au hasard — ce qui garantit que 2 users avec le même profil
 * ne reçoivent pas le même contenu. Pattern utilisé par les meilleurs SaaS de
 * gen content 2026 (Cohere, Lovable, v0).
 *
 * Chaque angle est un vrai pattern qui marche en fitness FR Insta.
 */
const ANGLES_ATTAQUE = [
  "story-client : raconte une story précise d'un client avec prénom, âge, contexte. Citation textuelle de ce qu'il/elle a dit. Le coach prouve son impact via l'humain.",
  "contrarian : prends une position contre une croyance dominante du fitness FR (ex: « le cardio à jeun, c'est de la merde »). Argumente en 200 mots.",
  "micro-prédiction : prédis un piège que va vivre le client (ex: « dans 3 semaines, tu vas vouloir abandonner. Voilà pourquoi, et comment passer outre »).",
  "chiffre-choc : ouvre avec un chiffre fort vérifiable du milieu fitness/santé qui fait réagir, et déroule pourquoi.",
  "coulisses : un moment précis de ta journée de coach que personne ne voit (ex: 6h du matin avant d'ouvrir la salle, ce que tu prépares mentalement).",
  "call-out : un comportement de coach que tu refuses de faire et pourquoi (ex: « je ne fais jamais signer de contrat 12 mois — voilà pourquoi »).",
  "méthode-unique : explique TA façon de faire un truc précis (ex: comment tu reconstruis le squat de zéro avec un débutant).",
  "ennemi-cliché : combat un cliché du coaching FR (ex: « non, tu n'as pas besoin de prot whey si tu ne t'entraînes pas 4x/sem »).",
  "before-after : un moment de transformation client précis — où il/elle en était il y a 6 mois vs maintenant. Concret, pas marketing.",
  "vérité-dérangeante : une vérité que tes clients ne veulent pas entendre (ex: « si tu loupes 2 séances par semaine, tu progresseras pas. Point. »).",
  "question-piège : pose une question simple qui force le client à réfléchir, puis réponds (ex: « combien de séances tu as fait cette semaine ? Vraiment ? »).",
  "démystification : démonte un mythe muscu/cardio/perte de poids avec un argument scientifique simple.",
  "micro-leçon : un point technique précis expliqué en mode terrain (ex: pourquoi le tempo en muscu compte plus que le poids).",
  "témoignage-coach : ce que TOI tu as appris en coachant cette année. Vulnérable, perso, pas marketing.",
  "erreur-débutant : l'erreur que 90% des débutants en muscu/perte de poids font, et la correction simple.",
] as const;

function pickRandomAngle(): string {
  const idx = Math.floor(Math.random() * ANGLES_ATTAQUE.length);
  return ANGLES_ATTAQUE[idx];
}

function buildAngleBlock(): string {
  const angle = pickRandomAngle();
  return `

🎲 ANGLE D'ATTAQUE TIRÉ POUR CETTE GÉNÉRATION : ${angle}
→ Au moins 1 des 3 posts Instagram doit suivre cet angle. Les autres
  contenus peuvent varier, mais l'ensemble doit avoir une cohérence
  d'identité (pas 7 contenus complètement décorrélés).`;
}

/**
 * Bloc "history awareness" — passe les 1-3 derniers contenus déjà générés
 * pour que Claude évite de répéter les mêmes angles. Simple snippet (200 chars
 * max par contenu) pour ne pas saturer le prompt.
 */
function buildHistoryBlock(recentSnippets: string[] | undefined): string {
  if (!recentSnippets || recentSnippets.length === 0) return '';
  const cleaned = recentSnippets
    .filter((s) => s && s.trim().length > 30)
    .slice(0, 3)
    .map((s, i) => `[${i + 1}] ${s.slice(0, 200).replace(/\s+/g, ' ').trim()}…`)
    .join('\n');
  if (!cleaned) return '';
  return `

📜 ANGLES DÉJÀ UTILISÉS RÉCEMMENT PAR CE COACH (à ÉVITER absolument) :
${cleaned}

→ Génère des contenus FRANCHEMENT DIFFÉRENTS de ces 3 — autre angle d'ouverture,
  autre type d'argument, autre rythme. Le user ne doit pas avoir l'impression
  de relire la même chose.`;
}

/**
 * Calibrage spécifique selon l'objectif sélectionné par le coach.
 * Si pas d'objectif, on retourne juste un thème (legacy).
 */
function buildObjectiveBlock(objectif: string | undefined): string {
  if (!objectif || !objectif.trim()) return '';
  const o = objectif.trim();

  // Calibrage explicite pour les 4 objectifs Kooach
  const calibration: Record<string, string> = {
    'Attirer des DMs':
      'CTA fort qui invite à écrire en DM ("DM-moi le mot X", "raconte-moi ton blocage en MP"). Posts qui suscitent une réaction émotionnelle ou une question — celle où on a envie de partager son histoire perso.',
    'Décrocher des RDV':
      "CTA explicite vers un appel découverte / programme (\"lien en bio\", \"réserve ton créneau\"). Posts qui montrent le bénéfice concret de bosser avec le coach (transformation, méthode unique).",
    'Vendre mon programme':
      "Présenter le bénéfice client concret + offre claire + CTA vers le programme. Story de transformation client + chiffre/résultat tangible + invitation à rejoindre.",
    'Gagner en notoriété':
      "Démontrer l'expertise du coach AUX CLIENTS POTENTIELS — story client, transformation, mécanique précise, prise de position contre une croyance fausse. Le coach prouve sa compétence à ses futurs clients en partageant un savoir actionnable.",
  };

  const calibrated = calibration[o];
  if (calibrated) {
    return `

OBJECTIF DU COACH POUR CETTE GÉNÉRATION : « ${o} »
→ Calibrage : ${calibrated}`;
  }

  // Objectif libre (custom) → traité comme thème générique
  return `

OBJECTIF / THÈME PRIORITAIRE : « ${o} »`;
}

export function buildUserPrompt(
  specialty: string,
  style: string,
  keywords: string,
  target: string,
  posts: string,
  objectif?: string,
  recentSnippets?: string[],
): string {
  const postsBlock = buildVoiceCloneBlock(posts);
  const objectifBlock = buildObjectiveBlock(objectif);
  const angleBlock = buildAngleBlock();
  const historyBlock = buildHistoryBlock(recentSnippets);
  return `Génère du contenu marketing complet pour ce coach:

SPÉCIALITÉ: ${specialty}
STYLE & PERSONNALITÉ: ${style}
3 MOTS CLÉ: ${keywords}
CIBLE CLIENT (= AUDIENCE des contenus) : ${target}${objectifBlock}${angleBlock}${historyBlock}${postsBlock}

⚠ Rappel critique : tous les contenus s'adressent À LA CIBLE CLIENT
("tu" / "toi" = client potentiel du coach), JAMAIS au coach lui-même.
Le coach EST le NARRATEUR ("je"). C'est lui qui publiera ces contenus
sur SES réseaux pour parler À SES futurs clients.

Retourne ce JSON exact (toutes les valeurs en français, \\n pour les sauts de ligne):
{
  "post_emotionnel": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags (sans espaces dans les hashtags)",
  "post_educatif": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags (sans espaces dans les hashtags)",
  "post_motivationnel": "texte complet avec emojis et \\n\\n entre paragraphes, puis \\n\\n#hashtags (sans espaces dans les hashtags)",
  "newsletter": "Objet : [titre]\\n\\n[corps]\\n\\nÀ très vite,\\n[Ton prénom]",
  "bio_instagram": "bio max 150 caractères",
  "email_relance": "Objet : [objet]\\n\\nBonjour [Prénom du client],\\n\\n[corps]\\n\\nÀ très vite,\\n[Ton prénom]",
  "reel_idee": "description détaillée du concept visuel",
  "reel_script": "texte exact à dire devant la caméra"
}`;
}

export function buildSinglePrompt(
  specialty: string,
  style: string,
  keywords: string,
  target: string,
  only: SingleContentKey,
  posts: string,
  objectif?: string,
): string {
  const cfg = SINGLE_CFG[only];
  if (!cfg) return buildUserPrompt(specialty, style, keywords, target, posts, objectif);

  const postsBlock = buildVoiceCloneBlock(posts);
  const objectifBlock = buildObjectiveBlock(objectif);
  return `Génère uniquement ${cfg.label} pour ce coach:

SPÉCIALITÉ: ${specialty}
STYLE & PERSONNALITÉ: ${style}
3 MOTS CLÉ: ${keywords}
CIBLE CLIENT (= AUDIENCE du contenu) : ${target}${objectifBlock}${postsBlock}

⚠ Rappel critique : le contenu s'adresse à la CIBLE CLIENT
("tu" = client potentiel), pas au coach. Le coach est le NARRATEUR.

Retourne ce JSON exact (valeurs en français, \\n pour sauts de ligne):
{
  ${cfg.shape}
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER JSON ROBUSTE
// ─────────────────────────────────────────────────────────────────────────────

export function extractFirstJsonObject(raw: string): Record<string, unknown> {
  if (!raw || typeof raw !== 'string') throw new Error('Empty model response');

  const cleaned = raw
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim();

  try { return JSON.parse(cleaned) as Record<string, unknown>; } catch { /* continue */ }

  // Scan caractère par caractère pour trouver un objet JSON équilibré
  let start = -1;
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (inString && escapeNext) { escapeNext = false; continue; }
    if (inString && char === '\\') { escapeNext = true; continue; }
    if (char === '"' && !escapeNext) { inString = !inString; continue; }
    if (inString) continue;

    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      if (depth === 0) continue;
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        try { return JSON.parse(candidate) as Record<string, unknown>; } catch { /* continue */ }
      }
    }
  }

  throw new Error('No valid JSON object found');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL CONFIG — voir lib/ai-model.ts (sélection Gateway/direct centralisée)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS DE GÉNÉRATION
// ─────────────────────────────────────────────────────────────────────────────

interface GenerateParams {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
  posts?: string;
  /** Objectif du coach (Attirer DMs / Décrocher RDV / Vendre programme / Gagner notoriété)
      → calibrage explicite des CTA et angles dans le prompt user. */
  objectif?: string;
  /** Legacy : si pas d'objectif, theme est traité comme objectif libre. */
  theme?: string;
  /** Snippets des 1-3 derniers post_emotionnel du user — passés à Claude pour
      qu'il évite de répéter les mêmes angles (uniqueness inter-runs). */
  recentSnippets?: string[];
  only?: SingleContentKey;
}

export async function generateContent(
  params: GenerateParams,
): Promise<Partial<GenerationResult>> {
  const { specialty, style, keywords, target, posts, objectif, theme, recentSnippets, only } = params;

  const postsClean = typeof posts === 'string'
    ? posts
        .replace(/"/g, "'")
        .replace(/`/g, "'")
        .replace(/[‘’]/g, "'")
        .slice(0, 2000)
    : '';

  // Préfère objectif (calibré) sur theme (legacy)
  const effectiveObjective = objectif?.trim() || theme?.trim() || undefined;

  const userPrompt = only
    ? buildSinglePrompt(specialty, style, keywords, target, only, postsClean, effectiveObjective)
    : buildUserPrompt(specialty, style, keywords, target, postsClean, effectiveObjective, recentSnippets);

  const { text } = await generateText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    // Temperature 0.85 (full) / 0.65 (regen unitaire) :
    // - Full : on veut MAX de variation entre users similaires + entre runs
    // - Regen : on veut quelque chose de proche de l'original mais pas identique
    temperature: only ? 0.65 : 0.85,
    maxOutputTokens: only ? 1024 : 4096,
    abortSignal: AbortSignal.timeout(55_000),
  });

  return extractFirstJsonObject(text) as Partial<GenerationResult>;
}

/**
 * Variante streaming : retourne un stream que le client consomme via `useObject`.
 * Utilisé par /api/generate/stream — le user voit chaque champ s'écrire en
 * temps réel (perception 10× plus rapide qu'un `generateText` complet).
 *
 * Le caller (la route) gère l'auth/rate-limit avant ET la sauvegarde DB dans
 * `onFinish` (passé en option). Cette fonction ne fait QUE le streaming AI.
 */
export function streamGenerationContent(
  params: Omit<GenerateParams, 'only'> & {
    onFinish?: (event: { object: Partial<GenerationResult> | undefined }) => void | Promise<void>;
  },
) {
  const { specialty, style, keywords, target, posts, objectif, theme, recentSnippets, onFinish } = params;

  const postsClean = typeof posts === 'string'
    ? posts
        .replace(/"/g, "'")
        .replace(/`/g, "'")
        .replace(/[‘’]/g, "'")
        .slice(0, 2000)
    : '';

  const effectiveObjective = objectif?.trim() || theme?.trim() || undefined;

  const userPrompt = buildUserPrompt(specialty, style, keywords, target, postsClean, effectiveObjective, recentSnippets);

  return streamObject({
    model: getModel(),
    schema: GenerationContentSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    // Temperature 0.85 — créativité maximale pour éviter outputs similaires
    // entre users avec profils proches (cf ANGLES_ATTAQUE + history awareness).
    temperature: 0.85,
    onFinish: onFinish
      ? async ({ object }) => {
          await onFinish({ object: object as Partial<GenerationResult> | undefined });
        }
      : undefined,
    abortSignal: AbortSignal.timeout(55_000),
  });
}

export async function generatePreview(
  specialite: string,
  cible: string,
): Promise<string> {
  const previewPrompt = `Tu es un expert en création de contenu Instagram pour coachs français.
Génère un Post Émotionnel Instagram pour un coach avec ce profil :
- Spécialité : ${specialite}
- Cible : ${cible}
- Style : direct et bienveillant

Le post doit :
- Commencer par une phrase courte et percutante (hook)
- Raconter une micro-histoire ou exprimer une vérité émotionnelle
- Terminer par une question ou invitation à commenter
- Faire entre 150 et 220 mots
- Être en français, ton naturel, pas corporate
- Ne pas contenir de hashtags

Réponds uniquement avec le texte du post, sans titre ni explication.`;

  const { text } = await generateText({
    model: getModel(),
    prompt: previewPrompt,
    maxOutputTokens: 600,
    abortSignal: AbortSignal.timeout(55_000),
  });

  return text.trim();
}
