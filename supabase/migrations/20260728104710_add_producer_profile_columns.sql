/*
# Add missing producer profile columns

## Purpose
The producer profile page needs additional columns to support identity
documents, business documents, ethical charter, short/long descriptions,
profile completion percentage, and a phone field on the producer row itself.

## Columns added to `producers`
- families_impacted (integer) — number of families impacted (cooperatives)
- phone (text) — producer's direct phone number
- identity_type (text) — type of ID: 'cni' | 'passport' | 'license'
- identity_number (text) — ID document number
- identity_expiry (date) — ID expiry date
- identity_recto_url (text) — front of ID document
- identity_verso_url (text) — back of ID document
- identity_verified (boolean, default false) — admin verification status
- business_documents (jsonb, default '{}') — statutory docs, registry, etc.
- lab_analysis_url (text) — recent lab analysis PDF
- ethical_charter_url (text) — signed ethical charter PDF
- ethical_charter_signed (boolean, default false) — charter signed checkbox
- short_description (text) — max 200 chars
- long_description (text) — min 500 chars (story)
- profile_completion (integer, default 0) — 0-100 percentage

## Security
- No RLS changes needed (policies already exist from previous migrations).
- All columns are nullable with sensible defaults.
*/

ALTER TABLE producers ADD COLUMN IF NOT EXISTS families_impacted integer;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_type text DEFAULT 'cni' CHECK (identity_type IN ('cni', 'passport', 'license'));
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_number text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_expiry date;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_recto_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_verso_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS business_documents jsonb DEFAULT '{}'::jsonb;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS lab_analysis_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ethical_charter_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS ethical_charter_signed boolean DEFAULT false;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS long_description text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS profile_completion integer DEFAULT 0;
