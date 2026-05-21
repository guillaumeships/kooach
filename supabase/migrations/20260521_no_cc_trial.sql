-- 20260521_no_cc_trial.sql
--
-- Migration manuelle (à appliquer via Supabase SQL Editor).
--
-- Contexte : Étape B no-CC trial 7 jours (cf. Notion "Spec Étape B").
-- Le trial passe de Stripe-managed (trial_period_days dans Checkout) à
-- Kooach-managed (trial_end set au signup via /api/profile/init).
--
-- Changements :
--   1. Ajoute la colonne `trial_day3_sent_at` (idempotence cron J-3 warning)
--   2. Ajoute un index partiel pour accélérer le cron trial-expired
--
-- Non-destructif. Aucune perte de données. Rollback possible via :
--   ALTER TABLE profiles DROP COLUMN trial_day3_sent_at;
--   DROP INDEX idx_profiles_trial_pending;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Colonne trial_day3_sent_at (idempotence cron J-3 warning)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_day3_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.trial_day3_sent_at IS
  'Étape B no-CC trial : timestamp de l''envoi du mail J-3 (sendTrialEndingEmail). NULL = pas encore envoyé. Set par /api/cron/trial-day-3-warning, garantit qu''on ne spamme pas l''user si le cron tourne plusieurs fois dans la fenêtre.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Index partiel pour cron trial-expired
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Sans cet index, le cron scan toute la table profiles tous les jours.
-- Avec, il ne touche que les profils en trial actif sans Stripe sub.
-- Coût stockage négligeable (sous-ensemble très petit).

CREATE INDEX IF NOT EXISTS idx_profiles_trial_pending
  ON public.profiles (trial_end)
  WHERE stripe_subscription_id IS NULL AND subscription_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérifications post-migration (à exécuter manuellement après)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
--   AND column_name = 'trial_day3_sent_at';
--
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'profiles'
--   AND indexname = 'idx_profiles_trial_pending';
