/*
# Complete producer columns migration for all 10 profile sections
Includes all field variants and aliases to eliminate schema cache errors.
*/

DO $$
DECLARE
  v_cols text[][] := ARRAY[
    ['avatar_url', 'text'],
    ['profile_photo_url', 'text'],
    ['first_name', 'text'],
    ['last_name', 'text'],
    ['birth_date', 'date'],
    ['languages_spoken', 'text[]'],
    ['identity_type', 'text'],
    ['identity_number', 'text'],
    ['identity_country', 'text'],
    ['identity_issue_date', 'date'],
    ['identity_expiry_date', 'date'],
    ['identity_expiry', 'date'],
    ['identity_recto_url', 'text'],
    ['identity_verso_url', 'text'],
    ['identity_verified', 'boolean'],
    ['identity_verified_at', 'timestamptz'],
    ['organization_type', 'text'],
    ['org_type', 'text'],
    ['registration_number', 'text'],
    ['organization_creation_date', 'date'],
    ['employees_count', 'integer'],
    ['employee_count', 'integer'],
    ['families_impacted', 'integer'],
    ['short_description', 'text'],
    ['long_description', 'text'],
    ['full_address', 'text'],
    ['address', 'text'],
    ['postal_code', 'text'],
    ['landmark', 'text'],
    ['cultivation_methods', 'text[]'],
    ['farming_methods', 'text[]'],
    ['techniques_description', 'text'],
    ['seasonality', 'text[]'],
    ['current_available_volume', 'text'],
    ['business_documents', 'jsonb'],
    ['farm_photos', 'text[]'],
    ['transport_methods', 'text[]'],
    ['transport_modes', 'text[]'],
    ['delivery_days', 'integer'],
    ['delivery_days_avg', 'integer'],
    ['transport_insurance', 'boolean'],
    ['has_insurance', 'boolean'],
    ['shipping_paid_by', 'text'],
    ['logistics_partners', 'text'],
    ['minimum_wage', 'text'],
    ['min_wage', 'text'],
    ['minimum_wage_currency', 'text'],
    ['working_hours_per_week', 'integer'],
    ['paid_leave', 'text'],
    ['health_insurance', 'boolean'],
    ['working_conditions', 'text'],
    ['co2_saved', 'text'],
    ['water_saved', 'text'],
    ['trees_preserved', 'text'],
    ['protected_area', 'text'],
    ['community_actions', 'text'],
    ['social_actions', 'text'],
    ['ethical_charter_signed', 'boolean'],
    ['ethical_charter_signed_at', 'timestamptz'],
    ['signature_url', 'text'],
    ['presentation_video_url', 'text'],
    ['video_url', 'text'],
    ['ethimarket_score', 'integer'],
    ['badge_level', 'text'],
    ['profile_status', 'text'],
    ['last_updated_at', 'timestamptz']
  ];
  i integer;
BEGIN
  FOR i IN 1..array_length(v_cols, 1) LOOP
    EXECUTE format('ALTER TABLE public.producers ADD COLUMN IF NOT EXISTS %I %s', v_cols[i][1], v_cols[i][2]);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
