-- ==============================================================================
-- ETHIMARKET — MODULE MONDIAL DE VÉRIFICATION DES CERTIFICATIONS PRODUCTEURS
-- Migration : 20260814010000_seed_global_certification_bodies.sql
-- Description : Données de référence mondiales (Afrique, Asie, LatAm, Europe/Intl)
--               Standards internationaux de conformité et contacts institutionnels.
-- ==============================================================================

-- ==============================================================================
-- 0. SÉCURISATION DES TYPES, COLONNES ET CONTRAINTES D'UNICITÉ
-- ==============================================================================

-- 0.1 Création idempotente des types si nécessaires
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

-- 0.2 Alignement des colonnes existantes dans certification_bodies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certification_bodies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'country') THEN
      ALTER TABLE certification_bodies ADD COLUMN country TEXT;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'headquarters_country') THEN
        UPDATE certification_bodies SET country = headquarters_country WHERE country IS NULL;
      END IF;
      UPDATE certification_bodies SET country = 'France' WHERE country IS NULL;
      ALTER TABLE certification_bodies ALTER COLUMN country SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'acronym') THEN
      ALTER TABLE certification_bodies ADD COLUMN acronym TEXT;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'short_name') THEN
        UPDATE certification_bodies SET acronym = short_name WHERE acronym IS NULL;
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'region') THEN
      ALTER TABLE certification_bodies ADD COLUMN region certification_region_enum NOT NULL DEFAULT 'Europe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'sub_region') THEN
      ALTER TABLE certification_bodies ADD COLUMN sub_region TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'email_contact') THEN
      ALTER TABLE certification_bodies ADD COLUMN email_contact TEXT;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'contact_email') THEN
        UPDATE certification_bodies SET email_contact = contact_email WHERE email_contact IS NULL;
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'phone') THEN
      ALTER TABLE certification_bodies ADD COLUMN phone TEXT;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'contact_phone') THEN
        UPDATE certification_bodies SET phone = contact_phone WHERE phone IS NULL;
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'api_endpoint') THEN
      ALTER TABLE certification_bodies ADD COLUMN api_endpoint TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'api_key_required') THEN
      ALTER TABLE certification_bodies ADD COLUMN api_key_required BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'api_key_encrypted') THEN
      ALTER TABLE certification_bodies ADD COLUMN api_key_encrypted TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'whatsapp') THEN
      ALTER TABLE certification_bodies ADD COLUMN whatsapp TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'contact_form_url') THEN
      ALTER TABLE certification_bodies ADD COLUMN contact_form_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'languages') THEN
      ALTER TABLE certification_bodies ADD COLUMN languages TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'trust_level') THEN
      ALTER TABLE certification_bodies ADD COLUMN trust_level trust_level_enum DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'internal_notes') THEN
      ALTER TABLE certification_bodies ADD COLUMN internal_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certification_bodies' AND column_name = 'last_updated_at') THEN
      ALTER TABLE certification_bodies ADD COLUMN last_updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
  END IF;
END $$;

-- 0.3 Contraintes d'unicité
DO $$ 
BEGIN
  -- Contrainte d'unicité sur certification_bodies (name, country)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certification_bodies_name_country_unique'
  ) THEN
    ALTER TABLE certification_bodies 
      ADD CONSTRAINT certification_bodies_name_country_unique UNIQUE (name, country);
  END IF;

  -- Contrainte d'unicité sur certification_standards (name, certification_body_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certification_standards_name_body_unique'
  ) THEN
    ALTER TABLE certification_standards 
      ADD CONSTRAINT certification_standards_name_body_unique UNIQUE (name, certification_body_id);
  END IF;

  -- Contrainte d'unicité sur certification_body_contacts (certification_body_id, email)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certification_body_contacts_body_email_unique'
  ) THEN
    ALTER TABLE certification_body_contacts 
      ADD CONSTRAINT certification_body_contacts_body_email_unique UNIQUE (certification_body_id, email);
  END IF;
END $$;


-- ==============================================================================
-- SECTION 1 : AFRIQUE (21 organismes vérifiés)
-- Sous-régions : Ouest, Est, Nord, Centrale, Australe
-- ==============================================================================

-- 1.1 AFRIQUE DE L'OUEST
INSERT INTO certification_bodies (
  name, acronym, country, region, sub_region, website, verification_url, api_endpoint,
  email_contact, phone, whatsapp, contact_form_url, languages, certification_types,
  trust_level, is_active, internal_notes
) VALUES
(
  'Ecocert Afrique de l''Ouest',
  'ECOCERT SN',
  'Sénégal',
  'Africa',
  'Afrique de l''Ouest',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  NULL,
  'contact.senegal@ecocert.com',
  '+221338604560',
  NULL,
  'https://www.ecocert.com/fr/contact',
  ARRAY['fr', 'en', 'wo'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Branche régionale Afrique de l''Ouest d''Ecocert basée à Dakar. Audits Bio CE, NOP, Fair for Life.'
),
(
  'Ecocert Burkina Faso',
  'ECOCERT BF',
  'Burkina Faso',
  'Africa',
  'Afrique de l''Ouest',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  NULL,
  'contact.burkina@ecocert.com',
  '+22625374465',
  NULL,
  'https://www.ecocert.com/fr/contact',
  ARRAY['fr', 'en'],
  ARRAY['organic', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Antenne certifiant les filières coton bio, karité et sésame équitable en zone sahélienne.'
),
(
  'Bureau Veritas Côte d''Ivoire',
  'BV CI',
  'Côte d''Ivoire',
  'Africa',
  'Afrique de l''Ouest',
  'https://www.bureauveritas.africa/cote-divoire',
  'https://certification.bureauveritas.com/certificate-search',
  NULL,
  'contact.civ@bureauveritas.com',
  '+2252721750000',
  NULL,
  'https://www.bureauveritas.africa/fr/contact',
  ARRAY['fr', 'en'],
  ARRAY['sustainable', 'organic', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Certification majeure des filières cacao durable (Rainforest Alliance, UTZ), café et anacarde à Abidjan.'
),
(
  'Control Union Ghana',
  'CU GH',
  'Ghana',
  'Africa',
  'Afrique de l''Ouest',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'ghana@controlunion.com',
  '+233302780720',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Auditeur de premier plan pour le cacao bio/équitable, fruits tropicaux et huile de palme durable (RSPO).'
),
(
  'Direction de la Protection des Végétaux et du Contrôle de la Qualité (DPVCQ)',
  'DPVCQ',
  'Togo',
  'Africa',
  'Afrique de l''Ouest',
  'https://agriculture.gouv.tg',
  NULL,
  NULL,
  'contact@agriculture.gouv.tg',
  '+22822212356',
  NULL,
  NULL,
  ARRAY['fr'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'pending',
  true,
  'Organisme public togolais d''inspection phytosanitaire et de conformité biologique à l''export.'
),

-- 1.2 AFRIQUE DE L'EST
(
  'AfriCert Limited',
  'AFRICERT',
  'Kenya',
  'Africa',
  'Afrique de l''Est',
  'https://africertlimited.co.ke',
  'https://africertlimited.co.ke/verified-clients',
  NULL,
  'info@africertlimited.co.ke',
  '+254208081635',
  '+254715041339',
  'https://africertlimited.co.ke/contact-us',
  ARRAY['en', 'sw'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Organisme indépendant accrédité ISO 17065 basé à Nairobi. Spécialiste GLOBALG.A.P, Rainforest Alliance, Bio.'
),
(
  'Control Union Africa (Kenya Hub)',
  'CU KE',
  'Kenya',
  'Africa',
  'Afrique de l''Est',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'kenya@controlunion.com',
  '+254203875322',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['en', 'sw'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Hub régional Afrique de l''Est pour thé, café de spécialité, horticulture et épices.'
),
(
  'Kenya Institute of Organic Farming',
  'KIOF',
  'Kenya',
  'Africa',
  'Afrique de l''Est',
  'https://www.kiof.org',
  NULL,
  NULL,
  'info@kiof.org',
  '+254722880480',
  NULL,
  'https://www.kiof.org/contact',
  ARRAY['en', 'sw'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Pionnier historique de la formation et certification biologique paysanne en Afrique orientale.'
),
(
  'Uganda Organic Certification Services',
  'UGOCERT',
  'Ouganda',
  'Africa',
  'Afrique de l''Est',
  'https://www.ugocert.org',
  NULL,
  NULL,
  'info@ugocert.org',
  '+256414269926',
  NULL,
  'https://www.ugocert.org/contact',
  ARRAY['en', 'lg'],
  ARRAY['organic', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Organisme national ougandais accrédité pour l''agriculture biologique et les standards East African Organic (Kilimo Hai).'
),
(
  'Tanzania Organic Certification Association',
  'TanCert',
  'Tanzanie',
  'Africa',
  'Afrique de l''Est',
  'https://www.tancert.co.tz',
  NULL,
  NULL,
  'info@tancert.co.tz',
  '+255232604121',
  NULL,
  NULL,
  ARRAY['en', 'sw'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Association et organisme d''inspection bio tanzanien pour épices de Zanzibar, noix de cajou et café.'
),
(
  'Ethiopian Conformity Assessment Enterprise',
  'ECAE',
  'Éthiopie',
  'Africa',
  'Afrique de l''Est',
  'https://www.ecae.org.et',
  NULL,
  NULL,
  'info@ecae.org.et',
  '+251116671286',
  NULL,
  'https://www.ecae.org.et/contact',
  ARRAY['en', 'am'],
  ARRAY['organic', 'sustainable', 'other']::certification_type_enum[],
  'verified',
  true,
  'Organisme public éthiopien de contrôle qualité et conformité export (café Arabica d''origine, sésame, miel).'
),
(
  'Rwanda Organic Agriculture Movement',
  'ROAM',
  'Rwanda',
  'Africa',
  'Afrique de l''Est',
  'https://www.roam.org.rw',
  NULL,
  NULL,
  'info@roam.org.rw',
  '+250788307274',
  NULL,
  'https://www.roam.org.rw/contact',
  ARRAY['en', 'fr', 'rw'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'pending',
  true,
  'Fédération rwandaise promouvant la certification bio pour les filières thé, café et piments.'
),
(
  'Fairtrade Africa',
  'FTA',
  'Kenya',
  'Africa',
  'Afrique de l''Est',
  'https://fairtradeafrica.net',
  'https://www.flocert.net/solutions/fairtrade-certification/check-a-customer',
  NULL,
  'info@fairtradeafrica.net',
  '+254202721930',
  NULL,
  'https://fairtradeafrica.net/contact-us',
  ARRAY['en', 'fr', 'sw'],
  ARRAY['fair_trade', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Réseau continental des producteurs certifiés Fairtrade en Afrique et Moyen-Orient.'
),

-- 1.3 AFRIQUE DU NORD / MAGHREB
(
  'CCPB Maghreb',
  'CCPB MA',
  'Maroc',
  'Africa',
  'Afrique du Nord',
  'https://www.ccpb.it/fr/maghreb',
  'https://www.ccpb.it/operatori-certificati',
  NULL,
  'ccpbmaghreb@ccpb.it',
  '+212537775588',
  NULL,
  'https://www.ccpb.it/fr/contatti',
  ARRAY['fr', 'ar', 'it'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme agréé au Maroc et en Tunisie pour les huiles d''olive, argan, safran et dattes bio.'
),
(
  'Ecocert Maroc',
  'ECOCERT MA',
  'Maroc',
  'Africa',
  'Afrique du Nord',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  NULL,
  'maroc@ecocert.com',
  '+212522987114',
  NULL,
  'https://www.ecocert.com/fr/contact',
  ARRAY['fr', 'ar'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Filiale Ecocert basée à Casablanca, leader de l''huile d''argan et des agrumes certifiés.'
),
(
  'Centre Technique de l''Agriculture Biologique',
  'CTAB',
  'Tunisie',
  'Africa',
  'Afrique du Nord',
  'http://www.ctab.nat.tn',
  NULL,
  NULL,
  'ctab@iresa.agrinet.tn',
  '+21673327299',
  NULL,
  'http://www.ctab.nat.tn/index.php/fr/contact',
  ARRAY['fr', 'ar'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Autorité technique nationale tunisienne de référence pour l''agriculture biologique et la traçabilité olive/dattes.'
),
(
  'Institut National de la Recherche Agronomique d''Algérie',
  'INRAA',
  'Algérie',
  'Africa',
  'Afrique du Nord',
  'http://www.inraa.dz',
  NULL,
  NULL,
  'contact@inraa.dz',
  '+21323828500',
  NULL,
  NULL,
  ARRAY['fr', 'ar'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'pending',
  true,
  'Établissement public assurant la surveillance des terroirs et labels de qualité en Algérie.'
),

-- 1.4 AFRIQUE CENTRALE & AUSTRALE
(
  'CERES Certification of Environmental Standards South Africa',
  'CERES ZA',
  'Afrique du Sud',
  'Africa',
  'Afrique Australe',
  'https://www.ceres-cert.com',
  'https://www.ceres-cert.com/certified-clients',
  NULL,
  'southafrica@ceres-cert.com',
  '+27218801990',
  NULL,
  'https://www.ceres-cert.com/contact',
  ARRAY['en', 'af'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Bureau sud-africain de CERES (vins biodynamiques, rooibos, fruits de verger, avocat).'
),
(
  'Soil Association South Africa',
  'SA ZA',
  'Afrique du Sud',
  'Africa',
  'Afrique Australe',
  'https://www.soilassociation.org/certification',
  'https://www.soilassociation.org/certification/find-a-licensee',
  NULL,
  'info@soilassociation.org',
  '+441179142406',
  NULL,
  'https://www.soilassociation.org/certification/contact-us',
  ARRAY['en'],
  ARRAY['organic', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Certification biologique internationale pour le rooibos, aloe ferox et super-aliments d''Afrique australe.'
),
(
  'Bureau Veritas Cameroun',
  'BV CM',
  'Cameroun',
  'Africa',
  'Afrique Centrale',
  'https://www.bureauveritas.africa/cameroun',
  'https://certification.bureauveritas.com/certificate-search',
  NULL,
  'contact.cameroun@bureauveritas.com',
  '+237233425255',
  NULL,
  'https://www.bureauveritas.africa/fr/contact',
  ARRAY['fr', 'en'],
  ARRAY['sustainable', 'organic', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Pôle Afrique Centrale pour le bois responsable (FSC/PEFC), cacao durable et poivre de Penja IGP.'
),
(
  'SGS South Africa',
  'SGS ZA',
  'Afrique du Sud',
  'Africa',
  'Afrique Australe',
  'https://www.sgs.co.za',
  'https://www.sgs.com/en/certified-clients-and-products',
  NULL,
  'za.info@sgs.com',
  '+27118001000',
  NULL,
  'https://www.sgs.co.za/en/contact-us',
  ARRAY['en'],
  ARRAY['sustainable', 'organic', 'ethical', 'other']::certification_type_enum[],
  'verified',
  true,
  'Audits de sécurité sanitaire BRCGS, GlobalG.A.P et chaînes d''approvisionnement agricoles.'
)
ON CONFLICT (name, country) 
DO UPDATE SET 
  last_updated_at = now(),
  trust_level = EXCLUDED.trust_level,
  website = COALESCE(EXCLUDED.website, certification_bodies.website),
  email_contact = COALESCE(EXCLUDED.email_contact, certification_bodies.email_contact),
  phone = COALESCE(EXCLUDED.phone, certification_bodies.phone),
  verification_url = COALESCE(EXCLUDED.verification_url, certification_bodies.verification_url);


-- ==============================================================================
-- SECTION 2 : ASIE (20 organismes vérifiés)
-- Sous-régions : Asie du Sud, Asie du Sud-Est, Asie de l'Est
-- ==============================================================================

INSERT INTO certification_bodies (
  name, acronym, country, region, sub_region, website, verification_url, api_endpoint,
  email_contact, phone, whatsapp, contact_form_url, languages, certification_types,
  trust_level, is_active, internal_notes
) VALUES
-- 2.1 ASIE DU SUD
(
  'Agricultural and Processed Food Products Export Development Authority',
  'APEDA - NPOP',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://apeda.gov.in',
  'https://tracenet.gov.in/TraceNet',
  NULL,
  'headq@apeda.gov.in',
  '+911126513204',
  NULL,
  'https://apeda.gov.in/apedawebsite/contact_us.htm',
  ARRAY['en', 'hi'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Autorité étatique indienne tutrice du programme NPOP (National Programme for Organic Production) et du système TraceNet.'
),
(
  'Indian Organic Certification Agency',
  'INDOCERT',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://www.indocert.org',
  'https://www.indocert.org/client-directory',
  NULL,
  'info@indocert.org',
  '+914842922610',
  '+919447192610',
  'https://www.indocert.org/contact',
  ARRAY['en', 'hi', 'ml'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme accrédité ISO 17065 pour NPOP, NOP USDA, Bio UE, Fairtrade et UTZ (thé, épices du Kerala, riz basmati).'
),
(
  'OneCert International Asia',
  'ONECERT',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://www.onecert.com',
  'https://www.onecert.com/certified-operations',
  NULL,
  'info@onecertasia.in',
  '+911412771020',
  NULL,
  'https://www.onecert.com/contact-us',
  ARRAY['en', 'hi'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Organisme de premier plan à Jaipur pour coton bio (GOTS), sucre de canne, épices et herbes ayurvédiques.'
),
(
  'Aditi Organic Certifications Pvt. Ltd.',
  'ADITI',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://www.aditicert.net',
  'https://www.aditicert.net/certified-clients',
  NULL,
  'aditi@aditicert.net',
  '+918023607994',
  NULL,
  'https://www.aditicert.net/contact',
  ARRAY['en', 'hi', 'kn'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme accrédité à Bangalore pour NPOP, NOP, Bio UE, GLOBALG.A.P, Jaivik Bharat.'
),
(
  'Control Union Certifications India',
  'CU IN',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'mumbai@controlunion.com',
  '+912261294200',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['en', 'hi', 'mr'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Bureau de Mumbai, auditeur majeur textile biologique GOTS, thé de Darjeeling et café de spécialité.'
),
(
  'Sri Lanka Organic Agriculture Movement',
  'SLOAM',
  'Sri Lanka',
  'Asia',
  'Asie du Sud',
  'https://www.lankaorganic.com',
  NULL,
  NULL,
  'info@lankaorganic.com',
  '+94112879500',
  NULL,
  'https://www.lankaorganic.com/contact',
  ARRAY['en', 'si', 'ta'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme certifiant le thé de Ceylan bio, cannelle véritable, noix de coco et poivre noir.'
),
(
  'Fairtrade Network of Asia & Pacific Producers',
  'Fairtrade NAPP',
  'Inde',
  'Asia',
  'Asie du Sud',
  'https://www.fairtradenapp.org',
  'https://www.flocert.net/solutions/fairtrade-certification/check-a-customer',
  NULL,
  'connect@fairtradenapp.org',
  '+918041530260',
  NULL,
  'https://www.fairtradenapp.org/contact',
  ARRAY['en', 'hi'],
  ARRAY['fair_trade', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Réseau Fairtrade coordonnant les producteurs de thé, café, sucre et fruits d''Asie-Pacifique.'
),

-- 2.2 ASIE DU SUD-EST
(
  'Organic Agriculture Certification Thailand',
  'ACT TH',
  'Thaïlande',
  'Asia',
  'Asie du Sud-Est',
  'https://www.actorganic-cert.or.th',
  'https://www.actorganic-cert.or.th/search-certified-operators',
  NULL,
  'info@actorganic-cert.or.th',
  '+6629852077',
  NULL,
  'https://www.actorganic-cert.or.th/contact',
  ARRAY['en', 'th'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme thaïlandais accrédité IFOAM & Bio UE pour le riz au jasmin biologique, fruits exotiques et herbes.'
),
(
  'Lembaga Sertifikasi Organik Seloliman',
  'LESOS',
  'Indonésie',
  'Asia',
  'Asie du Sud-Est',
  'https://www.lesosindonesia.com',
  'https://www.lesosindonesia.com/klien-tersertifikasi',
  NULL,
  'lesos.indonesia@gmail.com',
  '+623216855140',
  NULL,
  'https://www.lesosindonesia.com/kontak',
  ARRAY['id', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Premier organisme pionnier de certification biologique en Indonésie (riz, sucre de coco, café de Sumatra).'
),
(
  'BIOCert Indonesia',
  'BIOCERT ID',
  'Indonésie',
  'Asia',
  'Asie du Sud-Est',
  'https://biocert.co.id',
  'https://biocert.co.id/verified-directory',
  NULL,
  'contact@biocert.co.id',
  '+622518357476',
  NULL,
  'https://biocert.co.id/contact-us',
  ARRAY['id', 'en'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Organisme indonésien spécialisé pour le café bio, cacao, épices des Moluques et vanille.'
),
(
  'Organic Certification Center of the Philippines',
  'OCCP',
  'Philippines',
  'Asia',
  'Asie du Sud-Est',
  'https://www.occp.org.ph',
  NULL,
  NULL,
  'info@occp.org.ph',
  '+63284266001',
  NULL,
  'https://www.occp.org.ph/contact-us',
  ARRAY['en', 'tl'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme officiel philippin pour les bananes, sucre muscovado bio et huile de coco vierge.'
),
(
  'Control Union Vietnam',
  'CU VN',
  'Vietnam',
  'Asia',
  'Asie du Sud-Est',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'vietnam@controlunion.com',
  '+842862816118',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['vi', 'en'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Auditeur de premier ordre au Vietnam pour le poivre noir, la noix de cajou, le café Robusta et le riz bio.'
),
(
  'Vietnam Organic Agriculture Association',
  'VOAA',
  'Vietnam',
  'Asia',
  'Asie du Sud-Est',
  'https://www.hiephoidanongnghiephuuco.vn',
  NULL,
  NULL,
  'vanphong@hiephoidanongnghiephuuco.vn',
  '+842437624488',
  NULL,
  NULL,
  ARRAY['vi', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'pending',
  true,
  'Association nationale vietnamienne pour la certification participative (PGS) et les labels bio locaux.'
),
(
  'SIRIM QAS International',
  'SIRIM',
  'Malaisie',
  'Asia',
  'Asie du Sud-Est',
  'https://www.sirim-qas.com.my',
  'https://www.sirim-qas.com.my/certified-directory',
  NULL,
  'qas_marketing@sirim.my',
  '+60355446400',
  NULL,
  'https://www.sirim-qas.com.my/contact-us',
  ARRAY['en', 'ms'],
  ARRAY['sustainable', 'organic', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Autorité malaisienne de certification qualité, sécurité alimentaire et huile de palme durable (MSPO).'
),

-- 2.3 ASIE DE L'EST & CENTRALE
(
  'Japan Organic and Natural Foods Association',
  'JONA',
  'Japon',
  'Asia',
  'Asie de l''Est',
  'https://www.jona-japan.org',
  'https://www.jona-japan.org/certified-list',
  NULL,
  'jonajapan@jona-japan.org',
  '+81335381851',
  NULL,
  'https://www.jona-japan.org/inquiry',
  ARRAY['ja', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme accrédité majeur pour le label Organic JAS au Japon (thé Matcha, riz, soja et miso bio).'
),
(
  'China Organic Food Certification Center',
  'COFCC',
  'Chine',
  'Asia',
  'Asie de l''Est',
  'http://www.cofcc.org.cn',
  'http://food.cnca.cn',
  NULL,
  'cofcc@cofcc.org.cn',
  '+861062122266',
  NULL,
  'http://www.cofcc.org.cn/contact',
  ARRAY['zh', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Centre officiel de certification des aliments biologiques en Chine sous tutelle du Ministère de l''Agriculture.'
),
(
  'China Quality Certification Centre',
  'CQC',
  'Chine',
  'Asia',
  'Asie de l''Est',
  'https://www.cqc.com.cn',
  'https://www.cqc.com.cn/www/english/certificatequery',
  NULL,
  'service@cqc.com.cn',
  '+861083886666',
  NULL,
  'https://www.cqc.com.cn/www/english/contactus',
  ARRAY['zh', 'en'],
  ARRAY['organic', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Plus grand organisme de certification en Chine (GAP, Bio, sécurité sanitaire et responsabilité sociale).'
),
(
  'Control Union Certifications Japan',
  'CU JP',
  'Japon',
  'Asia',
  'Asie de l''Est',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'japan@controlunion.com',
  '+81357656620',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['ja', 'en'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Auditeur accrédité JAS, Bio UE, NOP et normes de durabilité marine/agricole à Tokyo.'
),
(
  'Center for Ecological Certification (ECOCERT China)',
  'ECOCERT CN',
  'Chine',
  'Asia',
  'Asie de l''Est',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  NULL,
  'info.china@ecocert.com',
  '+861065181180',
  NULL,
  'https://www.ecocert.com/zh-CN/home',
  ARRAY['zh', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Filiale chinoise d''Ecocert basée à Pékin pour les filières thé vert, champignons séchés et baies de goji.'
),
(
  'Central Asian Organic Certification Body',
  'ECO-CERT KZ',
  'Kazakhstan',
  'Asia',
  'Asie Centrale',
  'https://organic.gov.kz',
  NULL,
  NULL,
  'info@organic.gov.kz',
  '+77172558830',
  NULL,
  NULL,
  ARRAY['ru', 'kk', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'pending',
  true,
  'Organisme public d''Asie Centrale assurant la certification des céréales biologiques et du lin exporté vers l''Europe.'
)
ON CONFLICT (name, country) 
DO UPDATE SET 
  last_updated_at = now(),
  trust_level = EXCLUDED.trust_level,
  website = COALESCE(EXCLUDED.website, certification_bodies.website),
  email_contact = COALESCE(EXCLUDED.email_contact, certification_bodies.email_contact),
  phone = COALESCE(EXCLUDED.phone, certification_bodies.phone),
  verification_url = COALESCE(EXCLUDED.verification_url, certification_bodies.verification_url);


-- ==============================================================================
-- SECTION 3 : AMÉRIQUE LATINE (20 organismes vérifiés)
-- Sous-régions : Amérique du Sud, Amérique Centrale & Caraïbes
-- ==============================================================================

INSERT INTO certification_bodies (
  name, acronym, country, region, sub_region, website, verification_url, api_endpoint,
  email_contact, phone, whatsapp, contact_form_url, languages, certification_types,
  trust_level, is_active, internal_notes
) VALUES
-- 3.1 AMÉRIQUE DU SUD
(
  'IBD Certificações',
  'IBD',
  'Brésil',
  'Latin America',
  'Amérique du Sud',
  'https://www.ibd.com.br',
  'https://www.ibd.com.br/consulta-certificados',
  NULL,
  'ibd@ibd.com.br',
  '+551438119800',
  '+5514997789800',
  'https://www.ibd.com.br/fale-conosco',
  ARRAY['pt', 'es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Plus grand certificateur biologique et équitable d''Amérique Latine. Agréé IFOAM, USDA NOP, Bio UE, Demeter (café, açaí, soja, sucre).'
),
(
  'Ecocert Brasil',
  'ECOCERT BR',
  'Brésil',
  'Latin America',
  'Amérique du Sud',
  'https://www.ecocert.com/pt-BR',
  'https://certificats.ecocert.com',
  NULL,
  'contato.brasil@ecocert.com',
  '+554832328860',
  NULL,
  'https://www.ecocert.com/pt-BR/contato',
  ARRAY['pt', 'es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Filiale Ecocert à Florianópolis certifiant café, agrumes, noix du Brésil et canne à sucre.'
),
(
  'Organización Internacional Agropecuaria',
  'OIA',
  'Argentine',
  'Latin America',
  'Amérique du Sud',
  'https://www.oia.com.ar',
  'https://www.oia.com.ar/operadores-certificados',
  NULL,
  'oia@oia.com.ar',
  '+541147934344',
  '+5491136458000',
  'https://www.oia.com.ar/contacto',
  ARRAY['es', 'en', 'pt'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Organisme argentin leader accrédité SENASA, NOP, UE pour céréales bio, yerba maté, miel, vin et poires/pommes.'
),
(
  'Servicio Nacional de Sanidad y Calidad Agroalimentaria',
  'SENASA',
  'Argentine',
  'Latin America',
  'Amérique du Sud',
  'https://www.argentina.gob.ar/senasa',
  'https://aps2.senasa.gov.ar/organico',
  NULL,
  'organico@senasa.gob.ar',
  '+541141215000',
  NULL,
  'https://www.argentina.gob.ar/senasa/contacto',
  ARRAY['es'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Autorité sanitaire et réglementaire nationale argentine garante du système de conformité biologique équivalent UE.'
),
(
  'Bio Latina',
  'BIO LATINA',
  'Pérou',
  'Latin America',
  'Amérique du Sud',
  'https://www.biolatina.com',
  'https://www.biolatina.com/operadores-certificados',
  NULL,
  'administracion@biolatina.com',
  '+5114457490',
  NULL,
  'https://www.biolatina.com/contacto',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Certificateur latino-américain spécialisé pour le café Arabica d''altitude, le cacao Criollo, le quinoa et la maca.'
),
(
  'Control Union Peru',
  'CU PE',
  'Pérou',
  'Latin America',
  'Amérique du Sud',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'lima@controlunion.com',
  '+5117190400',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Hub andin pour la certification du café, cacao fin d''arôme, quinoa royal et super-fruits péruviens.'
),
(
  'CERES Ecuador & Latin America',
  'CERES EC',
  'Équateur',
  'Latin America',
  'Amérique du Sud',
  'https://www.ceres-cert.com',
  'https://www.ceres-cert.com/certified-clients',
  NULL,
  'ecuador@ceres-cert.com',
  '+59322238490',
  NULL,
  'https://www.ceres-cert.com/contact',
  ARRAY['es', 'en', 'de'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Bureau équatorien pour bananes bio, cacao Nacional d''Arriba, fleurs équitables et crevettes durables.'
),
(
  'Kiwa BCS Öko-Garantie Colombia',
  'KIWA BCS CO',
  'Colombie',
  'Latin America',
  'Amérique du Sud',
  'https://www.kiwa.com/co/es',
  'https://www.kiwa.com/en/service/organic-farming',
  NULL,
  'colombia@kiwa.com',
  '+5717448830',
  NULL,
  'https://www.kiwa.com/co/es/contacto',
  ARRAY['es', 'en'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Auditeur de référence en Colombie pour le café doux lavé, l''huile de palme biologique et les panela bio.'
),
(
  'Instituto Colombiano Agropecuario',
  'ICA',
  'Colombie',
  'Latin America',
  'Amérique du Sud',
  'https://www.ica.gov.co',
  'https://www.ica.gov.co/servicios-linea/certificados',
  NULL,
  'contactenos@ica.gov.co',
  '+576013323700',
  NULL,
  'https://www.ica.gov.co/contacto',
  ARRAY['es'],
  ARRAY['sustainable', 'organic', 'other']::certification_type_enum[],
  'verified',
  true,
  'Organisme public colombien régissant les protocoles d''exportation agricole et les Bonnes Pratiques Agricoles (BPA).'
),
(
  'CERES Bolivia',
  'CERES BO',
  'Bolivie',
  'Latin America',
  'Amérique du Sud',
  'https://www.ceres-cert.com',
  'https://www.ceres-cert.com/certified-clients',
  NULL,
  'bolivia@ceres-cert.com',
  '+59144485320',
  NULL,
  'https://www.ceres-cert.com/contact',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Spécialiste de la certification du quinoa royal de l''Altiplano, café biologique des Yungas et noix d''Amazonie.'
),
(
  'IMO Control Latinoamérica',
  'IMO LA',
  'Bolivie',
  'Latin America',
  'Amérique du Sud',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  NULL,
  'contacto.bolivia@ecocert.com',
  '+59144288000',
  NULL,
  'https://www.ecocert.com/es/contacto',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Membre du groupe Ecocert, certificateur historique Fair for Life et Bio en Bolivie et pays voisins.'
),

-- 3.2 AMÉRIQUE CENTRALE & CARAÏBES
(
  'Mayacert S.A.',
  'MAYACERT',
  'Guatemala',
  'Latin America',
  'Amérique Centrale',
  'https://www.mayacert.com',
  'https://www.mayacert.com/operadores-certificados',
  NULL,
  'info@mayacert.com',
  '+50224424600',
  '+50255108890',
  'https://www.mayacert.com/contactanos',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Organisme pionnier en Amérique Centrale (Guatemala, Honduras, Nicaragua, Salvador) pour le café d''ombre et la cardamome.'
),
(
  'Certificadora Mexicana de Comercio Justo y Orgánico',
  'CERTIMEX',
  'Mexique',
  'Latin America',
  'Amérique Centrale',
  'https://www.certimex.org',
  'https://www.certimex.org/operadores-certificados',
  NULL,
  'certimex@certimex.org',
  '+529515202680',
  '+529511254300',
  'https://www.certimex.org/contacto',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Organisme mexicain né des coopératives paysannes de café du Chiapas et Oaxaca (Bio UE, NOP, SPP, Fairtrade).'
),
(
  'OCIA International Mexico',
  'OCIA MX',
  'Mexique',
  'Latin America',
  'Amérique Centrale',
  'https://www.ocia.org',
  'https://www.ocia.org/find-certified-clients',
  NULL,
  'mexico@ocia.org',
  '+524422291240',
  NULL,
  'https://www.ocia.org/contact',
  ARRAY['es', 'en'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organic Crop Improvement Association, acteur majeur au Mexique pour café, avocat Hass bio et mangues.'
),
(
  'PrimusGFS Americas (Azzule Systems)',
  'PRIMUSGFS',
  'Mexique',
  'Latin America',
  'Amérique Centrale',
  'https://primusgfs.com',
  'https://primusgfs.com/audit-search',
  NULL,
  'support@primusgfs.com',
  '+526688194000',
  NULL,
  'https://primusgfs.com/contact',
  ARRAY['es', 'en'],
  ARRAY['sustainable', 'other']::certification_type_enum[],
  'verified',
  true,
  'Standard de sécurité sanitaire et bonnes pratiques reconnu GFSI, omniprésent en maraîchage d''exportation.'
),
(
  'Eco-LOGICA',
  'ECO-LOGICA',
  'Costa Rica',
  'Latin America',
  'Amérique Centrale',
  'https://www.eco-logica.com',
  'https://www.eco-logica.com/clientes-certificados',
  NULL,
  'info@eco-logica.com',
  '+50622976676',
  NULL,
  'https://www.eco-logica.com/contacto',
  ARRAY['es', 'en'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Premier organisme national accrédité au Costa Rica pour ananas bio, bananes, café et canne à sucre.'
),
(
  'Rainforest Alliance Latin America (San José Hub)',
  'R-ALLIANCE CR',
  'Costa Rica',
  'Latin America',
  'Amérique Centrale',
  'https://www.rainforest-alliance.org',
  'https://www.rainforest-alliance.org/find-certified-farms-and-products',
  NULL,
  'info@ra.org',
  '+50622164900',
  NULL,
  'https://www.rainforest-alliance.org/contact',
  ARRAY['es', 'en'],
  ARRAY['sustainable', 'ethical', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Siège des opérations agricoles de Rainforest Alliance pour l''Amérique Centrale et du Sud (banane, café, cacao).'
),
(
  'Coordinadora Latinoamericana de Comercio Justo',
  'CLAC Fairtrade',
  'El Salvador',
  'Latin America',
  'Amérique Centrale',
  'https://clac-comerciojusto.org',
  'https://www.flocert.net/solutions/fairtrade-certification/check-a-customer',
  NULL,
  'info@clac-comerciojusto.org',
  '+50322089400',
  NULL,
  'https://clac-comerciojusto.org/contacto',
  ARRAY['es', 'en', 'pt'],
  ARRAY['fair_trade', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Réseau représentant plus de 1000 organisations de petits producteurs certifiés Fairtrade en Amérique Latine et Caraïbes.'
),
(
  'Caribbean Agricultural Research & Development Institute',
  'CARDI',
  'Trinité-et-Tobago',
  'Latin America',
  'Caraïbes',
  'https://www.cardi.org',
  NULL,
  NULL,
  'info@cardi.org',
  '+18686451205',
  NULL,
  'https://www.cardi.org/contact-us',
  ARRAY['en', 'fr'],
  ARRAY['sustainable', 'organic']::certification_type_enum[],
  'verified',
  true,
  'Institution caribéenne pour le développement agricole, traçabilité et validation des filières cacao fin Trinitario.'
),
(
  'Control Union Central America',
  'CU CR',
  'Costa Rica',
  'Latin America',
  'Amérique Centrale',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'costarica@controlunion.com',
  '+50622830880',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['es', 'en'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Bureau régional pour la certification biologique et équitable en Amérique Centrale.'
)
ON CONFLICT (name, country) 
DO UPDATE SET 
  last_updated_at = now(),
  trust_level = EXCLUDED.trust_level,
  website = COALESCE(EXCLUDED.website, certification_bodies.website),
  email_contact = COALESCE(EXCLUDED.email_contact, certification_bodies.email_contact),
  phone = COALESCE(EXCLUDED.phone, certification_bodies.phone),
  verification_url = COALESCE(EXCLUDED.verification_url, certification_bodies.verification_url);


-- ==============================================================================
-- SECTION 4 : INTERNATIONAL & EUROPE (16 organismes mondiaux de référence)
-- ==============================================================================

INSERT INTO certification_bodies (
  name, acronym, country, region, sub_region, website, verification_url, api_endpoint,
  email_contact, phone, whatsapp, contact_form_url, languages, certification_types,
  trust_level, is_active, internal_notes
) VALUES
(
  'Ecocert SA',
  'ECOCERT SA',
  'France',
  'Europe',
  'Europe de l''Ouest',
  'https://www.ecocert.com',
  'https://certificats.ecocert.com',
  'https://api.ecocert.com/v1/verify',
  'contact@ecocert.com',
  '+33562071101',
  NULL,
  'https://www.ecocert.com/fr/contact',
  ARRAY['fr', 'en', 'es', 'de'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Siège mondial d''Ecocert à L''Isle-Jourdain (France). Leader mondial historique de la certification biologique.'
),
(
  'Control Union Certifications B.V.',
  'CONTROL UNION',
  'Pays-Bas',
  'Europe',
  'Europe de l''Ouest',
  'https://www.controlunion.com',
  'https://www.controlunion.com/certified-clients',
  NULL,
  'certifications@controlunion.com',
  '+31384260100',
  NULL,
  'https://www.controlunion.com/contact',
  ARRAY['en', 'nl', 'fr', 'es'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Siège mondial à Zwolle (Pays-Bas). Présent dans plus de 80 pays pour l''agriculture, le textile (GOTS) et la foresterie.'
),
(
  'Bureau Veritas Certification',
  'BUREAU VERITAS',
  'France',
  'Europe',
  'Europe de l''Ouest',
  'https://certification.bureauveritas.fr',
  'https://certification.bureauveritas.com/certificate-search',
  NULL,
  'contact.certification@bureauveritas.com',
  '+33155247000',
  NULL,
  'https://certification.bureauveritas.fr/contact',
  ARRAY['fr', 'en', 'es'],
  ARRAY['sustainable', 'organic', 'ethical', 'other']::certification_type_enum[],
  'verified',
  true,
  'Siège mondial à Paris La Défense. Auditeur mondial ISO, IFS, BRCGS, Rainforest Alliance, Bio.'
),
(
  'SGS Société Générale de Surveillance SA',
  'SGS SA',
  'Suisse',
  'Europe',
  'Europe de l''Ouest',
  'https://www.sgs.com',
  'https://www.sgs.com/en/certified-clients-and-products',
  NULL,
  'info@sgs.com',
  '+41227399111',
  NULL,
  'https://www.sgs.com/en/contact-us',
  ARRAY['en', 'fr', 'de', 'es'],
  ARRAY['sustainable', 'ethical', 'organic', 'other']::certification_type_enum[],
  'verified',
  true,
  'Siège mondial à Genève. Leader mondial de l''inspection, du contrôle, de l''analyse et de la certification.'
),
(
  'Soil Association Certification Ltd',
  'SOIL ASSOC',
  'Royaume-Uni',
  'Europe',
  'Europe du Nord',
  'https://www.soilassociation.org/certification',
  'https://www.soilassociation.org/certification/find-a-licensee',
  NULL,
  'info@soilassociation.org',
  '+441179142406',
  NULL,
  'https://www.soilassociation.org/certification/contact-us',
  ARRAY['en'],
  ARRAY['organic', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme britannique de référence certifiant plus de 70% du marché biologique au Royaume-Uni et à l''international.'
),
(
  'CERES GmbH - Certification of Environmental Standards',
  'CERES DE',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.ceres-cert.com',
  'https://www.ceres-cert.com/certified-clients',
  NULL,
  'ceres@ceres-cert.com',
  '+499151966920',
  NULL,
  'https://www.ceres-cert.com/contact',
  ARRAY['de', 'en', 'es', 'fr'],
  ARRAY['organic', 'fair_trade', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Siège allemand à Happurg. Spécialiste mondial de la certification biologique UE, NOP, JAS, GlobalG.A.P.'
),
(
  'Kiwa BCS Öko-Garantie GmbH',
  'KIWA BCS',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.kiwa.com/de/de',
  'https://www.kiwa.com/en/service/organic-farming',
  NULL,
  'de.info.bcs@kiwa.com',
  '+49911424390',
  NULL,
  'https://www.kiwa.com/de/de/kontakt',
  ARRAY['de', 'en', 'es'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Premier organisme de contrôle biologique en Allemagne, pionnier en Amérique Latine et Afrique.'
),
(
  'FLOCERT GmbH',
  'FLOCERT',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.flocert.net',
  'https://www.flocert.net/solutions/fairtrade-certification/check-a-customer',
  'https://api.flocert.net/v1/verify',
  'info@flocert.net',
  '+4922824930',
  NULL,
  'https://www.flocert.net/contact-us',
  ARRAY['en', 'de', 'fr', 'es', 'pt'],
  ARRAY['fair_trade', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisme d''audit et de certification exclusif et mondial pour le label Fairtrade International (siège à Bonn).'
),
(
  'Fairtrade International',
  'FAIRTRADE INTL',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.fairtrade.net',
  'https://www.flocert.net/solutions/fairtrade-certification/check-a-customer',
  NULL,
  'info@fairtrade.net',
  '+49228949230',
  NULL,
  'https://www.fairtrade.net/contact',
  ARRAY['en', 'de', 'es', 'fr'],
  ARRAY['fair_trade', 'ethical', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Organisation internationale établissant les standards du commerce équitable (Fairtrade Standards).'
),
(
  'Rainforest Alliance International',
  'RAINFOREST ALLIANCE',
  'Pays-Bas',
  'Europe',
  'Europe de l''Ouest',
  'https://www.rainforest-alliance.org',
  'https://www.rainforest-alliance.org/find-certified-farms-and-products',
  NULL,
  'info@ra.org',
  '+31205308000',
  NULL,
  'https://www.rainforest-alliance.org/contact',
  ARRAY['en', 'nl', 'es', 'fr', 'pt'],
  ARRAY['sustainable', 'ethical', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Siège européen à Amsterdam (fusionné avec UTZ Certified). Standard d''agriculture durable pour café, thé, cacao, fruits.'
),
(
  'Demeter-International e.V. (Biodynamic Federation)',
  'DEMETER',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://demeter.net',
  'https://demeter.net/database',
  NULL,
  'info@demeter.net',
  '+49615584290',
  NULL,
  'https://demeter.net/contact',
  ARRAY['en', 'de', 'es', 'fr'],
  ARRAY['organic', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Seule organisation mondiale certifiant l''agriculture biodynamique selon les normes les plus exigeantes.'
),
(
  'Naturland - Association for Organic Agriculture',
  'NATURLAND',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.naturland.de',
  'https://www.naturland.de/en/naturland/certified-companies',
  NULL,
  'naturland@naturland.de',
  '+49898980820',
  NULL,
  'https://www.naturland.de/en/contact',
  ARRAY['de', 'en', 'es'],
  ARRAY['organic', 'fair_trade', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Standard biologique international exigeant intégrant des critères sociaux stricts et un label Naturland Fair.'
),
(
  'IFOAM Organics International',
  'IFOAM',
  'Allemagne',
  'Europe',
  'Europe de l''Ouest',
  'https://www.ifoam.bio',
  'https://www.ifoam.bio/our-members',
  NULL,
  'contact@ifoam.bio',
  '+492289265010',
  NULL,
  'https://www.ifoam.bio/contact-us',
  ARRAY['en', 'de', 'es', 'fr'],
  ARRAY['organic', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Fédération internationale des mouvements d''agriculture biologique (cadre des normes mondiales et accréditations IOAS).'
),
(
  'Bioagricert S.r.l.',
  'BIOAGRICERT',
  'Italie',
  'Europe',
  'Europe du Sud',
  'https://www.bioagricert.org',
  'https://www.bioagricert.org/clienti-certificati',
  NULL,
  'info@bioagricert.org',
  '+39051562158',
  NULL,
  'https://www.bioagricert.org/contatti',
  ARRAY['it', 'en', 'es', 'fr'],
  ARRAY['organic', 'sustainable', 'fair_trade']::certification_type_enum[],
  'verified',
  true,
  'Organisme italien de contrôle et de certification bio et équitable très actif en Méditerranée, Asie et Amérique Latine.'
),
(
  'Istituto per la Certificazione Etica ed Ambientale',
  'ICEA',
  'Italie',
  'Europe',
  'Europe du Sud',
  'https://icea.bio',
  'https://icea.bio/aziende-certificate',
  NULL,
  'icea@icea.bio',
  '+39051272986',
  NULL,
  'https://icea.bio/contatti',
  ARRAY['it', 'en'],
  ARRAY['organic', 'sustainable', 'ethical']::certification_type_enum[],
  'verified',
  true,
  'Institut de référence en Italie pour les cosmétiques naturels, le bio et la responsabilité sociétale d''entreprise.'
),
(
  'Quality Assurance International',
  'QAI',
  'États-Unis',
  'North America',
  'Amérique du Nord',
  'https://www.qai-inc.com',
  'https://www.qai-inc.com/find-certified-products',
  NULL,
  'qai@qai-inc.com',
  '+18587923531',
  NULL,
  'https://www.qai-inc.com/contact-us',
  ARRAY['en', 'es'],
  ARRAY['organic', 'sustainable']::certification_type_enum[],
  'verified',
  true,
  'Certificateur majeur américain accrédité USDA NOP, Bio UE, COR Mexique et Canada.'
)
ON CONFLICT (name, country) 
DO UPDATE SET 
  last_updated_at = now(),
  trust_level = EXCLUDED.trust_level,
  website = COALESCE(EXCLUDED.website, certification_bodies.website),
  email_contact = COALESCE(EXCLUDED.email_contact, certification_bodies.email_contact),
  phone = COALESCE(EXCLUDED.phone, certification_bodies.phone),
  verification_url = COALESCE(EXCLUDED.verification_url, certification_bodies.verification_url);


-- ==============================================================================
-- SECTION 5 : STANDARDS DE CERTIFICATION (18 standards majeurs mondiaux)
-- ==============================================================================

-- Insertion liée aux IDs des organismes via sous-requête SELECT
INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Règlement Biologique Européen (UE) 2018/848',
  'EU-ORGANIC',
  'organic'::certification_type_enum,
  'Norme européenne officielle régissant la production, la transformation, l''étiquetage et le contrôle des produits biologiques importés dans l''Union Européenne.',
  'International',
  'Union Européenne & Pays Tiers'
FROM certification_bodies 
WHERE name = 'Ecocert SA' AND country = 'France'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'USDA National Organic Program (NOP)',
  'USDA-NOP',
  'organic'::certification_type_enum,
  'Programme réglementaire fédéral des États-Unis établissant les normes nationales pour les produits agricoles biologiques.',
  'International',
  'États-Unis & Mondial'
FROM certification_bodies 
WHERE name = 'Quality Assurance International' AND country = 'États-Unis'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Japanese Agricultural Standard for Organic Plants (Organic JAS)',
  'JAS-ORGANIC',
  'organic'::certification_type_enum,
  'Standard officiel japonais pour la certification des végétaux et produits transformés biologiques.',
  'National & Export',
  'Japon & Partenaires commerciaux'
FROM certification_bodies 
WHERE name = 'Japan Organic and Natural Foods Association' AND country = 'Japon'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Fairtrade International Small-scale Producer Organizations Standard',
  'FAIRTRADE-SPO',
  'fair_trade'::certification_type_enum,
  'Standard de commerce équitable garantissant le Prix Minimum Fairtrade et la Prime de Développement pour les coopératives de petits producteurs.',
  'International',
  'Afrique, Asie, Amérique Latine'
FROM certification_bodies 
WHERE name = 'FLOCERT GmbH' AND country = 'Allemagne'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Fair for Life - Social & Fair Trade Standard',
  'FAIR-FOR-LIFE',
  'fair_trade'::certification_type_enum,
  'Standard de commerce équitable et de filières responsables garantissant transparence, prix rémunérateurs et respect des droits humains.',
  'International',
  'Mondial'
FROM certification_bodies 
WHERE name = 'Ecocert SA' AND country = 'France'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Rainforest Alliance Sustainable Agriculture Standard 2020',
  'RA-2020',
  'sustainable'::certification_type_enum,
  'Norme holistique axée sur la biodiversité, la préservation des forêts, le climat et les droits des travailleurs agricoles.',
  'International',
  'Pays tropicaux et subtropicaux'
FROM certification_bodies 
WHERE name = 'Rainforest Alliance International' AND country = 'Pays-Bas'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Demeter Biodynamic Agriculture Standard',
  'DEMETER-STD',
  'organic'::certification_type_enum,
  'Cahier des charges le plus strict pour l''agriculture biodynamique, régénération des sols et respect des cycles cosmiques et du vivant.',
  'International',
  'Mondial'
FROM certification_bodies 
WHERE name = 'Demeter-International e.V. (Biodynamic Federation)' AND country = 'Allemagne'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Naturland Organic & Fair Standards',
  'NATURLAND-FAIR',
  'organic'::certification_type_enum,
  'Normes biologiques complétées par des exigences sociales strictes et un engagement équitable direct avec les producteurs.',
  'International',
  'Allemagne & Mondial'
FROM certification_bodies 
WHERE name = 'Naturland - Association for Organic Agriculture' AND country = 'Allemagne'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Soil Association Organic Standards',
  'SOIL-ASSOC-STD',
  'organic'::certification_type_enum,
  'Normes de référence britanniques dépassant les minimas légaux européens en matière de bien-être animal et d''environnement.',
  'Régional & International',
  'Royaume-Uni & Pays producteurs'
FROM certification_bodies 
WHERE name = 'Soil Association Certification Ltd' AND country = 'Royaume-Uni'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Global Standard for Textile - GOTS',
  'GOTS-TEXTILE',
  'sustainable'::certification_type_enum,
  'Référence mondiale pour les textiles biologiques, intégrant critères écologiques et sociaux tout au long de la chaîne d''approvisionnement.',
  'International',
  'Mondial (Inde, Turquie, Pérou, Afrique)'
FROM certification_bodies 
WHERE name = 'Control Union Certifications B.V.' AND country = 'Pays-Bas'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Símbolo de Pequeños Productores (SPP)',
  'SPP-SYMBOL',
  'fair_trade'::certification_type_enum,
  'Premier label de commerce équitable 100% gouverné et initié par les organisations de petits producteurs du Sud.',
  'International',
  'Amérique Latine, Afrique, Asie'
FROM certification_bodies 
WHERE name = 'Certificadora Mexicana de Comercio Justo y Orgánico' AND country = 'Mexique'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'National Programme for Organic Production (NPOP India)',
  'NPOP-INDIA',
  'organic'::certification_type_enum,
  'Standard officiel de la République d''Inde avec équivalence de reconnaissance avec l''UE et la Suisse.',
  'National & Export',
  'Inde'
FROM certification_bodies 
WHERE name = 'Agricultural and Processed Food Products Export Development Authority' AND country = 'Inde'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'IBD Organic Standard Brazil & Demeter',
  'IBD-ORGANIC',
  'organic'::certification_type_enum,
  'Cahier des charges certifié pour l''agriculture biologique tropicale brésilienne et l''exportation internationale.',
  'National & International',
  'Brésil & Amérique du Sud'
FROM certification_bodies 
WHERE name = 'IBD Certificações' AND country = 'Brésil'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'East African Organic Products Standard (Kilimo Hai)',
  'EAOPS-KILIMOHAI',
  'organic'::certification_type_enum,
  'Standard régional harmonisé pour l''Afrique de l''Est (Kenya, Ouganda, Tanzanie, Rwanda, Burundi).',
  'Régional',
  'Afrique de l''Est'
FROM certification_bodies 
WHERE name = 'AfriCert Limited' AND country = 'Kenya'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'Ecocert ESR (Équitable, Solidaire, Responsable)',
  'ECOCERT-ESR',
  'fair_trade'::certification_type_enum,
  'Cahier des charges pour les filières équitables Nord-Sud et locales responsables.',
  'International',
  'Mondial'
FROM certification_bodies 
WHERE name = 'Ecocert SA' AND country = 'France'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'GLOBALG.A.P. Integrated Farm Assurance (IFA)',
  'GLOBALGAP-IFA',
  'sustainable'::certification_type_enum,
  'Standard international majeur de Bonnes Pratiques Agricoles, sécurité alimentaire et bien-être des travailleurs.',
  'International',
  'Mondial (plus de 135 pays)'
FROM certification_bodies 
WHERE name = 'Bureau Veritas Certification' AND country = 'France'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'China Organic Product Standard (GB/T 19630)',
  'CHINA-ORGANIC',
  'organic'::certification_type_enum,
  'Norme nationale chinoise obligatoire pour la commercialisation des produits biologiques en Chine.',
  'National & Export',
  'Chine'
FROM certification_bodies 
WHERE name = 'China Organic Food Certification Center' AND country = 'Chine'
ON CONFLICT (name, certification_body_id) DO NOTHING;

INSERT INTO certification_standards (
  certification_body_id, name, code, type, description, scope, geographic_coverage
)
SELECT 
  id,
  'OIA Organic Standards Argentina',
  'OIA-ARG-STD',
  'organic'::certification_type_enum,
  'Standard certifié pour les productions agricoles, élevages et récoltes sauvages biologiques en Argentine.',
  'National & Export',
  'Argentine & Cône Sud'
FROM certification_bodies 
WHERE name = 'Organización Internacional Agropecuaria' AND country = 'Argentine'
ON CONFLICT (name, certification_body_id) DO NOTHING;


-- ==============================================================================
-- SECTION 6 : CONTACTS INSTITUTIONNELS PUBLICS (12 organismes clés)
-- ==============================================================================

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Service Vérification & Audit de Conformité',
  'Département Vérification Internationale',
  'verification@ecocert.com',
  '+33562071101',
  'fr',
  true,
  'Pôle central pour la validation des attestations et certificats délivrés dans le monde.'
FROM certification_bodies 
WHERE name = 'Ecocert SA' AND country = 'France'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Certifications Customer Service Desk',
  'Service Certification & Traçabilité',
  'certifications@controlunion.com',
  '+31384260100',
  'en',
  true,
  'Guichet de validation des certificats de transaction (TC) et de conformité biologique.'
FROM certification_bodies 
WHERE name = 'Control Union Certifications B.V.' AND country = 'Pays-Bas'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Fairtrade Customer Verification Unit',
  'Département Certification Fairtrade',
  'certification@flocert.net',
  '+4922824930',
  'en',
  true,
  'Service officiel FLOCERT pour la validation des identifiants FLO ID et numéros de licence.'
FROM certification_bodies 
WHERE name = 'FLOCERT GmbH' AND country = 'Allemagne'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Technical Certification & Verification Support',
  'Service Technique et Audits',
  'info@ceres-cert.com',
  '+499151966920',
  'de',
  true,
  'Vérification des numéros de certificats CERES pour l''Afrique et l''Amérique Latine.'
FROM certification_bodies 
WHERE name = 'CERES GmbH - Certification of Environmental Standards' AND country = 'Allemagne'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Client Services & Certification Directorate',
  'Département Certification et Licences',
  'cert@soilassociation.org',
  '+441179142406',
  'en',
  true,
  'Vérification des licences Soil Association Organic.'
FROM certification_bodies 
WHERE name = 'Soil Association Certification Ltd' AND country = 'Royaume-Uni'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Setor de Certificação e Atendimento',
  'Service Conformité & Relations Producteurs',
  'certificacao@ibd.com.br',
  '+551438119800',
  'pt',
  true,
  'Validation des certificats IBD Brésil et Amérique du Sud.'
FROM certification_bodies 
WHERE name = 'IBD Certificações' AND country = 'Brésil'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Unidad de Verificación y Dictamen',
  'Service d''Audit et de Conformité',
  'dictamen@mayacert.com',
  '+50224424600',
  'es',
  true,
  'Service d''attestation pour les coopératives d''Amérique Centrale.'
FROM certification_bodies 
WHERE name = 'Mayacert S.A.' AND country = 'Guatemala'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Certification Department / TraceNet Helpdesk',
  'Service Vérification & Exportation',
  'tracenet@apeda.gov.in',
  '+911126513204',
  'en',
  true,
  'Support officiel de validation des certificats NPOP TraceNet Inde.'
FROM certification_bodies 
WHERE name = 'Agricultural and Processed Food Products Export Development Authority' AND country = 'Inde'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Organic Audit and Certification Desk',
  'Service Audit & Certification',
  'certification@indocert.org',
  '+914842922610',
  'en',
  true,
  'Point de contact direct pour les vérifications INDOCERT.'
FROM certification_bodies 
WHERE name = 'Indian Organic Certification Agency' AND country = 'Inde'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Standards & Verification Operations',
  'Département Audit Afrique',
  'audit@africertlimited.co.ke',
  '+254208081635',
  'en',
  true,
  'Vérification des producteurs certifiés en Afrique de l''Est et Centrale.'
FROM certification_bodies 
WHERE name = 'AfriCert Limited' AND country = 'Kenya'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Bureau Régional Afrique de l''Ouest',
  'Pôle Audit & Certification Afrique de l''Ouest',
  'senegal@ecocert.com',
  '+221338604560',
  'fr',
  true,
  'Antenne de Dakar pour l''Afrique de l''Ouest francophone et anglophone.'
FROM certification_bodies 
WHERE name = 'Ecocert Afrique de l''Ouest' AND country = 'Sénégal'
ON CONFLICT (certification_body_id, email) DO NOTHING;

INSERT INTO certification_body_contacts (
  certification_body_id, name, role, email, phone, language, is_primary, notes
)
SELECT 
  id,
  'Departamento de Certificación Orgánica',
  'Service Certification & Traçabilité Cône Sud',
  'certificaciones@oia.com.ar',
  '+541147934344',
  'es',
  true,
  'Validation officielle des opérateurs et numéros de lots OIA Argentine.'
FROM certification_bodies 
WHERE name = 'Organización Internacional Agropecuaria' AND country = 'Argentine'
ON CONFLICT (certification_body_id, email) DO NOTHING;
