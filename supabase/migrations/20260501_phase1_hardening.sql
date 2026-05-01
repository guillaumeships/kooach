-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 1 — Hardening : Stripe lifecycle + rate limiting + idempotence
-- ─────────────────────────────────────────────────────────────────────────────
--
-- À lancer dans l'éditeur SQL de Supabase (Dashboard → SQL Editor → New query → Run).
--
-- Ce que ça ajoute :
--   - stripe_customer_id / stripe_subscription_id : nécessaires pour révoquer
--     l'accès quand l'utilisateur annule depuis le Customer Portal.
--   - subscription_active : flag à false quand l'abo est annulé/expiré, vérifié
--     dans /api/generate avant d'autoriser une génération.
--   - daily_gen_count + daily_gen_reset_at : rate limiting (20 gen/jour).
--
-- Table dédiée stripe_events : idempotence du webhook (évite d'envoyer 2 fois
-- l'email d'accès si Stripe retry l'événement).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_active    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_gen_count        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_gen_reset_at     timestamptz;

-- Index pour retrouver un profil par customer_id Stripe (utilisé par le webhook
-- subscription.deleted qui ne donne que le customer_id, pas l'email).
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Idempotence webhook Stripe
-- ─────────────────────────────────────────────────────────────────────────────
-- On stocke chaque event_id reçu. Si on le revoit, on skip → pas de double email,
-- pas de double création de profil.

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id   text PRIMARY KEY,
  type       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TTL implicite : on peut purger les events > 30 jours via cron Supabase
-- (pas critique, table reste petite).
