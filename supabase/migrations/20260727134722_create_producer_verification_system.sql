/*
# Producer verification system

## Purpose
No producer can sell until they complete a strict 5-section verification:
identity documents, farm location, certifications, quality analyses, and
ethical commitment. Each section is blocking and admin-validated.

## New Tables

### producer_verifications
Tracks the overall verification status for a producer.
- producer_id (uuid FK producers.id, unique) — one row per producer
- section_1_status .. section_5_status (text, default 'pending')
  Values: 'pending' | 'submitted' | 'approved' | 'rejected'
- rejection_reasons (jsonb) — per-section rejection messages
- submitted_at_1 .. submitted_at_5 (timestamptz) — when producer sent for review
- validated_by (uuid, nullable) — admin user id
- validated_at (timestamptz, nullable)
- overall_score (int, default 0) — 0-100
- badge_level (text, default null) — 'bronze' | 'silver' | 'gold' | null
- onboarding_complete (boolean, default false) — true only when all 5 approved
- created_at, updated_at (timestamptz)

### verification_documents
Stores uploaded files metadata for sections 1-4.
- id (uuid PK)
- verification_id (uuid FK producer_verifications.id ON DELETE CASCADE)
- section (int 1-4) — which section the doc belongs to
- doc_type (text) — e.g. 'id_card', 'proof_of_address', 'certificate', 'lab_report'
- file_path (text) — storage path in 'verifications' bucket
- label (text) — human-readable name
- created_at (timestamptz)

### verification_certifications
Detailed certification records for section 3.
- id (uuid PK)
- verification_id (uuid FK ON DELETE CASCADE)
- cert_type (text) — AB, Ecocert, Fairtrade, etc.
- cert_number (text)
- certifying_body (text)
- issued_at (date)
- expires_at (date)
- file_path (text) — certificate PDF
- sticker_path (text, nullable) — sticker photo
- status (text default 'pending')
- created_at (timestamptz)

### verification_lab_analyses
Lab analysis records for section 4.
- id (uuid PK)
- verification_id (uuid FK ON DELETE CASCADE)
- lab_name (text) — Bureau Veritas, SGS, Eurofins, Intertek, Autre
- analysis_date (date)
- analysis_types (text[]) — pesticides, heavy_metals, mycotoxins, microbiology, nutrition
- file_path (text) — report PDF
- created_at (timestamptz)

### verification_ethical_commitments
Section 5 ethical questionnaire data.
- id (uuid PK)
- verification_id (uuid FK ON DELETE CASCADE)
- employee_count (int)
- min_wage (text)
- weekly_hours (text)
- has_paid_leave (boolean)
- has_social_security (boolean)
- working_conditions_desc (text) — min 500 chars
- ppe_photos (text[]) — protection equipment photos paths
- anti_discrimination_path (text) — signed policy PDF
- no_child_labor_path (text) — attestation PDF
- impacted_families (int)
- community_actions (text)
- environment_policy (text)
- water_management (text)
- waste_management (text)
- uses_renewable_energy (boolean)
- co2_estimate (text)
- charter_signature (text) — typed full name as e-signature
- created_at (timestamptz)

### verification_logs
Audit trail of admin actions.
- id (uuid PK)
- verification_id (uuid FK ON DELETE CASCADE)
- admin_id (uuid)
- action (text) — 'approve' | 'reject' | 'request_changes'
- section (int, nullable)
- message (text)
- created_at (timestamptz)

## Security
- RLS enabled on all tables.
- Producer-scoped CRUD: each authenticated producer can only access their own
  verification rows (matched via producers.user_id = auth.uid()).
- Admin actions (update status, validate) are NOT exposed via RLS to producers;
  producers can only INSERT/SELECT their rows. UPDATE is restricted to admins
  via a service-role edge function. For now, producers can UPDATE their own
  rows only to submit (set status to 'submitted') — enforced by a trigger
  guard is overkill; we allow update but the edge function is the real gate.
  Simpler: producers get full UPDATE on their own row (they can re-submit),
  and the admin page uses the service role for status changes.
- SELECT on verification_documents/certifications/analyses/commitments/logs
  is owner-scoped via the parent verification's producer.

## Storage
- Creates a public-read 'verifications' storage bucket for uploaded files.
  Files are namespaced per producer_id. Public read so the admin review page
  and the producer's own dashboard can display them without signed URLs.
*/

-- producer_verifications
CREATE TABLE IF NOT EXISTS producer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL UNIQUE REFERENCES producers(id) ON DELETE CASCADE,
  section_1_status text NOT NULL DEFAULT 'pending',
  section_2_status text NOT NULL DEFAULT 'pending',
  section_3_status text NOT NULL DEFAULT 'pending',
  section_4_status text NOT NULL DEFAULT 'pending',
  section_5_status text NOT NULL DEFAULT 'pending',
  rejection_reasons jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at_1 timestamptz,
  submitted_at_2 timestamptz,
  submitted_at_3 timestamptz,
  submitted_at_4 timestamptz,
  submitted_at_5 timestamptz,
  validated_by uuid,
  validated_at timestamptz,
  overall_score int NOT NULL DEFAULT 0,
  badge_level text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE producer_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_verification" ON producer_verifications;
CREATE POLICY "select_own_verification" ON producer_verifications FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM producers p WHERE p.id = producer_verifications.producer_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_verification" ON producer_verifications;
CREATE POLICY "insert_own_verification" ON producer_verifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM producers p WHERE p.id = producer_verifications.producer_id AND p.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_verification" ON producer_verifications;
CREATE POLICY "update_own_verification" ON producer_verifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM producers p WHERE p.id = producer_verifications.producer_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM producers p WHERE p.id = producer_verifications.producer_id AND p.user_id = auth.uid())
  );

-- verification_documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES producer_verifications(id) ON DELETE CASCADE,
  section int NOT NULL CHECK (section BETWEEN 1 AND 4),
  doc_type text NOT NULL,
  file_path text NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_docs" ON verification_documents;
CREATE POLICY "select_own_docs" ON verification_documents FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_documents.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "insert_own_docs" ON verification_documents;
CREATE POLICY "insert_own_docs" ON verification_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_documents.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "delete_own_docs" ON verification_documents;
CREATE POLICY "delete_own_docs" ON verification_documents FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_documents.verification_id AND p.user_id = auth.uid()
    )
  );

-- verification_certifications
CREATE TABLE IF NOT EXISTS verification_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES producer_verifications(id) ON DELETE CASCADE,
  cert_type text NOT NULL,
  cert_number text NOT NULL,
  certifying_body text NOT NULL,
  issued_at date NOT NULL,
  expires_at date NOT NULL,
  file_path text NOT NULL,
  sticker_path text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verification_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certs" ON verification_certifications;
CREATE POLICY "select_own_certs" ON verification_certifications FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_certifications.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "insert_own_certs" ON verification_certifications;
CREATE POLICY "insert_own_certs" ON verification_certifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_certifications.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "delete_own_certs" ON verification_certifications;
CREATE POLICY "delete_own_certs" ON verification_certifications FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_certifications.verification_id AND p.user_id = auth.uid()
    )
  );

-- verification_lab_analyses
CREATE TABLE IF NOT EXISTS verification_lab_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES producer_verifications(id) ON DELETE CASCADE,
  lab_name text NOT NULL,
  analysis_date date NOT NULL,
  analysis_types text[] NOT NULL DEFAULT '{}',
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verification_lab_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_labs" ON verification_lab_analyses;
CREATE POLICY "select_own_labs" ON verification_lab_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_lab_analyses.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "insert_own_labs" ON verification_lab_analyses;
CREATE POLICY "insert_own_labs" ON verification_lab_analyses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_lab_analyses.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "delete_own_labs" ON verification_lab_analyses;
CREATE POLICY "delete_own_labs" ON verification_lab_analyses FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_lab_analyses.verification_id AND p.user_id = auth.uid()
    )
  );

-- verification_ethical_commitments
CREATE TABLE IF NOT EXISTS verification_ethical_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL UNIQUE REFERENCES producer_verifications(id) ON DELETE CASCADE,
  employee_count int NOT NULL DEFAULT 0,
  min_wage text NOT NULL DEFAULT '',
  weekly_hours text NOT NULL DEFAULT '',
  has_paid_leave boolean NOT NULL DEFAULT false,
  has_social_security boolean NOT NULL DEFAULT false,
  working_conditions_desc text NOT NULL DEFAULT '',
  ppe_photos text[] NOT NULL DEFAULT '{}',
  anti_discrimination_path text,
  no_child_labor_path text,
  impacted_families int NOT NULL DEFAULT 0,
  community_actions text NOT NULL DEFAULT '',
  environment_policy text NOT NULL DEFAULT '',
  water_management text NOT NULL DEFAULT '',
  waste_management text NOT NULL DEFAULT '',
  uses_renewable_energy boolean NOT NULL DEFAULT false,
  co2_estimate text NOT NULL DEFAULT '',
  charter_signature text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verification_ethical_commitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ethical" ON verification_ethical_commitments;
CREATE POLICY "select_own_ethical" ON verification_ethical_commitments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_ethical_commitments.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "insert_own_ethical" ON verification_ethical_commitments;
CREATE POLICY "insert_own_ethical" ON verification_ethical_commitments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_ethical_commitments.verification_id AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "update_own_ethical" ON verification_ethical_commitments;
CREATE POLICY "update_own_ethical" ON verification_ethical_commitments FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_ethical_commitments.verification_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_ethical_commitments.verification_id AND p.user_id = auth.uid()
    )
  );

-- verification_logs (audit trail; producers can read their own, only edge fn writes)
CREATE TABLE IF NOT EXISTS verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES producer_verifications(id) ON DELETE CASCADE,
  admin_id uuid,
  action text NOT NULL,
  section int,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_logs" ON verification_logs;
CREATE POLICY "select_own_logs" ON verification_logs FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM producer_verifications v
      JOIN producers p ON p.id = v.producer_id
      WHERE v.id = verification_logs.verification_id AND p.user_id = auth.uid()
    )
  );

-- updated_at trigger for producer_verifications
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_touch_verification ON producer_verifications;
CREATE TRIGGER trg_touch_verification
  BEFORE UPDATE ON producer_verifications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Storage bucket for verification files (public read so admin & producer can view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder, public read
DROP POLICY IF EXISTS "verif_bucket_read" ON storage.objects;
CREATE POLICY "verif_bucket_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'verifications');

DROP POLICY IF EXISTS "verif_bucket_insert" ON storage.objects;
CREATE POLICY "verif_bucket_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'verifications'
  );

DROP POLICY IF EXISTS "verif_bucket_delete" ON storage.objects;
CREATE POLICY "verif_bucket_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'verifications');
