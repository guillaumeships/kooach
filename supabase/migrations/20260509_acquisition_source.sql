-- 20260509_acquisition_source.sql
--
-- Ajoute une colonne `acquisition_source` à `profiles` pour tracker quel
-- canal a converti le user (cold email, blog, lead magnet, Twitter, etc).
--
-- Format de la valeur (compact) :
--   "source=cold|campaign=beta-mai|medium=email|content=batch1"
--
-- Le webhook /api/webhook/route.ts persiste cette valeur depuis
-- session.metadata.acquisition_source (passée par /api/stripe/checkout
-- depuis le cookie kk_utm posé par middleware.ts).
--
-- First-touch wins : on ne remplace pas une source déjà set.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT;

-- Trial end Stripe (calculé au webhook checkout.session.completed = now + 7d).
-- Permet d'afficher un countdown "il te reste X jours" dans /app pour les
-- users Stripe (vs HMAC legacy). Sans ça, le user oublie qu'il est en trial
-- → débit surprise → chargeback.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- Index partiel pour analytics rapides (filter sur les profils avec source)
CREATE INDEX IF NOT EXISTS idx_profiles_acquisition_source
  ON public.profiles (acquisition_source)
  WHERE acquisition_source IS NOT NULL;

-- Index pour requêter "users en trial qui finit bientôt" (futurs reminders)
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end
  ON public.profiles (trial_end)
  WHERE trial_end IS NOT NULL;

COMMENT ON COLUMN public.profiles.acquisition_source IS
  'Premier canal d''acquisition. Format: "source=X|campaign=Y|medium=Z". Set par webhook depuis cookie kk_utm. First-touch wins.';

COMMENT ON COLUMN public.profiles.trial_end IS
  'Date de fin du trial Stripe. Set au webhook checkout completed (now+7d). Permet countdown UI + futurs trial reminder emails.';
