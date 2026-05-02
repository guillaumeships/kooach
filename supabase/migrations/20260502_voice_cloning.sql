-- ─────────────────────────────────────────────────────────────────────────────
-- Voice Cloning : sauvegarde des anciens posts du coach pour calibrer l'IA
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Avant cette migration : les "Tes anciens posts" étaient en localStorage
-- uniquement → perdus si l'user changeait de device ou vidait son cache.
--
-- Maintenant : sauvegardés en DB et rechargés à chaque connexion. L'IA
-- s'aligne systématiquement sur le style écrit du coach.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS example_posts text;
