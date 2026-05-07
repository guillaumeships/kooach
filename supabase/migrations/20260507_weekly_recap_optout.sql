-- ─────────────────────────────────────────────────────────────────────────────
-- Weekly recap email — opt-out flag
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Permet aux utilisateurs de se désabonner de l'email récap hebdomadaire
-- envoyé chaque dimanche soir (cron Vercel /api/cron/weekly-recap).
--
-- Pattern : opt-out (vs opt-in) — par défaut tous les users actifs reçoivent
-- l'email, ils peuvent se désabonner via le lien dans le footer.
--
-- À LANCER manuellement dans Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_recap_optout BOOLEAN NOT NULL DEFAULT false;

-- Index pour le scan cron (rapide quand on filtre les non-optout)
CREATE INDEX IF NOT EXISTS profiles_weekly_recap_idx
  ON public.profiles (weekly_recap_optout)
  WHERE weekly_recap_optout = false;

COMMENT ON COLUMN public.profiles.weekly_recap_optout IS
  'Si true, l''utilisateur ne reçoit pas l''email récap hebdomadaire (cron dim 19h).';
