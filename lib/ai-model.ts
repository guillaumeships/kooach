/**
 * lib/ai-model.ts
 *
 * Sélection du modèle Claude — Vercel AI Gateway si dispo, fallback sur
 * `@ai-sdk/anthropic` direct sinon.
 *
 * Centralisé ici pour que toutes les routes IA (génération principale,
 * lead magnet, etc.) bénéficient automatiquement du même fallback.
 */

import { anthropic } from '@ai-sdk/anthropic';

const MODEL_ID = 'claude-sonnet-4-6';

/**
 * - Si `AI_GATEWAY_API_KEY` est défini → string "anthropic/claude-sonnet-4-6"
 *   (le SDK reconnaît la convention "provider/model" et tape le Gateway).
 * - Sinon → provider direct via `@ai-sdk/anthropic` (lit `ANTHROPIC_API_KEY`).
 */
export function getModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return `anthropic/${MODEL_ID}` as const;
  }
  return anthropic(MODEL_ID);
}
