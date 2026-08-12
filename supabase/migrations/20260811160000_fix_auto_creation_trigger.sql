/*
# Fix producer auto-creation trigger & ensure unique constraints

1. Ensure unique constraint on producers(user_id) for reliable upserts
2. Update handle_new_user() trigger with SECURITY DEFINER and robust slug/producer generation
3. Backfill any existing producer accounts missing profile or producer record
*/

-- ── 1. Ensure unique constraint on producers.user_id ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'producers_user_id_key'
  ) THEN
    -- In case duplicate user_ids exist, keep latest created_at
    DELETE FROM public.producers p1
    USING public.producers p2
    WHERE p1.user_id = p2.user_id
      AND p1.user_id IS NOT NULL
      AND p1.created_at < p2.created_at;

    ALTER TABLE public.producers ADD CONSTRAINT producers_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ── 2. Create or replace trigger function ──
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
  v_phone text;
  v_full_name text;
  v_base_slug text;
  v_slug text;
  v_initials text;
  v_color text;
  v_flag text;
  v_colors text[] := ARRAY['#15803d','#92400e','#b45309','#7c2d12','#451a03','#0369a1','#0f766e','#6d28d9'];
  v_counter integer := 0;
  v_slug_exists boolean;
BEGIN
  v_user_id := NEW.id;
  v_email := NEW.email;
  
  -- Extract metadata cleanly
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_role       := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
  v_country    := COALESCE(NEW.raw_user_meta_data->>'country', 'France');
  v_phone      := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
  
  -- Build full_name
  v_full_name := trim(v_first_name || ' ' || v_last_name);
  IF v_full_name = '' THEN
    v_full_name := split_part(v_email, '@', 1);
  END IF;

  -- 1. Create or update profile
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role, country, phone)
  VALUES (v_user_id, v_email, v_full_name, v_first_name, v_last_name, v_role, v_country, v_phone)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    role = EXCLUDED.role,
    country = COALESCE(EXCLUDED.country, profiles.country),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  -- 2. If role is producer, create producer record if not exists
  IF v_role = 'producer' THEN
    IF NOT EXISTS (SELECT 1 FROM public.producers WHERE user_id = v_user_id) THEN
      v_base_slug := lower(regexp_replace(v_full_name, '[^a-zA-Z0-9]+', '-', 'g'));
      v_base_slug := trim(both '-' from v_base_slug);
      IF v_base_slug = '' THEN
        v_base_slug := 'producteur';
      END IF;
      
      v_slug := v_base_slug || '-' || substring(replace(v_user_id::text, '-', ''), 1, 8);
      
      -- Loop to prevent slug collision
      LOOP
        SELECT EXISTS (SELECT 1 FROM public.producers WHERE slug = v_slug) INTO v_slug_exists;
        EXIT WHEN NOT v_slug_exists OR v_counter > 10;
        v_counter := v_counter + 1;
        v_slug := v_base_slug || '-' || substring(replace(v_user_id::text, '-', ''), 1, 8) || '-' || v_counter;
      END LOOP;

      v_initials := upper(substring(v_first_name FROM 1 FOR 1) || substring(v_last_name FROM 1 FOR 1));
      IF v_initials = '' THEN
        v_initials := upper(substring(v_email FROM 1 FOR 2));
      END IF;

      v_color := v_colors[1 + (abs(hashtext(v_user_id::text)) % array_length(v_colors, 1))];

      SELECT flag INTO v_flag FROM (
        SELECT 'France' AS name, '🇫🇷' AS flag UNION ALL
        SELECT 'Belgique', '🇧🇪' UNION ALL
        SELECT 'Suisse', '🇨🇭' UNION ALL
        SELECT 'Canada', '🇨🇦' UNION ALL
        SELECT 'Maroc', '🇲🇦' UNION ALL
        SELECT 'Éthiopie', '🇪🇹' UNION ALL
        SELECT 'Madagascar', '🇲🇬' UNION ALL
        SELECT 'Pérou', '🇵🇪' UNION ALL
        SELECT 'Ghana', '🇬🇭' UNION ALL
        SELECT 'Côte d''Ivoire', '🇨🇮' UNION ALL
        SELECT 'Sénégal', '🇸🇳' UNION ALL
        SELECT 'Cameroun', '🇨🇲' UNION ALL
        SELECT 'Tunisie', '🇹🇳' UNION ALL
        SELECT 'Algérie', '🇩🇿'
      ) flags WHERE flags.name = v_country;
      IF v_flag IS NULL THEN v_flag := '🌍'; END IF;

      INSERT INTO public.producers (
        user_id, name, slug, country, country_flag,
        avatar_initials, avatar_color, banner_color,
        phone, verified, top_seller,
        rating, review_count, product_count, order_count,
        satisfaction_rate, response_time, certifications,
        profile_completion
      ) VALUES (
        v_user_id, v_full_name, v_slug, v_country, v_flag,
        v_initials, v_color, v_color,
        v_phone, false, false,
        0, 0, 0, 0,
        100, '24h', '{}',
        10
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user trigger error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ── 3. Bind Trigger ──
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Backfill existing producer users ──
DO $$
DECLARE
  r RECORD;
  v_slug text;
  v_initials text;
  v_color text;
  v_colors text[] := ARRAY['#15803d','#92400e','#b45309','#7c2d12','#451a03','#0369a1','#0f766e','#6d28d9'];
BEGIN
  FOR r IN
    SELECT p.id, p.email, p.full_name, p.country, p.phone
    FROM public.profiles p
    LEFT JOIN public.producers pr ON pr.user_id = p.id
    WHERE p.role = 'producer' AND pr.id IS NULL
  LOOP
    v_slug := lower(regexp_replace(COALESCE(r.full_name, split_part(r.email, '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(replace(r.id::text, '-', ''), 1, 8);
    v_initials := upper(substring(COALESCE(r.full_name, r.email) FROM 1 FOR 2));
    v_color := v_colors[1 + (abs(hashtext(r.id::text)) % array_length(v_colors, 1))];

    INSERT INTO public.producers (
      user_id, name, slug, country, country_flag,
      avatar_initials, avatar_color, banner_color,
      phone, verified, top_seller,
      rating, review_count, product_count, order_count,
      satisfaction_rate, response_time, certifications,
      profile_completion
    ) VALUES (
      r.id, COALESCE(r.full_name, split_part(r.email, '@', 1)), v_slug, COALESCE(r.country, 'France'), '🌍',
      v_initials, v_color, v_color,
      r.phone, false, false,
      0, 0, 0, 0,
      100, '24h', '{}',
      10
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;
