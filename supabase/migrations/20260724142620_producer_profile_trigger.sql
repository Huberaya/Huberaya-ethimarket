/*
# Producer profile columns + auto-create trigger

1. Schema changes (producers table)
- org_type: type d'organisation (producteur/coopérative/association/entreprise/artisan)
- registration_number: SIRET, RC, etc.
- city: ville
- address: adresse complète
- postal_code: code postal
- latitude: coordonnée GPS lat
- longitude: coordonnée GPS lng
- product_types: array of product categories
- surface_value + surface_unit: surface cultivée
- annual_capacity: capacité de production annuelle
- farming_methods: array (biologique, permaculture, etc.)
- seasonality: array of months
- delivery_countries: array of countries
- transport_modes: array (route, maritime, etc.)
- delivery_days_avg: délai moyen de livraison
- packaging_types: array (biodégradable, recyclable, etc.)
- has_insurance: boolean
- min_wage: salaire minimum garanti
- working_conditions: textarea
- co2_saved, water_saved, trees_preserved: impact environnemental
- social_actions: textarea
- ethical_score: auto-calculé
- whatsapp, linkedin, facebook, instagram, youtube, languages_spoken: contact + réseaux
- farm_photos, team_photos: arrays of image URLs
- video_url: URL vidéo
- profile_complete: boolean (statut profil complété)

2. Trigger: auto-create producer on signup
- Function handle_new_producer() runs after auth.users insert
- Creates a producers row with user_id, name from metadata, country, slug, etc.
- Also creates a profiles row

3. Security
- Trigger runs as SECURITY DEFINER to insert into producers/profiles
- RLS already in place from previous migration
*/

-- ─── New columns on producers ───────────────────────────
ALTER TABLE producers ADD COLUMN IF NOT EXISTS org_type text DEFAULT 'producteur';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS product_types text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS surface_value numeric;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS surface_unit text DEFAULT 'hectares';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS annual_capacity text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS farming_methods text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS seasonality text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS delivery_countries text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS transport_modes text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS delivery_days_avg integer;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS packaging_types text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS has_insurance boolean DEFAULT false;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS min_wage text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS working_conditions text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS co2_saved text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS water_saved text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS trees_preserved text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS social_actions text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ethical_score integer DEFAULT 0;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS facebook text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS youtube text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS farm_photos text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS team_photos text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS profile_status text DEFAULT 'incomplete' CHECK (profile_status IN ('incomplete', 'pending', 'verified', 'rejected'));

-- ─── New columns on products for traceability ──────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS planting_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS farming_method text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gps_coordinates text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS co2_estimate text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS trace_qr_code text;

-- ─── Certifications detail table ────────────────────────
CREATE TABLE IF NOT EXISTS producer_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
  cert_type text NOT NULL,
  cert_number text,
  issue_date date,
  expiry_date date,
  cert_body text,
  document_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE producer_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certs" ON producer_certifications;
CREATE POLICY "select_own_certs" ON producer_certifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_certs" ON producer_certifications;
CREATE POLICY "insert_own_certs" ON producer_certifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM producers WHERE producers.id = producer_certifications.producer_id AND producers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_certs" ON producer_certifications;
CREATE POLICY "update_own_certs" ON producer_certifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM producers WHERE producers.id = producer_certifications.producer_id AND producers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_certs" ON producer_certifications;
CREATE POLICY "delete_own_certs" ON producer_certifications FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM producers WHERE producers.id = producer_certifications.producer_id AND producers.user_id = auth.uid())
  );

-- ─── Auto-create producer + profile on signup ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_first_name text;
  v_last_name text;
  v_role text;
  v_country text;
  v_full_name text;
  v_slug text;
  v_initials text;
  v_color text;
  v_flag text;
  v_colors text[] := ARRAY['#15803d','#92400e','#b45309','#7c2d12','#451a03','#0369a1','#0f766e','#6d28d9'];
BEGIN
  v_user_id := NEW.id;
  v_email := NEW.email;
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'France');
  v_full_name := trim(v_first_name || ' ' || v_last_name);
  IF v_full_name = '' THEN
    v_full_name := split_part(v_email, '@', 1);
  END IF;
  v_slug := lower(regexp_replace(regexp_replace(v_full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  v_slug := v_slug || '-' || substring(v_user_id::text, 1, 4);
  v_initials := upper(substring(v_first_name FROM 1 FOR 1) || substring(v_last_name FROM 1 FOR 1));
  IF v_initials = '' THEN
    v_initials := upper(substring(v_email FROM 1 FOR 2));
  END IF;
  v_color := v_colors[1 + (abs(hashtext(v_user_id::text)) % array_length(v_colors, 1))];

  -- Flag lookup
  SELECT flag INTO v_flag FROM (
    SELECT 'France' AS name, '🇫🇷' AS flag UNION ALL
    SELECT 'Belgique', '🇧🇪' UNION ALL
    SELECT 'Suisse', '🇨🇭' UNION ALL
    SELECT 'Canada', '🇨🇦' UNION ALL
    SELECT 'Maroc', '🇲🇦' UNION ALL
    SELECT 'Éthiopie', '🇪🇹' UNION ALL
    SELECT 'Iran', '🇮🇷' UNION ALL
    SELECT 'Madagascar', '🇲🇬' UNION ALL
    SELECT 'Pérou', '🇵🇪' UNION ALL
    SELECT 'Ghana', '🇬🇭' UNION ALL
    SELECT 'Grèce', '🇬🇷' UNION ALL
    SELECT 'Japon', '🇯🇵' UNION ALL
    SELECT 'Sri Lanka', '🇱🇰' UNION ALL
    SELECT 'Inde', '🇮🇳' UNION ALL
    SELECT 'Mexique', '🇲🇽' UNION ALL
    SELECT 'Brésil', '🇧🇷' UNION ALL
    SELECT 'Vietnam', '🇻🇳' UNION ALL
    SELECT 'Thaïlande', '🇹🇭' UNION ALL
    SELECT 'Tunisie', '🇹🇳' UNION ALL
    SELECT 'Sénégal', '🇸🇳' UNION ALL
    SELECT 'Algérie', '🇩🇿' UNION ALL
    SELECT 'Allemagne', '🇩🇪' UNION ALL
    SELECT 'Espagne', '🇪🇸' UNION ALL
    SELECT 'Italie', '🇮🇹' UNION ALL
    SELECT 'Portugal', '🇵🇹' UNION ALL
    SELECT 'Royaume-Uni', '🇬🇧' UNION ALL
    SELECT 'Chine', '🇨🇳' UNION ALL
    SELECT 'Indonésie', '🇮🇩'
  ) flags WHERE flags.name = v_country;
  IF v_flag IS NULL THEN v_flag := '🌍'; END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, v_email, v_full_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  -- Insert producer if role is producer
  IF v_role = 'producer' THEN
    INSERT INTO public.producers (
      user_id, name, slug, country, country_flag,
      avatar_initials, avatar_color, banner_color,
      description, verified, top_seller,
      rating, review_count, product_count, order_count,
      satisfaction_rate, response_time, certifications,
      profile_status
    ) VALUES (
      v_user_id, v_full_name, v_slug, v_country, v_flag,
      v_initials, v_color, v_color,
      NULL, false, false,
      0, 0, 0, 0,
      100, '24h', '{}',
      'incomplete'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, create new
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
