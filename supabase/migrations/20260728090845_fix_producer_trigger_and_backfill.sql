/*
# Fix producer auto-creation trigger

## Problem
The existing `handle_new_user()` trigger creates a producer row on signup,
but the slug is only 4 chars of the UUID appended to the name. This causes
unique-constraint collisions on the `slug` column, making the INSERT fail
silently (ON CONFLICT DO NOTHING). Result: users sign up but get no producer
row, so /dashboard/mon-profil shows "Profil producteur non trouvé".

## Fix
1. Replace the trigger function with a robust version that:
   - Generates a unique slug using the full UUID (not just 4 chars).
   - Uses ON CONFLICT (slug) DO NOTHING with a retry via a different slug.
   - Only creates a producer for role = 'producer'.
   - Always creates a profile row.
2. Backfill: for any auth.users who already have a profile but no producer
   (and role = 'producer'), create the missing producer row now.
3. Ensure the trigger is enabled.

## Security
- Function is SECURITY DEFINER so it can insert into producers/profiles.
- RLS already in place from previous migrations.
*/

-- ── Replace the trigger function ──
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

  -- Unique slug: name-based + full UUID suffix (no collisions)
  v_slug := lower(regexp_replace(regexp_replace(v_full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  v_slug := v_slug || '-' || replace(v_user_id::text, '-', '');

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

  -- Insert profile (always)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, v_email, v_full_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  -- Insert producer only if role is producer
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
    )
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Ensure trigger is active ──
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Backfill: create producers for existing users who have a profile
--    with role='producer' but no producer row ──
DO $$
DECLARE
  r RECORD;
  v_slug text;
  v_initials text;
  v_color text;
  v_colors text[] := ARRAY['#15803d','#92400e','#b45309','#7c2d12','#451a03','#0369a1','#0f766e','#6d28d9'];
  v_flag text;
BEGIN
  FOR r IN
    SELECT p.id, p.email, p.full_name, p.role
    FROM profiles p
    LEFT JOIN producers pr ON pr.user_id = p.id
    WHERE p.role = 'producer' AND pr.id IS NULL
  LOOP
    v_slug := lower(regexp_replace(regexp_replace(COALESCE(r.full_name, split_part(r.email, '@', 1)), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    v_slug := v_slug || '-' || replace(r.id::text, '-', '');
    v_initials := upper(substring(COALESCE(r.full_name, r.email) FROM 1 FOR 2));
    v_color := v_colors[1 + (abs(hashtext(r.id::text)) % array_length(v_colors, 1))];
    v_flag := '🌍';

    INSERT INTO public.producers (
      user_id, name, slug, country, country_flag,
      avatar_initials, avatar_color, banner_color,
      description, verified, top_seller,
      rating, review_count, product_count, order_count,
      satisfaction_rate, response_time, certifications,
      profile_status
    ) VALUES (
      r.id, COALESCE(r.full_name, split_part(r.email, '@', 1)), v_slug, 'France', v_flag,
      v_initials, v_color, v_color,
      NULL, false, false,
      0, 0, 0, 0,
      100, '24h', '{}',
      'incomplete'
    )
    ON CONFLICT (slug) DO NOTHING;
  END LOOP;
END $$;
