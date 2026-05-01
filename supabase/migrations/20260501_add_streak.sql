-- Migration : ajout des colonnes streak sur la table profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS streak_count      integer NOT NULL DEFAULT 0;
