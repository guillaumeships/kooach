-- 20260509_newsletter_subscribers.sql
--
-- Crée la table `newsletter_subscribers` pour la newsletter mensuelle
-- "Kooach Insider" (industrie + tips Insta + chiffres Kooach transparents).
--
-- Format : 1 envoi/mois le 1er, ouverture à tous (pas que les clients Pro).
-- Sert d'audience captive pour futurs lancements de features.
--
-- Pattern RLS lockdown : seul service_role peut lire/écrire (côté server
-- via getSupabase). Aucun accès anon ni authenticated.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  source          TEXT,                                  -- d'où vient l'inscription (ex: "footer", "/newsletter", "popup")
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  ip_hash         TEXT,
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON public.newsletter_subscribers (email)
  WHERE unsubscribed_at IS NULL;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY block_anon_newsletter
  ON public.newsletter_subscribers
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY block_authenticated_newsletter
  ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY service_role_all_newsletter
  ON public.newsletter_subscribers
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscriptions à la newsletter mensuelle Kooach Insider. RLS verrouillée, accès service_role uniquement. UNIQUE sur email pour idempotence.';
