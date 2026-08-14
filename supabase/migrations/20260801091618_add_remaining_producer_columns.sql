/*
# Add remaining producer profile columns

## Purpose
Complete the producer profile schema with all fields needed for the
enhanced profile page: birth date, identity country/issue date, business
email, landmark, techniques description, average yield, current available
volume, full/part-time employees, minimum wage currency, working hours,
paid leave, health insurance, protected area, signature URL, ethical
charter signed timestamp, product photos, and last updated timestamp.

## Security
- No RLS changes (existing policies already cover owner-scoped CRUD).
- All columns are nullable with sensible defaults.
*/

ALTER TABLE producers ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_country text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_issue_date date;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS business_email text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS average_yield text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS techniques_description text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS current_available_volume text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS full_time_employees integer;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS part_time_employees integer;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS minimum_wage text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS minimum_wage_currency text DEFAULT 'EUR';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS working_hours_per_week integer;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS paid_leave text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS health_insurance boolean DEFAULT false;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS protected_area text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ethical_charter_signed_at timestamptz;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS product_photos text[] DEFAULT '{}';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS last_updated_at timestamptz DEFAULT now();
ALTER TABLE producers ADD COLUMN IF NOT EXISTS shipping_paid_by text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS logistics_partners text;
