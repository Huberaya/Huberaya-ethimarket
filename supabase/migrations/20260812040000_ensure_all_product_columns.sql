-- ════════════════════════════════════════════════════════════════
-- EthiMarket — Guarantee all products columns exist
-- ════════════════════════════════════════════════════════════════

ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS planting_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS farming_method text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gps_coordinates text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS co2_estimate text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS trace_qr_code text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_score int DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_calculation jsonb DEFAULT '{}'::jsonb;
