/*
# EthiMarket scoring system

## Purpose
Every producer and product gets a score out of 100 that reflects reliability
and quality. Buyers see the score at a glance via badges (Bronze / Silver /
Gold). The score is computed automatically from verifications, certifications,
lab analyses, ethical commitments, ratings, and penalties.

## 1. New columns on `producers`
- `ethimarket_score` (int, 0-100, default 0) — the headline score
- `badge_level` (text, nullable) — 'bronze' | 'silver' | 'gold' | null
- `last_score_update` (timestamptz) — when the score was last recomputed
- `score_details` (jsonb) — per-category breakdown of the score

## 2. New columns on `products`
- `product_score` (int, 0-100, default 0)
- `score_calculation` (jsonb) — breakdown of the product score

## 3. New table `score_penalties`
Tracks negative events that lower a producer's score:
- `id` (uuid PK)
- `producer_id` (uuid FK producers.id ON DELETE CASCADE)
- `penalty_type` (text) — 'expired_cert' | 'complaint' | 'dispute' | 'fake_doc'
- `points` (int) — negative value to subtract (e.g. -10, -5, -20, -50)
- `description` (text)
- `resolved_at` (timestamptz, nullable) — when null, penalty still active
- `created_by` (uuid, nullable) — admin who recorded it
- `created_at` (timestamptz)

Penalty weights (per spec):
- Certificat expire : -10
- Réclamation acheteur : -5
- Litige non résolu : -20
- Faux document détecté : -50 (+ suspension handled separately)

## 4. Scoring functions

### `calculate_producer_score(p_producer_id uuid)`
Returns jsonb with the full breakdown:
- certifications (max 40): bio verified 15, fairtrade 10, others +2 each (max 10),
  lab analyses up to date 5
- traceability (max 25): GPS 10, photos exploitation min 5 = 5, history 3
  years = 5, video presentation 5
- ethics (max 20): charter signed 5, salaries documented 10, social report 5
- environment (max 10): carbon footprint 5, sustainable actions 5
- satisfaction (max 5): rating >= 4.5 = 5, 4.0-4.4 = 3, < 4.0 = 0
- penalties: sum of active (unresolved) penalties
- total: clamped 0-100
- badge: gold (90+), silver (75-89), bronze (60-74), null (<60)

### `calculate_product_score(p_product_id uuid)`
Product score = producer score (70%) + product-specific signals (30%):
- product has GPS coordinates: 10
- product has harvest/planting dates: 10
- product has certifications: 10
Returns jsonb breakdown.

### `recalculate_producer_score(p_producer_id uuid)`
Computes and UPDATEs the producers row in place. SECURITY DEFINER so it can
run from triggers regardless of caller role.

### `recalculate_product_score(p_product_id uuid)`
Computes and UPDATEs the products row in place.

### `recalculate_all_scores()`
Loops over all producers and products, recomputing every score. Used by the
weekly cron edge function.

## 5. Triggers
- After INSERT on `reviews` → recalculate the producer's score (rating changes)
- After INSERT/UPDATE on `verification_certifications` → recalculate producer
- After INSERT on `score_penalties` → recalculate producer
- After UPDATE on `verification_ethical_commitments` → recalculate producer

## 6. Security
- `score_penalties`: RLS enabled. SELECT public (so buyers see why a score is
  lowered), INSERT/UPDATE/DELETE authenticated-only (admins manage penalties).
- No new RLS needed on producers/products (already public read).
*/

-- ── Columns on producers ──
ALTER TABLE producers
  ADD COLUMN IF NOT EXISTS ethimarket_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_level text,
  ADD COLUMN IF NOT EXISTS last_score_update timestamptz,
  ADD COLUMN IF NOT EXISTS score_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Columns on products ──
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_calculation jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── score_penalties table ──
CREATE TABLE IF NOT EXISTS score_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  penalty_type text NOT NULL CHECK (penalty_type IN ('expired_cert','complaint','dispute','fake_doc')),
  points int NOT NULL,
  description text NOT NULL DEFAULT '',
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE score_penalties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_penalties" ON score_penalties;
CREATE POLICY "public_read_penalties" ON score_penalties FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_penalties" ON score_penalties;
CREATE POLICY "auth_insert_penalties" ON score_penalties FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_penalties" ON score_penalties;
CREATE POLICY "auth_update_penalties" ON score_penalties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_penalties" ON score_penalties;
CREATE POLICY "auth_delete_penalties" ON score_penalties FOR DELETE
  TO authenticated USING (true);

-- ── Index for fast producer lookups ──
CREATE INDEX IF NOT EXISTS idx_score_penalties_producer ON score_penalties(producer_id) WHERE resolved_at IS NULL;

-- ════════════════════════════════════════════════
-- SCORING FUNCTIONS
-- ════════════════════════════════════════════════

-- Calculate producer score breakdown (pure function, returns jsonb)
CREATE OR REPLACE FUNCTION calculate_producer_score(p_producer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_certifications text[];
  v_rating numeric;
  v_review_count int;
  v_founded_year int;
  v_created_at timestamptz;
  v_has_bio boolean := false;
  v_has_fairtrade boolean := false;
  v_other_certs int := 0;
  v_cert_score int := 0;
  v_lab_score int := 0;
  v_gps_score int := 0;
  v_photos_score int := 0;
  v_history_score int := 0;
  v_video_score int := 0;
  v_charter_score int := 0;
  v_wage_score int := 0;
  v_social_score int := 0;
  v_carbon_score int := 0;
  v_sustain_score int := 0;
  v_sat_score int := 0;
  v_penalty_total int := 0;
  v_total int := 0;
  v_badge text;
  v_lab_count int := 0;
  v_doc_count int := 0;
  v_has_gps boolean := false;
  v_has_charter boolean := false;
  v_has_wage boolean := false;
  v_has_carbon boolean := false;
  v_has_policy boolean := false;
  v_video_url text;
BEGIN
  -- Gather producer base data
  SELECT p.certifications, p.rating, p.review_count, p.founded_year, p.created_at
  INTO v_certifications, v_rating, v_review_count, v_founded_year, v_created_at
  FROM producers p WHERE p.id = p_producer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'producer not found');
  END IF;

  -- ── CERTIFICATIONS (40 pts) ──
  -- Use approved verification_certifications if available, else fall back to producers.certifications
  SELECT COALESCE(array_agg(DISTINCT vc.cert_type), '{}')
  INTO v_certifications
  FROM verification_certifications vc
  JOIN producer_verifications pv ON pv.id = vc.verification_id
  WHERE pv.producer_id = p_producer_id AND vc.status = 'approved';

  -- If no approved certs in verification, fall back to producers.certifications
  IF array_length(v_certifications, 1) IS NULL THEN
    SELECT certifications INTO v_certifications FROM producers WHERE id = p_producer_id;
  END IF;

  v_has_bio := v_certifications @> ARRAY['Bio'] OR v_certifications @> ARRAY['AB'] OR v_certifications @> ARRAY['Ecocert'];
  v_has_fairtrade := v_certifications @> ARRAY['Fairtrade'];
  v_other_certs := GREATEST(array_length(v_certifications, 1) - 2, 0);
  v_cert_score := (CASE WHEN v_has_bio THEN 15 ELSE 0 END)
                + (CASE WHEN v_has_fairtrade THEN 10 ELSE 0 END)
                + LEAST(v_other_certs * 2, 10);

  -- Lab analyses up to date (5 pts): at least one lab analysis in last 12 months
  SELECT count(*) INTO v_lab_count
  FROM verification_lab_analyses vla
  JOIN producer_verifications pv ON pv.id = vla.verification_id
  WHERE pv.producer_id = p_producer_id
    AND vla.analysis_date >= (CURRENT_DATE - INTERVAL '12 months');
  v_lab_score := CASE WHEN v_lab_count > 0 THEN 5 ELSE 0 END;

  -- ── TRAÇABILITÉ (25 pts) ──
  -- GPS: any product with gps_coordinates, or verification section 2 approved
  SELECT bool_or(p.gps_coordinates IS NOT NULL AND p.gps_coordinates <> '')
  INTO v_has_gps
  FROM products p WHERE p.producer_id = p_producer_id;
  IF v_has_gps IS NULL THEN v_has_gps := false; END IF;
  v_gps_score := CASE WHEN v_has_gps THEN 10 ELSE 0 END;

  -- Photos exploitation (min 5 docs in section 2): 5 pts
  SELECT count(*) INTO v_doc_count
  FROM verification_documents vd
  JOIN producer_verifications pv ON pv.id = vd.verification_id
  WHERE pv.producer_id = p_producer_id AND vd.section = 2;
  v_photos_score := CASE WHEN v_doc_count >= 5 THEN 5 ELSE 0 END;

  -- History 3 years: founded_year or created_at >= 3 years ago
  v_history_score := CASE
    WHEN v_founded_year IS NOT NULL AND v_founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)::int - 3 THEN 5
    WHEN v_created_at <= CURRENT_DATE - INTERVAL '3 years' THEN 5
    ELSE 0
  END;

  -- Video presentation: check if any verification doc in section 2 is a video type
  -- (stored as doc_type = 'video'); 5 pts
  SELECT count(*) INTO v_video_score
  FROM verification_documents vd
  JOIN producer_verifications pv ON pv.id = vd.verification_id
  WHERE pv.producer_id = p_producer_id AND vd.doc_type = 'video';
  v_video_score := CASE WHEN v_video_score > 0 THEN 5 ELSE 0 END;

  -- ── ÉTHIQUE (20 pts) ──
  SELECT
    COALESCE(ec.charter_signature, '') <> '',
    COALESCE(ec.min_wage, '') <> '',
    COALESCE(ec.community_actions, '') <> ''
  INTO v_has_charter, v_has_wage, v_has_policy
  FROM verification_ethical_commitments ec
  JOIN producer_verifications pv ON pv.id = ec.verification_id
  WHERE pv.producer_id = p_producer_id
  LIMIT 1;

  v_charter_score := CASE WHEN v_has_charter THEN 5 ELSE 0 END;
  v_wage_score := CASE WHEN v_has_wage THEN 10 ELSE 0 END;
  -- Social report: community_actions present acts as proxy
  v_social_score := CASE WHEN v_has_policy THEN 5 ELSE 0 END;

  -- ── ENVIRONNEMENT (10 pts) ──
  SELECT
    COALESCE(ec.co2_estimate, '') <> '',
    COALESCE(ec.environment_policy, '') <> ''
  INTO v_has_carbon, v_has_policy
  FROM verification_ethical_commitments ec
  JOIN producer_verifications pv ON pv.id = ec.verification_id
  WHERE pv.producer_id = p_producer_id
  LIMIT 1;

  v_carbon_score := CASE WHEN v_has_carbon THEN 5 ELSE 0 END;
  v_sustain_score := CASE WHEN v_has_policy THEN 5 ELSE 0 END;

  -- ── SATISFACTION (5 pts) ──
  v_sat_score := CASE
    WHEN v_rating >= 4.5 THEN 5
    WHEN v_rating >= 4.0 THEN 3
    ELSE 0
  END;

  -- ── PENALTIES ──
  SELECT COALESCE(sum(points), 0) INTO v_penalty_total
  FROM score_penalties
  WHERE producer_id = p_producer_id AND resolved_at IS NULL;

  -- ── TOTAL ──
  v_total := v_cert_score + v_lab_score
           + v_gps_score + v_photos_score + v_history_score + v_video_score
           + v_charter_score + v_wage_score + v_social_score
           + v_carbon_score + v_sustain_score
           + v_sat_score
           + v_penalty_total;
  v_total := GREATEST(0, LEAST(100, v_total));

  v_badge := CASE
    WHEN v_total >= 90 THEN 'gold'
    WHEN v_total >= 75 THEN 'silver'
    WHEN v_total >= 60 THEN 'bronze'
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'total', v_total,
    'badge', v_badge,
    'categories', jsonb_build_object(
      'certifications', jsonb_build_object('score', v_cert_score + v_lab_score, 'max', 40,
        'bio', v_has_bio, 'fairtrade', v_has_fairtrade, 'other_certs', v_other_certs, 'lab_up_to_date', v_lab_score > 0),
      'traceability', jsonb_build_object('score', v_gps_score + v_photos_score + v_history_score + v_video_score, 'max', 25,
        'gps', v_gps_score > 0, 'photos', v_photos_score > 0, 'history', v_history_score > 0, 'video', v_video_score > 0),
      'ethics', jsonb_build_object('score', v_charter_score + v_wage_score + v_social_score, 'max', 20,
        'charter', v_charter_score > 0, 'wages', v_wage_score > 0, 'social_report', v_social_score > 0),
      'environment', jsonb_build_object('score', v_carbon_score + v_sustain_score, 'max', 10,
        'carbon', v_carbon_score > 0, 'sustainable', v_sustain_score > 0),
      'satisfaction', jsonb_build_object('score', v_sat_score, 'max', 5, 'rating', v_rating)
    ),
    'penalties', jsonb_build_object('total', v_penalty_total)
  );
END $$;

-- Recalculate and persist producer score (SECURITY DEFINER for trigger use)
CREATE OR REPLACE FUNCTION recalculate_producer_score(p_producer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT calculate_producer_score(p_producer_id) INTO v_result;
  IF v_result ? 'error' THEN RETURN; END IF;

  UPDATE producers
  SET ethimarket_score = (v_result->>'total')::int,
      badge_level = v_result->>'badge',
      score_details = v_result,
      last_score_update = now()
  WHERE id = p_producer_id;

  -- Also recalculate all products for this producer
  PERFORM recalculate_product_score(p.id)
  FROM products p WHERE p.producer_id = p_producer_id;
END $$;

-- Calculate product score breakdown
CREATE OR REPLACE FUNCTION calculate_product_score(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_producer_score int := 0;
  v_gps_score int := 0;
  v_dates_score int := 0;
  v_cert_score int := 0;
  v_product_specific int := 0;
  v_total int := 0;
  v_badge text;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'product not found'); END IF;

  -- Producer score (base)
  SELECT COALESCE(p.ethimarket_score, 0) INTO v_producer_score
  FROM producers p WHERE p.id = v_product.producer_id;

  -- Product-specific signals (30 pts max)
  v_gps_score := CASE WHEN v_product.gps_coordinates IS NOT NULL AND v_product.gps_coordinates <> '' THEN 10 ELSE 0 END;
  v_dates_score := CASE
    WHEN v_product.planting_date IS NOT NULL AND v_product.harvest_date IS NOT NULL THEN 10
    WHEN v_product.harvest_date IS NOT NULL THEN 5
    ELSE 0
  END;
  v_cert_score := CASE WHEN array_length(v_product.certifications, 1) IS NOT NULL THEN LEAST(array_length(v_product.certifications, 1) * 5, 10) ELSE 0 END;
  v_product_specific := v_gps_score + v_dates_score + v_cert_score;

  -- Total: producer score (70%) + product specific (30%)
  v_total := ROUND((v_producer_score * 0.70) + (v_product_specific * 3.33));
  v_total := GREATEST(0, LEAST(100, v_total));

  v_badge := CASE
    WHEN v_total >= 90 THEN 'gold'
    WHEN v_total >= 75 THEN 'silver'
    WHEN v_total >= 60 THEN 'bronze'
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'total', v_total,
    'badge', v_badge,
    'producer_score', v_producer_score,
    'product_specific', jsonb_build_object(
      'score', v_product_specific, 'max', 30,
      'gps', v_gps_score > 0, 'dates', v_dates_score > 0, 'certs', v_cert_score > 0
    )
  );
END $$;

-- Recalculate and persist product score
CREATE OR REPLACE FUNCTION recalculate_product_score(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT calculate_product_score(p_product_id) INTO v_result;
  IF v_result ? 'error' THEN RETURN; END IF;

  UPDATE products
  SET product_score = (v_result->>'total')::int,
      score_calculation = v_result
  WHERE id = p_product_id;
END $$;

-- Recalculate all scores (used by weekly cron)
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM recalculate_producer_score(p.id) FROM producers p;
END $$;

-- ════════════════════════════════════════════════
-- TRIGGERS for automatic recalculation
-- ════════════════════════════════════════════════

-- After new review → recalculate producer score
CREATE OR REPLACE FUNCTION trg_fn_review_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_producer_id uuid;
BEGIN
  SELECT producer_id INTO v_producer_id FROM products WHERE id = NEW.product_id;
  IF v_producer_id IS NOT NULL THEN
    PERFORM recalculate_producer_score(v_producer_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_review_insert ON reviews;
CREATE TRIGGER trg_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION trg_fn_review_insert();

-- After certification change → recalculate producer score
CREATE OR REPLACE FUNCTION trg_fn_cert_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_producer_id uuid;
BEGIN
  SELECT producer_id INTO v_producer_id
  FROM producer_verifications WHERE id = COALESCE(NEW.verification_id, OLD.verification_id);
  IF v_producer_id IS NOT NULL THEN
    PERFORM recalculate_producer_score(v_producer_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cert_insert ON verification_certifications;
CREATE TRIGGER trg_cert_insert
  AFTER INSERT OR UPDATE ON verification_certifications
  FOR EACH ROW EXECUTE FUNCTION trg_fn_cert_change();

-- After penalty inserted → recalculate producer score
CREATE OR REPLACE FUNCTION trg_fn_penalty_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM recalculate_producer_score(COALESCE(NEW.producer_id, OLD.producer_id));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_penalty_insert ON score_penalties;
CREATE TRIGGER trg_penalty_insert
  AFTER INSERT OR UPDATE OR DELETE ON score_penalties
  FOR EACH ROW EXECUTE FUNCTION trg_fn_penalty_change();

-- After ethical commitment update → recalculate producer score
CREATE OR REPLACE FUNCTION trg_fn_ethical_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_producer_id uuid;
BEGIN
  SELECT producer_id INTO v_producer_id
  FROM producer_verifications WHERE id = COALESCE(NEW.verification_id, OLD.verification_id);
  IF v_producer_id IS NOT NULL THEN
    PERFORM recalculate_producer_score(v_producer_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ethical_update ON verification_ethical_commitments;
CREATE TRIGGER trg_ethical_update
  AFTER INSERT OR UPDATE ON verification_ethical_commitments
  FOR EACH ROW EXECUTE FUNCTION trg_fn_ethical_change();

-- ── Initial calculation for existing data ──
SELECT recalculate_all_scores();
