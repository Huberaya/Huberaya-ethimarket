-- ==============================================================================
-- ETHIMARKET — BASE DE DONNÉES MONDIALE DES ORGANISMES DE CERTIFICATION
-- Migration 20260813030000_create_certification_bodies.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS certification_bodies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT NOT NULL,
  verification_url TEXT,
  verification_instructions TEXT,
  description TEXT,
  headquarters_country TEXT,
  coverage TEXT[],
  certification_types TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE certification_bodies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cert_bodies" ON certification_bodies;
CREATE POLICY "public_read_cert_bodies" ON certification_bodies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_cert_bodies" ON certification_bodies;
CREATE POLICY "admin_manage_cert_bodies" ON certification_bodies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

-- DONNÉES À INSÉRER : 30+ ORGANISMES MONDIAUX
INSERT INTO certification_bodies 
(name, short_name, website, verification_url, verification_instructions, 
 description, headquarters_country, coverage, certification_types, 
 contact_email) VALUES

-- EUROPE
('Ecocert SA', 'Ecocert', 'https://www.ecocert.com', 
 'https://certificat.ecocert.com', 
 'Entrez le numéro de certificat sur certificat.ecocert.com pour vérifier sa validité.',
 'Organisme de certification bio leader mondial, fondé en 1991.',
 'France', 
 ARRAY['Mondial', 'Europe', 'Afrique', 'Asie', 'Amérique'],
 ARRAY['Bio', 'EU Organic', 'Cosmétique bio', 'Textile bio', 'Commerce équitable'],
 'info@ecocert.com'),

('Bureau Veritas Certification', 'Bureau Veritas', 'https://www.bureauveritas.fr',
 'https://certification.bureauveritas.com/verification',
 'Utilisez le portail de vérification Bureau Veritas avec le numéro de certificat.',
 'Leader mondial en certification, inspection et audit.',
 'France',
 ARRAY['Mondial'],
 ARRAY['ISO 9001', 'ISO 14001', 'FSSC 22000', 'Bio', 'RSE'],
 'certification@bureauveritas.com'),

('AFNOR Certification', 'AFNOR', 'https://certification.afnor.org',
 'https://certification.afnor.org/recherche-certificat',
 'Recherchez le certificat sur le portail AFNOR Certification.',
 'Association française de normalisation.',
 'France',
 ARRAY['France', 'Europe', 'Afrique francophone'],
 ARRAY['NF', 'ISO', 'Bio AB'],
 'certification@afnor.org'),

('Control Union Certifications', 'Control Union', 'https://www.controlunion.com',
 'https://www.controlunion.com/certificate-database',
 'Recherchez dans la base de données des certificats Control Union.',
 'Organisme néerlandais de certification durable.',
 'Pays-Bas',
 ARRAY['Mondial', 'Europe', 'Asie', 'Afrique'],
 ARRAY['Bio', 'GOTS', 'GlobalG.A.P.', 'UTZ', 'Rainforest Alliance'],
 'info@controlunion.com'),

('SGS SA', 'SGS', 'https://www.sgs.com',
 'https://www.sgs.com/en/certified-clients-and-products',
 'Vérifiez les clients certifiés SGS via leur portail de recherche.',
 'Société Générale de Surveillance, leader mondial inspection.',
 'Suisse',
 ARRAY['Mondial'],
 ARRAY['ISO', 'HACCP', 'Bio', 'GlobalG.A.P.', 'BRC', 'IFS'],
 'sgs.verification@sgs.com'),

-- COMMERCE ÉQUITABLE
('Fairtrade International', 'Fairtrade', 'https://www.fairtrade.net',
 'https://www.fairtrade.net/about/find-producers',
 'Recherchez le producteur dans la base Fairtrade Producer Search. Entrez le FLO-ID.',
 'Organisation mondiale du commerce équitable, label le plus reconnu.',
 'Allemagne',
 ARRAY['Mondial', 'Afrique', 'Amérique latine', 'Asie'],
 ARRAY['Fairtrade', 'Commerce équitable'],
 'info@fairtrade.net'),

('FLO-CERT', 'FLO-CERT', 'https://www.flocert.net',
 'https://www.flocert.net/about-flocert/customer-search/',
 'Utilisez la recherche FLO-CERT Customer Search avec le nom de l organisme.',
 'Organisme de certification indépendant de Fairtrade.',
 'Allemagne',
 ARRAY['Mondial'],
 ARRAY['Fairtrade'],
 'info@flocert.net'),

('World Fair Trade Organization', 'WFTO', 'https://wfto.com',
 'https://wfto.com/who-we-are#members',
 'Vérifiez si le producteur est membre du WFTO via la liste des membres.',
 'Réseau mondial du commerce équitable.',
 'Pays-Bas',
 ARRAY['Mondial'],
 ARRAY['Commerce équitable', 'WFTO Guarantee System'],
 'info@wfto.com'),

('SPP Global', 'SPP', 'https://spp.coop',
 'https://spp.coop/registre/',
 'Consultez le registre SPP des petits producteurs certifiés.',
 'Symbole des Petits Producteurs, certification pour organisations paysannes.',
 'Mexique',
 ARRAY['Amérique latine', 'Afrique', 'Asie'],
 ARRAY['SPP', 'Commerce équitable petits producteurs'],
 'info@spp.coop'),

-- BIO INTERNATIONAL
('IFOAM Organics International', 'IFOAM', 'https://www.ifoam.bio',
 'https://www.ifoam.bio/our-work/how/standards-certification',
 'IFOAM ne certifie pas directement. Vérifiez via les organismes accrédités listés.',
 'Fédération internationale de l agriculture biologique.',
 'Allemagne',
 ARRAY['Mondial'],
 ARRAY['Bio', 'Agriculture biologique'],
 'headoffice@ifoam.bio'),

('Demeter International', 'Demeter', 'https://www.demeter.net',
 'https://www.demeter.net/find-demeter/',
 'Recherchez les producteurs Demeter certifiés sur le portail Find Demeter.',
 'Certification biodynamique, la plus exigeante du bio.',
 'Allemagne',
 ARRAY['Mondial', 'Europe', 'Amérique', 'Asie'],
 ARRAY['Biodynamie', 'Demeter'],
 'info@demeter.net'),

('Nature & Progrès', 'N&P', 'https://www.natureetprogres.org',
 'https://www.natureetprogres.org/les-professionnels/',
 'Consultez la liste des professionnels certifiés Nature & Progrès.',
 'Association française de promotion de l agriculture bio et biodynamique.',
 'France',
 ARRAY['France'],
 ARRAY['Bio', 'Mention Nature & Progrès'],
 'federation@natureetprogres.org'),

-- DURABILITÉ
('Rainforest Alliance', 'RA', 'https://www.rainforest-alliance.org',
 'https://www.rainforest-alliance.org/find-certified/',
 'Utilisez la recherche Find Certified pour vérifier un producteur Rainforest Alliance.',
 'Organisation de certification pour agriculture durable.',
 'États-Unis',
 ARRAY['Mondial', 'Afrique', 'Amérique latine', 'Asie'],
 ARRAY['Rainforest Alliance Certified', 'UTZ'],
 'info@ra.org'),

('GlobalG.A.P.', 'GlobalGAP', 'https://www.globalgap.org',
 'https://database.globalgap.org/globalgap/search/SearchMain.faces',
 'Recherchez le producteur dans la base de données GLOBALG.A.P.',
 'Standard mondial de bonnes pratiques agricoles.',
 'Allemagne',
 ARRAY['Mondial'],
 ARRAY['GlobalG.A.P.', 'GRASP', 'localg.a.p.'],
 'info@globalgap.org'),

-- AMÉRIQUE
('USDA Organic', 'USDA', 'https://www.usda.gov',
 'https://organic.ams.usda.gov/integrity/',
 'Recherchez dans la base Organic Integrity Database de l USDA.',
 'Certification biologique du Département de l Agriculture des États-Unis.',
 'États-Unis',
 ARRAY['États-Unis', 'Mondial'],
 ARRAY['USDA Organic', 'NOP'],
 'organic@usda.gov'),

('Canada Organic', 'COR', 'https://inspection.canada.ca',
 'https://inspection.canada.ca/organic-products',
 'Vérifiez via l Agence canadienne d inspection des aliments.',
 'Régime biologique canadien.',
 'Canada',
 ARRAY['Canada'],
 ARRAY['Canada Organic', 'COR'],
 'cfia.organic@inspection.gc.ca'),

-- ASIE
('JAS Organic', 'JAS', 'https://www.maff.go.jp',
 'https://www.maff.go.jp/e/policies/standard/jas/',
 'Vérification via le Ministère de l Agriculture japonais.',
 'Japanese Agricultural Standards, certification bio japonaise.',
 'Japon',
 ARRAY['Japon', 'Asie'],
 ARRAY['JAS Organic'],
 NULL),

('India Organic (NPOP)', 'NPOP', 'https://apeda.gov.in',
 'https://apeda.gov.in/apedawebsite/organic/',
 'Vérifiez via le portail APEDA du gouvernement indien.',
 'National Programme for Organic Production, Inde.',
 'Inde',
 ARRAY['Inde', 'Asie du Sud'],
 ARRAY['India Organic', 'NPOP'],
 NULL),

-- AFRIQUE
('Certisys', 'Certisys', 'https://www.certisys.eu',
 'https://www.certisys.eu/fr/rechercher-un-operateur',
 'Recherchez un opérateur certifié sur le portail Certisys.',
 'Organisme de certification bio belge, actif en Afrique.',
 'Belgique',
 ARRAY['Europe', 'Afrique'],
 ARRAY['Bio', 'EU Organic'],
 'info@certisys.eu'),

('IMO Swiss AG', 'IMO', 'https://www.imo.ch',
 NULL,
 'Contactez IMO directement pour vérification.',
 'Institut de Marché Écologique, certifications bio et durables.',
 'Suisse',
 ARRAY['Mondial', 'Afrique', 'Asie'],
 ARRAY['Bio', 'Fair for Life', 'Naturland'],
 'imo@imo.ch'),

('Bio Suisse', 'Bio Suisse', 'https://www.bio-suisse.ch',
 'https://www.bio-suisse.ch/fr/producteurs.php',
 'Recherchez les producteurs certifiés Bio Suisse.',
 'Fédération des producteurs bio suisses, label Bourgeon.',
 'Suisse',
 ARRAY['Suisse', 'Europe'],
 ARRAY['Bio Suisse', 'Bourgeon'],
 'bio@bio-suisse.ch'),

-- QUALITÉ ET SÉCURITÉ ALIMENTAIRE
('BRC Global Standards', 'BRC', 'https://www.brcgs.com',
 'https://brcdirectory.co.uk/',
 'Utilisez le BRC Directory pour rechercher les sites certifiés.',
 'Standards mondiaux de sécurité alimentaire.',
 'Royaume-Uni',
 ARRAY['Mondial'],
 ARRAY['BRC Food Safety', 'BRC Packaging', 'BRC Storage'],
 'enquiries@brcgs.com'),

('IFS Food', 'IFS', 'https://www.ifs-certification.com',
 'https://www.ifs-certification.com/index.php/en/ifs-certified-suppliers',
 'Recherchez les fournisseurs certifiés IFS.',
 'International Featured Standards, sécurité alimentaire.',
 'Allemagne',
 ARRAY['Europe', 'Mondial'],
 ARRAY['IFS Food', 'IFS Logistics', 'IFS Broker'],
 'info@ifs-certification.com'),

('FSSC 22000', 'FSSC', 'https://www.fssc22000.com',
 'https://www.fssc22000.com/certified-organizations/',
 'Recherchez dans la base des organisations certifiées FSSC 22000.',
 'Foundation for Food Safety System Certification.',
 'Pays-Bas',
 ARRAY['Mondial'],
 ARRAY['FSSC 22000', 'Sécurité alimentaire'],
 'info@fssc22000.com'),

-- TEXTILE
('GOTS', 'GOTS', 'https://global-standard.org',
 'https://global-standard.org/find-suppliers-shops/certified-suppliers/',
 'Recherchez les fournisseurs certifiés GOTS dans leur base de données.',
 'Global Organic Textile Standard, textile bio.',
 'Allemagne',
 ARRAY['Mondial'],
 ARRAY['GOTS', 'Textile bio'],
 'info@global-standard.org'),

('OEKO-TEX', 'OEKO-TEX', 'https://www.oeko-tex.com',
 'https://www.oeko-tex.com/en/buying-guide',
 'Vérifiez les labels OEKO-TEX via le Buying Guide.',
 'Association internationale pour la sécurité textile.',
 'Suisse',
 ARRAY['Mondial'],
 ARRAY['OEKO-TEX Standard 100', 'OEKO-TEX Made in Green'],
 'info@oeko-tex.com')

ON CONFLICT DO NOTHING;
