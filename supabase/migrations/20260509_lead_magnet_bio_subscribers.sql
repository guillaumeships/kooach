-- 20260509_lead_magnet_bio_subscribers.sql
--
-- Crée la table `lead_magnet_bio_subscribers` pour le 2e free tool :
-- générateur de bio Instagram coach sportif. Mot-clé SEO cible :
-- "bio instagram coach sportif" (~500/mois FR).
--
-- Pattern identique à `lead_magnet_subscribers` (hooks) — table séparée
-- pour clarté analytique et pour ne pas mélanger 2 schémas (5 bios vs 10
-- hooks). RLS verrouillée : seul service_role peut lire/écrire.

CREATE TABLE IF NOT EXISTS public.lead_magnet_bio_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  niche           TEXT NOT NULL,
  specialty       TEXT NOT NULL,
  city            TEXT,
  goal            TEXT NOT NULL,
  bios            JSONB NOT NULL,
  ip_hash         TEXT NOT NULL,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent_at   TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);

-- Index : rate-limit par IP (lookup sur ip_hash + created_at)
CREATE INDEX IF NOT EXISTS idx_lmbio_ip_hash_created
  ON public.lead_magnet_bio_subscribers (ip_hash, created_at DESC);

-- Index : analytics par email (pour pas double-envoyer si même mail revient)
CREATE INDEX IF NOT EXISTS idx_lmbio_email
  ON public.lead_magnet_bio_subscribers (email);

-- RLS lockdown : table inaccessible aux clients front (anon + auth).
-- Seul service_role (utilisé côté server via getSupabase) peut lire/écrire.
ALTER TABLE public.lead_magnet_bio_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY block_anon_lmbio
  ON public.lead_magnet_bio_subscribers
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY block_authenticated_lmbio
  ON public.lead_magnet_bio_subscribers
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY service_role_all_lmbio
  ON public.lead_magnet_bio_subscribers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.lead_magnet_bio_subscribers IS
  'Captures email du free tool /generateur-bio-instagram-coach-sportif. RLS verrouillée, accès service_role uniquement.';
