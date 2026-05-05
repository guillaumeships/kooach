-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Lockdown — sécurité tables sensibles
-- ─────────────────────────────────────────────────────────────────────────────
--
-- AUDIT du 2026-05-05 (via MCP Supabase) :
--
--   ✅ profiles    : RLS ON, policies block_anon + block_authenticated +
--                    service_role_all → DÉJÀ OK
--   ✅ generations : RLS ON, mêmes policies → DÉJÀ OK
--   ⚠️ stripe_events : RLS ON mais AUCUNE policy → fonctionne (service_role
--                    bypass RLS par défaut) mais l'advisor flag (INFO).
--                    On ajoute les policies explicites pour matcher le pattern.
--
-- Cette migration n'ajoute QUE les policies manquantes sur stripe_events.
-- À lancer dans Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── stripe_events : ajout des policies pour matcher le pattern des autres tables
DROP POLICY IF EXISTS "block_anon_stripe_events" ON public.stripe_events;
CREATE POLICY "block_anon_stripe_events"
  ON public.stripe_events
  FOR ALL
  TO anon
  USING (false);

DROP POLICY IF EXISTS "block_authenticated_stripe_events" ON public.stripe_events;
CREATE POLICY "block_authenticated_stripe_events"
  ON public.stripe_events
  FOR ALL
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "service_role_all_stripe_events" ON public.stripe_events;
CREATE POLICY "service_role_all_stripe_events"
  ON public.stripe_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérification post-migration (à lancer dans le SQL Editor) :
--
--   SELECT tablename, policyname, roles, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
--
-- Les 3 tables (profiles, generations, stripe_events) doivent chacune avoir
-- 3 policies : block_anon_*, block_authenticated_*, service_role_all_*
-- ─────────────────────────────────────────────────────────────────────────────
