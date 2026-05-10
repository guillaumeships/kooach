/**
 * lib/lead-magnet-bio/schema.ts
 *
 * Schémas zod pour le 2e free tool : générateur de bio Instagram pour
 * coach sportif. Mot-clé SEO cible : "bio instagram coach sportif" (~500/mois FR).
 *
 * Output = 5 bios différentes calibrées sur 5 angles distincts (autorité,
 * transformation client, locale, lifestyle, expertise).
 */

import { z } from 'zod';

export const BIO_NICHE_VALUES = [
  'musculation',
  'perte-poids',
  'prepa-physique',
  'a-domicile',
  'en-ligne',
  'femmes',
  'transformation',
  'autre',
] as const;

export const BIO_GOAL_VALUES = ['dms', 'rdv', 'lien-bio', 'notoriete'] as const;

/** Validation du body POST /api/lead-magnet/generate-bio */
export const bioRequestSchema = z.object({
  niche:     z.enum(BIO_NICHE_VALUES),
  specialty: z.string().trim().min(3).max(120),
  city:      z.string().trim().max(80).optional().or(z.literal('')),
  goal:      z.enum(BIO_GOAL_VALUES),
  email:     z.string().email().max(254),
});

export type BioRequest = z.infer<typeof bioRequestSchema>;

/** Schema d'une bio unique */
export const bioItemSchema = z.object({
  text:     z.string().describe('La bio Instagram complète, max 150 caractères, peut contenir 1-2 emojis bien placés et des sauts de ligne (un par phrase courte).'),
  category: z.string().describe("Nom FR EN MINUSCULES de l'angle utilisé. Valeurs autorisées : autorite, transformation, locale, lifestyle, expertise."),
});

export const biosOutputSchema = z.object({
  bios: z.array(bioItemSchema).length(5),
});

export type BioItem = z.infer<typeof bioItemSchema>;
export type BiosOutput = z.infer<typeof biosOutputSchema>;

/** Labels FR pour affichage UI */
export const BIO_NICHE_LABELS: Record<typeof BIO_NICHE_VALUES[number], string> = {
  'musculation':    'Musculation / force',
  'perte-poids':    'Perte de poids',
  'prepa-physique': 'Prépa physique',
  'a-domicile':     'Coaching à domicile',
  'en-ligne':       'Coaching en ligne',
  'femmes':         'Coach femmes',
  'transformation': 'Transformation corps',
  'autre':          'Autre / mixte',
};

export const BIO_GOAL_LABELS: Record<typeof BIO_GOAL_VALUES[number], string> = {
  'dms':       'Recevoir des DMs',
  'rdv':       'Faire prendre RDV',
  'lien-bio':  'Cliquer sur le lien en bio',
  'notoriete': 'Travailler la notoriété',
};

export const BIO_CATEGORY_LABELS: Record<string, string> = {
  autorite:        'Autorité / expertise',
  transformation:  'Résultat client (transfo)',
  locale:          'Ancrage local / proximité',
  lifestyle:       'Style de vie / inspiration',
  expertise:       'Spécialisation pointue',
};
