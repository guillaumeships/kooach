-- 20260511_trial_day_one.sql
--
-- Ajoute la colonne day_one_sent_at sur profiles pour le cron J+1 trial.
-- Permet d'envoyer un email 24-48h après checkout : "tu as réussi à générer
-- ton 1er post ?" → boost activation + ouvre une conversation 1:1.
--
-- Sans cette colonne, le cron risque de spammer chaque jour (pas d'idempotence).
-- Index partiel (où NULL) pour optimiser le scan quotidien.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS day_one_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_day_one_pending
  ON public.profiles (trial_end)
  WHERE day_one_sent_at IS NULL AND trial_end IS NOT NULL;
