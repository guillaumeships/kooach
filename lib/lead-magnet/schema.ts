/**
 * lib/lead-magnet/schema.ts
 *
 * Schémas zod partagés pour le générateur d'accroches gratuit.
 * Utilisés à la fois côté API (validation body + parsing IA) et côté client.
 */

import { z } from 'zod';

export const NICHE_VALUES = [
  'musculation',
  'perte-poids',
  'prepa-physique',
  'a-domicile',
  'en-ligne',
  'autre',
] as const;

export const GOAL_VALUES = ['dms', 'ventes', 'rdv', 'notoriete'] as const;

/** Validation du body POST /api/lead-magnet/generate */
export const leadMagnetRequestSchema = z.object({
  niche: z.enum(NICHE_VALUES),
  topic: z.string().trim().min(3).max(120),
  goal:  z.enum(GOAL_VALUES),
  email: z.string().email().max(254),
});

export type LeadMagnetRequest = z.infer<typeof leadMagnetRequestSchema>;

/** Schema d'une accroche unique (pour la sortie IA) */
export const hookSchema = z.object({
  text:     z.string().describe("L'accroche elle-même, en français, 1 à 3 phrases courtes max."),
  category: z.string().describe("Nom FRANÇAIS EN MINUSCULES du pattern utilisé. Valeurs autorisées : casse-croyance, contre-courant, mini-histoire, liste promesse, douleur ciblée, effet teasing, preuve client, urgence, chiffre choc, recadrage."),
});

/** Schema de la sortie complète : exactement 10 hooks */
export const hooksOutputSchema = z.object({
  hooks: z.array(hookSchema).length(10),
});

export type Hook = z.infer<typeof hookSchema>;
export type HooksOutput = z.infer<typeof hooksOutputSchema>;

/** Labels FR pour affichage (cohérents avec le form UI) */
export const NICHE_LABELS: Record<typeof NICHE_VALUES[number], string> = {
  'musculation':    'Musculation / force',
  'perte-poids':    'Perte de poids',
  'prepa-physique': 'Prépa physique (course, cross, HIIT)',
  'a-domicile':     'Coaching à domicile',
  'en-ligne':       'Coaching en ligne',
  'autre':          'Autre / mixte',
};

export const GOAL_LABELS: Record<typeof GOAL_VALUES[number], string> = {
  'dms':       'Attirer des DMs',
  'ventes':    'Vendre un programme',
  'rdv':       'Décrocher des RDV bilan',
  'notoriete': 'Booster la notoriété',
};
