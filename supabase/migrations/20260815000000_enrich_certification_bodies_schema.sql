-- ============================================================================
-- Migration: Enrichissement de la table certification_bodies
-- Nettoyage des champs API obsolètes, ajout des colonnes géographiques, 
-- coordonnées, domaines, accréditations et contrainte d'unicité.
-- ============================================================================

-- 1. Supprimer les doublons éventuels existants basés sur (name, country)
DELETE FROM certification_bodies
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)), LOWER(TRIM(country)) 
      ORDER BY created_at ASC
    ) as row_num
    FROM certification_bodies
  ) t
  WHERE t.row_num > 1
);

-- 2. Supprimer les colonnes liées aux APIs
ALTER TABLE certification_bodies 
  DROP COLUMN IF EXISTS api_endpoint,
  DROP COLUMN IF EXISTS api_key_required,
  DROP COLUMN IF EXISTS api_key_encrypted;

-- 3. Ajouter les colonnes d'enrichissement
ALTER TABLE certification_bodies
  ADD COLUMN IF NOT EXISTS acronym TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS foundation_year INTEGER,
  ADD COLUMN IF NOT EXISTS employee_count TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS accreditations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_networks JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_hours TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS average_cost TEXT,
  ADD COLUMN IF NOT EXISTS average_duration TEXT,
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS verification_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;

-- 4. Contrainte d'unicité pour éviter les futurs doublons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_certification_bodies_name_country'
  ) THEN
    ALTER TABLE certification_bodies 
      ADD CONSTRAINT uq_certification_bodies_name_country UNIQUE (name, country);
  END IF;
END $$;

-- 5. Index pour les filtres rapides de recherche et de cartographie
CREATE INDEX IF NOT EXISTS idx_cert_bodies_country ON certification_bodies(country);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_region ON certification_bodies(region);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_trust ON certification_bodies(trust_level);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_domains ON certification_bodies USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_accreditations ON certification_bodies USING GIN(accreditations);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_coords ON certification_bodies(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
