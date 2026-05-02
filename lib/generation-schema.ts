/**
 * lib/generation-schema.ts
 *
 * Schema zod partagé client + server pour le streaming AI.
 * Utilisé par streamObject (server) et useObject (client) — les deux côtés
 * doivent matcher pour que le parsing JSON streamé fonctionne.
 */

import { z } from 'zod';

export const GenerationContentSchema = z.object({
  post_emotionnel: z
    .string()
    .describe('Post Instagram émotionnel : 200-300 mots, hook fort, emojis, hashtags'),
  post_educatif: z
    .string()
    .describe('Post Instagram éducatif : 200-300 mots, explique UN concept précis'),
  post_motivationnel: z
    .string()
    .describe('Post Instagram motivationnel : 200-300 mots, ton vibrant'),
  newsletter: z
    .string()
    .describe('Newsletter : "Objet : [titre]\\n\\n[corps 150-200 mots]"'),
  bio_instagram: z
    .string()
    .describe('Bio Instagram : MAXIMUM 150 caractères, promesse + CTA'),
  email_relance: z
    .string()
    .describe('Email de relance : "Objet : [...]\\n\\nBonjour [Prénom],\\n\\n[corps]"'),
  reel_idee: z
    .string()
    .describe('Idée de Réel : concept visuel précis (angle, décor, ambiance)'),
  reel_script: z
    .string()
    .describe('Script de Réel : texte parlé naturel 40-60 secondes'),
});

export type GenerationContent = z.infer<typeof GenerationContentSchema>;
