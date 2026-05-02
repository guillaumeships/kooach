/**
 * types/database.ts
 *
 * Types TypeScript qui correspondent exactement aux tables Supabase.
 * Les champs nullables (text sans NOT NULL) sont string | null.
 * Les dates Supabase arrivent sous forme de string ISO 8601.
 */

// Table : profiles
// Stocke le profil de chaque coach (informations utilisées pour personnaliser la génération IA)
export interface Profile {
  id: string;
  email: string | null;
  specialty: string | null;
  style: string | null;
  keywords: string | null;
  target: string | null;
  credits: number;
  last_generated_at: string | null;
  streak_count: number;
  // Voice cloning : exemples de posts du coach pour calibrer l'IA (cf. migration
  // 20260502_voice_cloning.sql).
  example_posts: string | null;
  // Stripe lifecycle (cf. migration 20260501_phase1_hardening.sql)
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_active: boolean;
  // Rate limiting daily
  daily_gen_count: number;
  daily_gen_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

// Table : generations
// Stocke chaque résultat de génération IA, lié à un coach par son email
export interface Generation {
  id: string;                       // uuid
  user_email: string | null;        // email du coach
  created_at: string;               // timestamptz ISO 8601
  post_emotionnel: string | null;
  post_educatif: string | null;
  post_motivationnel: string | null;
  bio_instagram: string | null;
  newsletter: string | null;
  email_relance: string | null;
  reel_idee: string | null;
  reel_script: string | null;
}

// Table : lead_magnet_subscribers
// Capture email + niche + sujet + objectif depuis l'outil gratuit
// /generateur-accroches. Sert de DB pour le nurturing email J0/J1/J3/J7.
export interface LeadMagnetSubscriber {
  id: string;                       // uuid
  email: string;
  niche: string;                    // valeur enum (cf. lib/lead-magnet/schema.ts)
  topic: string;                    // sujet libre du post
  goal: string;                     // valeur enum (cf. lib/lead-magnet/schema.ts)
  hooks: { text: string; category: string }[] | null;  // snapshot 10 accroches
  ip_hash: string | null;           // SHA-256 de l'IP, RGPD-safe
  user_agent: string | null;
  created_at: string;
  // Tracking nurturing
  pdf_sent_at: string | null;       // historique : envoi email J0 (renommé "pdf" pour rétrocompat SQL)
  email_j1_sent_at: string | null;
  email_j3_sent_at: string | null;
  email_j7_sent_at: string | null;
  unsubscribed_at: string | null;
}

// Sous-types utilitaires

// Données saisies par le coach dans le formulaire de génération
export interface GenerationInput {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
}

// Résultat complet retourné par l'API /api/generate
export interface GenerationResult {
  post_emotionnel: string;
  post_educatif: string;
  post_motivationnel: string;
  bio_instagram: string;
  newsletter: string;
  email_relance: string;
  reel_idee: string;
  reel_script: string;
}
