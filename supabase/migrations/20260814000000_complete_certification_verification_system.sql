-- ==============================================================================
-- ETHIMARKET — MODULE MONDIAL DE VÉRIFICATION DES CERTIFICATIONS PRODUCTEURS
-- Migration: 20260814000000_complete_certification_verification_system.sql
-- Description: Schéma relationnel complet, ENUMs idempotents, RLS, Triggers & Index
-- ==============================================================================

-- ==============================================================================
-- 1. CRÉATION IDEMPOTENTE DES TYPES ENUM
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE certification_region_enum AS ENUM (
    'Africa', 'Asia', 'Latin America', 'Europe', 'North America', 'Oceania', 'Middle East'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE certification_type_enum AS ENUM (
    'organic', 'fair_trade', 'ethical', 'sustainable', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_level_enum AS ENUM (
    'verified', 'unverified', 'pending'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_channel_enum AS ENUM (
    'api', 'email', 'form', 'phone', 'whatsapp', 'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status_enum AS ENUM (
    'unverified', 'pending', 'contact_sent', 'verified', 'rejected', 'expired', 'manual_required'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM (
    'sent', 'pending', 'success', 'failed', 'no_response'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. CRÉATION DES TABLES
-- ==============================================================================

-- TABLE 1 : certification_bodies (Organismes certificateurs mondiaux)
CREATE TABLE IF NOT EXISTS certification_bodies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  acronym TEXT,
  country TEXT NOT NULL,
  region certification_region_enum NOT NULL,
  sub_region TEXT,
  website TEXT,
  verification_url TEXT,
  api_endpoint TEXT,
  api_key_required BOOLEAN DEFAULT false,
  api_key_encrypted TEXT,
  email_contact TEXT,
  phone TEXT,
  whatsapp TEXT,
  contact_form_url TEXT,
  languages TEXT[] DEFAULT '{}',
  certification_types certification_type_enum[] DEFAULT '{}',
  trust_level trust_level_enum DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  internal_notes TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 2 : certification_body_contacts (Contacts humains / auditeurs par organisme)
CREATE TABLE IF NOT EXISTS certification_body_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_body_id UUID NOT NULL 
    REFERENCES certification_bodies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  language TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 3 : certification_standards (Standards, labels & cahiers des charges gérés)
CREATE TABLE IF NOT EXISTS certification_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_body_id UUID NOT NULL 
    REFERENCES certification_bodies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  type certification_type_enum,
  description TEXT,
  scope TEXT,
  geographic_coverage TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 4 : producer_certifications (Certifications déclarées et rattachées au producteur)
CREATE TABLE IF NOT EXISTS producer_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL 
    REFERENCES producers(id) ON DELETE CASCADE,
  certification_body_id UUID 
    REFERENCES certification_bodies(id) ON DELETE SET NULL,
  certification_standard_id UUID 
    REFERENCES certification_standards(id) ON DELETE SET NULL,
  certificate_number TEXT,
  issued_at DATE,
  expires_at DATE,
  document_path TEXT,
  country_of_issue TEXT,
  status verification_status_enum DEFAULT 'unverified',
  admin_notes TEXT,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 5 : certification_verification_requests (Requêtes et contacts émis vers l'organisme)
CREATE TABLE IF NOT EXISTS certification_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_certification_id UUID NOT NULL 
    REFERENCES producer_certifications(id) ON DELETE CASCADE,
  certification_body_id UUID 
    REFERENCES certification_bodies(id) ON DELETE SET NULL,
  triggered_by UUID NOT NULL 
    REFERENCES profiles(id) ON DELETE CASCADE,
  channel verification_channel_enum NOT NULL,
  status request_status_enum DEFAULT 'pending',
  message_sent TEXT,
  response_received TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 6 : certification_verification_logs (Journal d'audit immuable des contrôles)
CREATE TABLE IF NOT EXISTS certification_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_certification_id UUID NOT NULL 
    REFERENCES producer_certifications(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL 
    REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_status verification_status_enum,
  new_status verification_status_enum,
  channel_used verification_channel_enum,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 7 : certification_message_templates (Modèles de messages multilingues et multicanaux)
CREATE TABLE IF NOT EXISTS certification_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  channel verification_channel_enum NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. CRÉATION DES INDEX D'OPTIMISATION DE RECHERCHE
-- ==============================================================================

-- certification_bodies
CREATE INDEX IF NOT EXISTS idx_cert_bodies_region ON certification_bodies(region);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_country ON certification_bodies(country);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_is_active ON certification_bodies(is_active);
CREATE INDEX IF NOT EXISTS idx_cert_bodies_trust_level ON certification_bodies(trust_level);

-- certification_body_contacts
CREATE INDEX IF NOT EXISTS idx_cert_contacts_body_id ON certification_body_contacts(certification_body_id);

-- certification_standards
CREATE INDEX IF NOT EXISTS idx_cert_standards_body_id ON certification_standards(certification_body_id);

-- producer_certifications
CREATE INDEX IF NOT EXISTS idx_prod_certs_producer_id ON producer_certifications(producer_id);
CREATE INDEX IF NOT EXISTS idx_prod_certs_status ON producer_certifications(status);
CREATE INDEX IF NOT EXISTS idx_prod_certs_expires_at ON producer_certifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_prod_certs_body_id ON producer_certifications(certification_body_id);

-- certification_verification_requests
CREATE INDEX IF NOT EXISTS idx_verif_req_prod_cert_id ON certification_verification_requests(producer_certification_id);
CREATE INDEX IF NOT EXISTS idx_verif_req_status ON certification_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verif_req_triggered_by ON certification_verification_requests(triggered_by);

-- certification_verification_logs
CREATE INDEX IF NOT EXISTS idx_verif_logs_prod_cert_id ON certification_verification_logs(producer_certification_id);
CREATE INDEX IF NOT EXISTS idx_verif_logs_admin_id ON certification_verification_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_verif_logs_created_at ON certification_verification_logs(created_at);

-- certification_message_templates
CREATE INDEX IF NOT EXISTS idx_msg_templates_lang ON certification_message_templates(language);
CREATE INDEX IF NOT EXISTS idx_msg_templates_channel ON certification_message_templates(channel);

-- ==============================================================================
-- 4. FONCTIONS ET TRIGGERS AUTOMATIQUES
-- ==============================================================================

-- 4.1 Fonction générique pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Fonction pour mettre à jour last_updated_at sur certification_bodies
CREATE OR REPLACE FUNCTION set_last_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at sur producer_certifications
DROP TRIGGER IF EXISTS trg_prod_certs_updated_at ON producer_certifications;
CREATE TRIGGER trg_prod_certs_updated_at
  BEFORE UPDATE ON producer_certifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Trigger updated_at sur certification_message_templates
DROP TRIGGER IF EXISTS trg_msg_templates_updated_at ON certification_message_templates;
CREATE TRIGGER trg_msg_templates_updated_at
  BEFORE UPDATE ON certification_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Trigger last_updated_at sur certification_bodies
DROP TRIGGER IF EXISTS trg_cert_bodies_updated_at ON certification_bodies;
CREATE TRIGGER trg_cert_bodies_updated_at
  BEFORE UPDATE ON certification_bodies
  FOR EACH ROW
  EXECUTE FUNCTION set_last_updated_at_timestamp();

-- 4.3 Trigger d'audit automatique : chaque changement de statut insère une ligne dans certification_verification_logs
CREATE OR REPLACE FUNCTION log_producer_certification_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Récupération de l'admin vérificateur ou de l'utilisateur courant authentifié
    v_admin_id := COALESCE(NEW.verified_by, auth.uid());

    -- Si v_admin_id est NULL (ex: mise à jour via backend/cron), fallback sur le premier profil admin
    IF v_admin_id IS NULL THEN
      SELECT id INTO v_admin_id FROM profiles WHERE is_admin = true LIMIT 1;
    END IF;

    IF v_admin_id IS NOT NULL THEN
      INSERT INTO certification_verification_logs (
        producer_certification_id,
        admin_id,
        action,
        previous_status,
        new_status,
        channel_used,
        details,
        created_at
      ) VALUES (
        NEW.id,
        v_admin_id,
        'STATUS_UPDATE',
        OLD.status,
        NEW.status,
        'manual',
        jsonb_build_object(
          'trigger', 'auto_audit_trigger',
          'admin_notes', NEW.admin_notes,
          'certificate_number', NEW.certificate_number
        ),
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_prod_cert_status ON producer_certifications;
CREATE TRIGGER trg_log_prod_cert_status
  AFTER UPDATE ON producer_certifications
  FOR EACH ROW
  EXECUTE FUNCTION log_producer_certification_status_change();

-- ==============================================================================
-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE certification_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_body_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_message_templates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_bodies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_read_cert_bodies" ON certification_bodies;
CREATE POLICY "auth_read_cert_bodies" ON certification_bodies
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_cert_bodies" ON certification_bodies;
CREATE POLICY "admin_manage_cert_bodies" ON certification_bodies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_body_contacts
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_read_cert_contacts" ON certification_body_contacts;
CREATE POLICY "auth_read_cert_contacts" ON certification_body_contacts
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_cert_contacts" ON certification_body_contacts;
CREATE POLICY "admin_manage_cert_contacts" ON certification_body_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_standards
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_read_cert_standards" ON certification_standards;
CREATE POLICY "auth_read_cert_standards" ON certification_standards
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_cert_standards" ON certification_standards;
CREATE POLICY "admin_manage_cert_standards" ON certification_standards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- POLITIQUES : producer_certifications
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "owner_or_admin_read_producer_certs" ON producer_certifications;
CREATE POLICY "owner_or_admin_read_producer_certs" ON producer_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM producers 
      WHERE producers.id = producer_certifications.producer_id 
        AND producers.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "owner_or_admin_insert_producer_certs" ON producer_certifications;
CREATE POLICY "owner_or_admin_insert_producer_certs" ON producer_certifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM producers 
      WHERE producers.id = producer_certifications.producer_id 
        AND producers.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_update_producer_certs" ON producer_certifications;
CREATE POLICY "admin_update_producer_certs" ON producer_certifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_delete_producer_certs" ON producer_certifications;
CREATE POLICY "admin_delete_producer_certs" ON producer_certifications
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_verification_requests
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_verif_requests" ON certification_verification_requests;
CREATE POLICY "admin_read_verif_requests" ON certification_verification_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_insert_verif_requests" ON certification_verification_requests;
CREATE POLICY "admin_insert_verif_requests" ON certification_verification_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_update_verif_requests" ON certification_verification_requests;
CREATE POLICY "admin_update_verif_requests" ON certification_verification_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_verification_logs (JOURNAL D'AUDIT IMMUABLE)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_verif_logs" ON certification_verification_logs;
CREATE POLICY "admin_read_verif_logs" ON certification_verification_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_insert_verif_logs" ON certification_verification_logs;
CREATE POLICY "admin_insert_verif_logs" ON certification_verification_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- Pas de politiques UPDATE ni DELETE sur les logs => impossibilité totale de modifier/supprimer

-- ------------------------------------------------------------------------------
-- POLITIQUES : certification_message_templates
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_msg_templates" ON certification_message_templates;
CREATE POLICY "admin_read_msg_templates" ON certification_message_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "admin_manage_msg_templates" ON certification_message_templates;
CREATE POLICY "admin_manage_msg_templates" ON certification_message_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );
