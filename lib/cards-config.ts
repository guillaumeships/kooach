import type { GenerationResult } from '@/types/database';

export type SingleContentKey =
  | 'post_emotionnel'
  | 'post_educatif'
  | 'post_motivationnel'
  | 'bio_instagram'
  | 'newsletter'
  | 'email_relance'
  | 'reel';

export interface CardDef {
  label: string;
  only: SingleContentKey;
  fields: (keyof GenerationResult)[];
  icon: string;
  iconBg: string;
  subLabels?: Partial<Record<keyof GenerationResult, string>>;
}

export const OBJECTIFS = [
  { value: 'Attirer des DMs', icon: '💬' },
  { value: 'Décrocher des RDV', icon: '📅' },
  { value: 'Vendre mon programme', icon: '🎯' },
  { value: 'Gagner en notoriété', icon: '🌱' },
] as const;

export const CARDS: CardDef[] = [
  {
    label: 'Post émotionnel',
    only: 'post_emotionnel',
    fields: ['post_emotionnel'],
    icon: '💜',
    iconBg: 'bg-violet-100',
  },
  {
    label: 'Post éducatif',
    only: 'post_educatif',
    fields: ['post_educatif'],
    icon: '📚',
    iconBg: 'bg-sky-100',
  },
  {
    label: 'Post motivationnel',
    only: 'post_motivationnel',
    fields: ['post_motivationnel'],
    icon: '⚡',
    iconBg: 'bg-amber-100',
  },
  {
    label: 'Bio Instagram',
    only: 'bio_instagram',
    fields: ['bio_instagram'],
    icon: '📷',
    iconBg: 'bg-rose-100',
  },
  {
    label: 'Newsletter',
    only: 'newsletter',
    fields: ['newsletter'],
    icon: '📨',
    iconBg: 'bg-emerald-100',
  },
  {
    label: 'Email de relance',
    only: 'email_relance',
    fields: ['email_relance'],
    icon: '✉️',
    iconBg: 'bg-slate-100',
  },
  {
    label: 'Réel — Idée + Script',
    only: 'reel',
    fields: ['reel_idee', 'reel_script'],
    icon: '🎬',
    iconBg: 'bg-orange-100',
    subLabels: { reel_idee: 'Idée', reel_script: 'Script' },
  },
];

export const HISTORY_LABELS: Record<
  Exclude<keyof GenerationResult, never>,
  { label: string; icon: string }
> = {
  post_emotionnel: { label: 'Post émotionnel', icon: '💜' },
  post_educatif: { label: 'Post éducatif', icon: '📚' },
  post_motivationnel: { label: 'Post motivationnel', icon: '⚡' },
  bio_instagram: { label: 'Bio Instagram', icon: '📷' },
  newsletter: { label: 'Newsletter', icon: '📨' },
  email_relance: { label: 'Email de relance', icon: '✉️' },
  reel_idee: { label: 'Réel — Idée', icon: '🎬' },
  reel_script: { label: 'Réel — Script', icon: '🎬' },
};
