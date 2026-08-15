-- Migration: 20260816000000_intelligent_search_indexing.sql
-- Description: Enriched indexing and structured metadata for intelligent search

-- 1. Enable required PostgreSQL extensions (100% free native Supabase)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Add columns to products table if they don't already exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- Ensure useful default columns are present
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS carbon_footprint_kg numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_footprint_liters numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transport_distance_km numeric(8,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS living_wage_guaranteed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_protection boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_cooperative boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegan boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recycled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recycled_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packaging_type text DEFAULT 'recyclable',
  ADD COLUMN IF NOT EXISTS material_composition jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_gender text DEFAULT 'unisex',
  ADD COLUMN IF NOT EXISTS product_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS raw_materials_origin text DEFAULT '',
  ADD COLUMN IF NOT EXISTS manufacturing_country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 85;

-- 3. Create full-text search vector generation function
CREATE OR REPLACE FUNCTION generate_product_search_vector()
RETURNS trigger AS $$
DECLARE
  v_producer_name text := '';
  v_category_name text := '';
  v_tags_text text := '';
  v_cert_text text := '';
BEGIN
  -- Extract producer company name if available
  IF NEW.producer_id IS NOT NULL THEN
    SELECT COALESCE(company_name, '') INTO v_producer_name 
    FROM producer_profiles 
    WHERE id = NEW.producer_id 
    LIMIT 1;
  END IF;

  -- Extract category name if available
  IF NEW.category_id IS NOT NULL THEN
    SELECT COALESCE(name, '') INTO v_category_name 
    FROM categories 
    WHERE id = NEW.category_id 
    LIMIT 1;
  END IF;

  -- Join tags and certifications
  IF NEW.category_tags IS NOT NULL THEN
    v_tags_text := array_to_string(NEW.category_tags, ' ');
  END IF;

  IF NEW.certifications IS NOT NULL THEN
    v_cert_text := array_to_string(NEW.certifications, ' ');
  END IF;

  -- Build tsvector with hierarchical weighting:
  -- A: product name, product_type
  -- B: producer name, category name, certifications, country, manufacturing_country
  -- C: tags, short_description, keywords, raw_materials_origin
  -- D: full description, attributes jsonb
  NEW.search_vector := 
    setweight(to_tsvector('french', unaccent(coalesce(NEW.name, '') || ' ' || coalesce(NEW.product_type, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(v_producer_name, '') || ' ' || coalesce(v_category_name, '') || ' ' || coalesce(NEW.country, '') || ' ' || coalesce(NEW.manufacturing_country, '') || ' ' || v_cert_text)), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.short_description, '') || ' ' || coalesce(NEW.raw_materials_origin, '') || ' ' || v_tags_text || ' ' || array_to_string(NEW.keywords, ' '))), 'C') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.description, '') || ' ' || coalesce(NEW.attributes::text, ''))), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically maintain search_vector on insert/update
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION generate_product_search_vector();

-- 5. Create specialized high-performance indexes
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_product_type_trgm ON products USING GIN(product_type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_country_trgm ON products USING GIN(country gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_certifications ON products USING GIN(certifications);
CREATE INDEX IF NOT EXISTS idx_products_category_tags ON products USING GIN(category_tags);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_confidence_score ON products(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- 6. RPC function for multi-criteria intelligent search
CREATE OR REPLACE FUNCTION search_products_advanced(
  p_query text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_product_types text[] DEFAULT NULL,
  p_materials text[] DEFAULT NULL,
  p_certifications text[] DEFAULT NULL,
  p_countries text[] DEFAULT NULL,
  p_regions text[] DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_max_co2 numeric DEFAULT NULL,
  p_is_vegan boolean DEFAULT NULL,
  p_is_recycled boolean DEFAULT NULL,
  p_living_wage boolean DEFAULT NULL,
  p_is_cooperative boolean DEFAULT NULL,
  p_packaging_types text[] DEFAULT NULL,
  p_min_confidence integer DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_in_stock_only boolean DEFAULT false,
  p_sort_by text DEFAULT 'relevance',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  short_description text,
  emoji text,
  image_url text,
  price numeric,
  price_unit text,
  currency text,
  moq_value integer,
  moq_unit text,
  stock_value integer,
  delivery_days text,
  rating numeric,
  review_count integer,
  product_score integer,
  confidence_score integer,
  country text,
  country_flag text,
  region text,
  manufacturing_country text,
  raw_materials_origin text,
  product_type text,
  target_gender text,
  certifications text[],
  category_tags text[],
  attributes jsonb,
  carbon_footprint_kg numeric,
  water_footprint_liters numeric,
  living_wage_guaranteed boolean,
  is_cooperative boolean,
  is_vegan boolean,
  is_recycled boolean,
  producer_id uuid,
  category_id uuid,
  similarity_score real,
  relevance_rank real
) AS $$
DECLARE
  v_tsquery tsquery;
  v_clean_query text;
BEGIN
  IF p_query IS NOT NULL AND trim(p_query) <> '' THEN
    v_clean_query := trim(p_query);
    -- Convert words into tsquery with prefix matching
    BEGIN
      v_tsquery := to_tsquery('french', unaccent(regexp_replace(v_clean_query, '\s+', ':* & ', 'g') || ':*'));
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := plainto_tsquery('french', unaccent(v_clean_query));
    END;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.emoji,
    p.image_url,
    p.price,
    p.price_unit,
    p.currency,
    p.moq_value,
    p.moq_unit,
    p.stock_value,
    p.delivery_days,
    p.rating,
    p.review_count,
    p.product_score,
    p.confidence_score,
    p.country,
    p.country_flag,
    p.region,
    p.manufacturing_country,
    p.raw_materials_origin,
    p.product_type,
    p.target_gender,
    p.certifications,
    p.category_tags,
    p.attributes,
    p.carbon_footprint_kg,
    p.water_footprint_liters,
    p.living_wage_guaranteed,
    p.is_cooperative,
    p.is_vegan,
    p.is_recycled,
    p.producer_id,
    p.category_id,
    CASE 
      WHEN v_clean_query IS NOT NULL THEN similarity(p.name, v_clean_query)
      ELSE 0.0::real
    END AS similarity_score,
    CASE 
      WHEN v_tsquery IS NOT NULL THEN ts_rank_cd(p.search_vector, v_tsquery)
      ELSE 0.0::real
    END AS relevance_rank
  FROM products p
  WHERE (p.status = 'published' OR p.status IS NULL)
    AND (v_tsquery IS NULL OR p.search_vector @@ v_tsquery OR similarity(p.name, v_clean_query) > 0.15)
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_product_types IS NULL OR p.product_type = ANY(p_product_types) OR p.name ILIKE ANY(SELECT '%' || x || '%' FROM unnest(p_product_types) x))
    AND (p_certifications IS NULL OR p.certifications && p_certifications)
    AND (p_countries IS NULL OR p.country = ANY(p_countries) OR p.manufacturing_country = ANY(p_countries))
    AND (p_gender IS NULL OR p.target_gender = p_gender OR p.target_gender = 'unisex')
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_max_co2 IS NULL OR p.carbon_footprint_kg <= p_max_co2)
    AND (p_is_vegan IS NULL OR p.is_vegan = p_is_vegan)
    AND (p_is_recycled IS NULL OR p.is_recycled = p_is_recycled)
    AND (p_living_wage IS NULL OR p.living_wage_guaranteed = p_living_wage)
    AND (p_is_cooperative IS NULL OR p.is_cooperative = p_is_cooperative)
    AND (p_min_confidence IS NULL OR p.confidence_score >= p_min_confidence)
    AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
    AND (NOT p_in_stock_only OR p.stock_value > 0)
  ORDER BY 
    CASE WHEN p_sort_by = 'price_asc' THEN p.price END ASC,
    CASE WHEN p_sort_by = 'price_desc' THEN p.price END DESC,
    CASE WHEN p_sort_by = 'confidence' THEN p.confidence_score END DESC,
    CASE WHEN p_sort_by = 'carbon' THEN p.carbon_footprint_kg END ASC,
    CASE WHEN p_sort_by = 'rating' THEN p.rating END DESC,
    CASE WHEN p_sort_by = 'newest' THEN p.created_at END DESC,
    -- Default relevance sorting
    (COALESCE(ts_rank_cd(p.search_vector, v_tsquery), 0.0) * 10.0 + COALESCE(similarity(p.name, v_clean_query), 0.0) * 5.0 + (COALESCE(p.confidence_score, 50) / 20.0)) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
