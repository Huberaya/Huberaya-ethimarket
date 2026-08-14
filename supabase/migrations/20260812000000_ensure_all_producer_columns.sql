/*
# Ensure all producer columns exist for full profile editor

1. Add all missing columns for all 10 sections of MonProfil.tsx to `producers`.
2. Reload Supabase schema cache automatically.
*/

-- ── 1. Identity & Profile ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS long_description text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS story text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS languages_spoken text[] DEFAULT '{}';

-- ── 2. Identity Verification Docs ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_type text DEFAULT 'cni';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_number text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_country text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_issue_date date;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_expiry date;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_recto_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_verso_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

-- ── 3. Organisation ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS org_type text DEFAULT 'producteur';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS founded_year integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS families_impacted integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS business_email text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS whatsapp text;

-- ── 4. Location ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS longitude numeric;

-- ── 5. Production & Capacity ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS product_types text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS surface_value numeric;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS surface_unit text DEFAULT 'hectares';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS annual_capacity text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS capacity_unit text DEFAULT 'tonnes';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS average_yield text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS farming_methods text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS techniques_description text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS seasonality text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS current_available_volume text;

-- ── 6 & 7. Certifications & Documents ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS business_documents jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS lab_analysis_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS ethical_charter_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS ethical_charter_signed boolean DEFAULT false;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS ethical_charter_signed_at timestamptz;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS signature_url text;

-- ── 8. Logistics ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS delivery_countries text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS transport_modes text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS delivery_days_avg integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS packaging_types text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS has_insurance boolean DEFAULT false;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS shipping_paid_by text DEFAULT 'producteur';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS logistics_partners text;

-- ── 9. Ethical Engagement & Impact ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS full_time_employees integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS part_time_employees integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS min_wage text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS minimum_wage text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS minimum_wage_currency text DEFAULT 'EUR';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS working_hours_per_week integer;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS paid_leave text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS health_insurance boolean DEFAULT false;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS working_conditions text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS co2_saved text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS water_saved text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS trees_preserved text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS protected_area text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS social_actions text;

-- ── 10. Media ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS team_photos text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS product_photos text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS farm_photos text[] DEFAULT '{}';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS video_url text;

-- ── Status & Completion ──
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 10;
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS profile_status text DEFAULT 'incomplete';
ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS last_updated_at timestamptz DEFAULT now();

-- ── Reload PostgREST Schema Cache ──
NOTIFY pgrst, 'reload schema';
