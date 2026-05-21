-- 20260521_cold_dm_drafts.sql
--
-- Migration manuelle (à appliquer via Supabase SQL Editor).
--
-- Contexte : storage pour les drafts de cold DM Value-First générés depuis
-- /internal/hooks (founder-only). Permet de revenir voir l'historique des
-- prospects ciblés, marquer le status (envoyé / répondu / converti), garder
-- des notes.
--
-- Table privée founder-only : RLS lockée à service_role.

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cold_dm_drafts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_email      TEXT NOT NULL,
  prospect_handle    TEXT NOT NULL,
  source_posts       JSONB NOT NULL,        -- array de strings (les posts du prospect en input)
  hook_line1         TEXT NOT NULL,
  hook_line2         TEXT NOT NULL,
  full_post          TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | replied | converted | archived
  response_text      TEXT,
  notes              TEXT,
  sent_at            TIMESTAMPTZ,
  replied_at         TIMESTAMPTZ,
  converted_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cold_dm_drafts IS
  'Drafts de cold DM Value-First générés depuis /internal/hooks. Founder-only via service_role.';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drafts_founder_created
  ON public.cold_dm_drafts (founder_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drafts_status
  ON public.cold_dm_drafts (status);

CREATE INDEX IF NOT EXISTS idx_drafts_prospect
  ON public.cold_dm_drafts (prospect_handle);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — service_role uniquement (table privée founder)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.cold_dm_drafts ENABLE ROW LEVEL SECURITY;

-- DROP + CREATE pour rendre la migration idempotente (CREATE POLICY n'a
-- pas de IF NOT EXISTS en Postgres). Permet de réappliquer le fichier sans
-- erreur si une policy existe déjà.
DROP POLICY IF EXISTS "service_role_all" ON public.cold_dm_drafts;
DROP POLICY IF EXISTS "block_anon" ON public.cold_dm_drafts;
DROP POLICY IF EXISTS "block_authenticated" ON public.cold_dm_drafts;

CREATE POLICY "service_role_all" ON public.cold_dm_drafts
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "block_anon" ON public.cold_dm_drafts
  AS RESTRICTIVE FOR ALL
  TO anon
  USING (false);

CREATE POLICY "block_authenticated" ON public.cold_dm_drafts
  AS RESTRICTIVE FOR ALL
  TO authenticated
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérifications post-migration
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'cold_dm_drafts';
--
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'cold_dm_drafts';
--
-- SELECT policyname FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'cold_dm_drafts';
