-- ==============================================================================
-- MIGRATION : Aligner le schéma certification_message_templates & Seed 12 templates
-- Schéma cible exact de votre base : (title, language, channel, subject, body, variables, is_default, ...)
-- ==============================================================================

-- 1. CRÉATION DU TYPE ENUM CANAL SI NÉCESSAIRE
DO $$ BEGIN
  CREATE TYPE verification_channel_enum AS ENUM (
    'api', 'email', 'form', 'phone', 'whatsapp', 'manual', 'letter'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. CRÉATION DE LA TABLE SI ABSENTE
CREATE TABLE IF NOT EXISTS certification_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  previous_version JSONB DEFAULT NULL,
  last_modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AJOUT DES COLONNES MANQUANTES (version, previous_version, last_modified_by, etc.)
ALTER TABLE certification_message_templates
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_version JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. SUPPRESSION DE TOUTES LES ANCIENNES CONTRAINTES CHECK BLOQUANTES
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'certification_message_templates'::regclass 
      AND contype = 'c'
  ) LOOP
    EXECUTE 'ALTER TABLE certification_message_templates DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE;';
  END LOOP;
END $$;

-- 5. CONTRAINTE UNIQUE SUR (title, language, channel)
ALTER TABLE certification_message_templates 
  DROP CONSTRAINT IF EXISTS uq_template_title_lang_channel;

ALTER TABLE certification_message_templates 
  DROP CONSTRAINT IF EXISTS uq_template_name_lang_channel;

ALTER TABLE certification_message_templates
  ADD CONSTRAINT uq_template_title_lang_channel UNIQUE (title, language, channel);

-- 6. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE certification_message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_msg_templates" ON certification_message_templates;
CREATE POLICY "auth_read_msg_templates" ON certification_message_templates
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_manage_msg_templates" ON certification_message_templates;
CREATE POLICY "admin_manage_msg_templates" ON certification_message_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- 7. INSERTION IDEMPOTENTE DES 12 MODÈLES DE MESSAGES PROFESSIONNELS SUR LA COLONNE TITLE

-- (1) CANAL EMAIL - Demande initiale officielle (Français)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Demande de vérification initiale officielle',
  'fr',
  'email',
  'Demande de confirmation d''authenticité de certification — {standard_name} — {producer_name}',
  'Madame, Monsieur l''Auditeur / Service Conformité,

Dans le cadre de la démarche de transparence et d''audit qualité menée par {platform_name}, nous procédons actuellement à la vérification systématique des titres et certifications déclarés par nos producteurs partenaires.

L''établissement référencé ci-dessous a soumis une attestation de conformité délivrée sous votre autorité :

• Entreprise / Producteur : {producer_name}
• Référence / Numéro de certificat : {certificate_number}
• Référentiel / Standard audité : {standard_name}
• Organisme certificateur émetteur : {body_name}
• Date d''émission déclarée : {issue_date}
• Date d''expiration déclarée : {expiry_date}
• Lien vers le document transmis : {verification_url}

Pourriez-vous avoir l''amabilité de nous confirmer par retour de courriel :
1. Que ce certificat est authentique et actuellement valide (sans suspension ni retrait en cours) ;
2. Que le périmètre des activités et produits certifiés couvre bien les éléments mentionnés.

Nous vous remercions vivement par avance pour votre précieux concours à la garantie de la conformité et de l''intégrité des filières durables.

Restant à votre entière disposition pour tout renseignement complémentaire, nous vous prions d''agréer, Madame, Monsieur, l''expression de notre considération distinguée.

L''Équipe d''Audit & Conformité
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'issue_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (2) CANAL EMAIL - Official Initial Verification Request (English)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Official Initial Verification Request',
  'en',
  'email',
  'Certificate Authenticity & Standing Verification — {standard_name} — {producer_name}',
  'Dear Compliance & Certification Department,

As part of {platform_name}''s rigorous vendor due diligence and quality verification protocols, we are currently reviewing the certification credentials submitted by our registered suppliers.

The following producer has submitted a certificate issued under your accreditation:

• Producer / Business Name: {producer_name}
• Certificate Registration Number: {certificate_number}
• Applicable Standard / Scheme: {standard_name}
• Issuing Certification Body: {body_name}
• Declared Issue Date: {issue_date}
• Declared Expiry Date: {expiry_date}
• Document Access Link: {verification_url}

Could you kindly confirm by replying to this email:
1. Whether this certificate is active, authentic, and in good standing without any pending suspension or revocation;
2. That the certified scope accurately covers the producer''s operations and products.

Thank you very much in advance for your assistance in maintaining trust and high sustainability standards across global supply chains.

Sincerely,

Audit & Verification Department
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'issue_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (3) CANAL EMAIL - Solicitud oficial de verificación (Espagnol)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Solicitud oficial de verificación de certificación',
  'es',
  'email',
  'Solicitud de confirmación de autenticidad de certificado — {standard_name} — {producer_name}',
  'Estimado/a responsable del Departamento de Auditoría y Certificación,

En el marco de nuestro proceso continuo de debida diligencia y control de calidad en {platform_name}, solicitamos cordialmente la verificación del certificado emitido por su entidad para el siguiente productor:

• Nombre del productor / Empresa: {producer_name}
• Número de certificado: {certificate_number}
• Norma / Estándar certificado: {standard_name}
• Organismo de certificación emisor: {body_name}
• Fecha de emisión declarada: {issue_date}
• Fecha de caducidad declarada: {expiry_date}
• Enlace al documento presentado: {verification_url}

Agradeceríamos enormemente que nos confirmaran por esta vía si dicho certificado se encuentra actualmente vigente, activo y sin suspensiones.

Agradeciendo de antemano su colaboración y compromiso con la transparencia en las cadenas de valor sostenibles.

Atentamente,

Departamento de Cumplimiento y Auditoría
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'issue_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (4) CANAL EMAIL - Solicitação oficial de verificação (Portugais)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Solicitação oficial de verificação de certificação',
  'pt',
  'email',
  'Confirmação de autenticidade e validade de certificado — {standard_name} — {producer_name}',
  'Prezado(a) Senhor(a) / Departamento de Certificação e Auditoria,

No âmbito do programa de integridade e auditoria de fornecedores da plataforma {platform_name}, solicitamos gentilmente a confirmação da validade do certificado emitido pelo vosso organismo :

• Nome do produtor / Empresa: {producer_name}
• Número do certificado: {certificate_number}
• Norma / Padrão de certificação: {standard_name}
• Organismo certificador emissor: {body_name}
• Data de emissão: {issue_date}
• Data de validade: {expiry_date}
• Documento anexado para consulta: {verification_url}

Agradecemos se puder nos confirmar por este e-mail se o certificado permanece ativo, autêntico e em plena conformidade.

Desde já, agradecemos pela vossa disponibilidade e cooperação em prol do comércio justo e sustentável.

Atenciosamente,

Equipe de Auditoria e Conformidade
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'issue_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (5) CANAL WHATSAPP - Message court de vérification (Français)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Message court de vérification WhatsApp',
  'fr',
  'whatsapp',
  NULL,
  'Bonjour l''équipe {body_name},

Ici l''équipe Audit de {platform_name}. Nous réalisons un contrôle de conformité pour le producteur *{producer_name}*.

Pouvez-vous nous confirmer la validité du certificat :
• Standard : {standard_name}
• N° Certificat : {certificate_number}
• Expiration déclarée : {expiry_date}
• Document : {verification_url}

Ce certificat est-il bien actif et conforme ? Merci d''avance pour votre retour rapide !

Équipe Audit {platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (6) CANAL WHATSAPP - Short WhatsApp Verification Message (English)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Short WhatsApp Verification Message',
  'en',
  'whatsapp',
  NULL,
  'Hello {body_name} team,

This is the Audit Team from {platform_name}. We are verifying the certification status for producer *{producer_name}*.

Could you please confirm if this certificate is active & valid?
• Standard: {standard_name}
• Certificate #: {certificate_number}
• Expiry Date: {expiry_date}
• Document: {verification_url}

Thank you in advance for your assistance!

Audit Team — {platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (7) CANAL FORMULAIRE - Message générique portail web (Français)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Message formulaire web et portail de contact',
  'fr',
  'form',
  NULL,
  'Bonjour,

Dans le cadre du processus d''admission sur la place de marché {platform_name}, nous souhaitons authentifier l''attestation délivrée par votre organisme :

- Entreprise : {producer_name}
- Référence de certification : {certificate_number}
- Référentiel audité : {standard_name}
- Date de fin de validité : {expiry_date}
- Justificatif fourni : {verification_url}

Merci de bien vouloir nous certifier la validité de ce titre.
Service Audit {platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'verification_url', 'expiry_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (8) CANAL FORMULAIRE - Generic Web Portal Message (English)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Generic Web Portal Verification Message',
  'en',
  'form',
  NULL,
  'Dear Support Team,

In connection with our vendor verification process on {platform_name}, we request formal validation of the certificate issued under your accreditation:

- Entity Name: {producer_name}
- Certificate ID: {certificate_number}
- Scheme / Standard: {standard_name}
- Declared Expiration: {expiry_date}
- Document Link: {verification_url}

Kindly confirm whether this record is authentic and active.
Audit Department — {platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'verification_url', 'expiry_date', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (9) CANAL API - Requête technique standardisée (Français)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Payload de requête technique API de vérification',
  'fr',
  'api',
  NULL,
  '{
  "request_type": "certificate_standing_lookup",
  "requester": "{platform_name} Audit Service",
  "producer_name": "{producer_name}",
  "certificate_number": "{certificate_number}",
  "standard_name": "{standard_name}",
  "issuing_body": "{body_name}",
  "issue_date": "{issue_date}",
  "expiry_date": "{expiry_date}",
  "document_url": "{verification_url}"
}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'issue_date', 'expiry_date', 'verification_url', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (10) CANAL API - API Verification Technical Payload (English)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'API Verification Technical JSON Payload',
  'en',
  'api',
  NULL,
  '{
  "action": "verify_certificate_status",
  "platform": "{platform_name}",
  "query": {
    "holder": "{producer_name}",
    "certificate_id": "{certificate_number}",
    "standard": "{standard_name}",
    "certifier": "{body_name}",
    "valid_until": "{expiry_date}",
    "evidence_uri": "{verification_url}"
  }
}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'expiry_date', 'verification_url', 'platform_name'],
  true,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (11) CANAL EMAIL - Relance après 7 jours sans réponse (Français)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Relance après 7 jours sans réponse',
  'fr',
  'email',
  'RELANCE : Demande de vérification de certification — {standard_name} — {producer_name}',
  'Madame, Monsieur,

Nous nous permettons de revenir vers vous concernant notre précédente demande de vérification de certification transmise il y a quelques jours pour le producteur suivant :

• Producteur : {producer_name}
• N° de certificat : {certificate_number}
• Standard : {standard_name}
• Organisme émetteur : {body_name}
• Expiration : {expiry_date}
• Document transmis : {verification_url}

Le dossier du producteur étant en attente de validation finale sur la plateforme {platform_name}, pourriez-vous nous confirmer rapidement si ce certificat est bien authentique et en vigueur ?

Nous vous remercions chaleureusement pour votre réactivité.

Bien cordialement,

L''Équipe d''Audit & Conformité
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
  false,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;

-- (12) CANAL EMAIL - Follow-up after 7 days without response (English)
INSERT INTO certification_message_templates (
  title, language, channel, subject, body, variables, is_default, version
) VALUES (
  'Follow-up after 7 days without response',
  'en',
  'email',
  'FOLLOW-UP: Certificate Status Verification Request — {standard_name} — {producer_name}',
  'Dear Certification Support Team,

We are following up on our previous inquiry regarding the standing of certificate #{certificate_number} issued to {producer_name}.

Details of the certificate under verification:
• Entity Name: {producer_name}
• Certificate Reference: {certificate_number}
• Certification Standard: {standard_name}
• Issuing Authority: {body_name}
• Declared Expiry Date: {expiry_date}
• Access Link: {verification_url}

As this supplier is currently undergoing our onboarding compliance review on {platform_name}, your prompt validation would be greatly appreciated.

Thank you in advance for your assistance.

Best regards,

Compliance & Audit Team
{platform_name}',
  ARRAY['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
  false,
  1
) ON CONFLICT (title, language, channel) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_default = EXCLUDED.is_default;
