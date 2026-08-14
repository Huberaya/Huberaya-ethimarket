-- ════════════════════════════════════════════════════════════════
-- EthiMarket — Migration Buckets Storage
-- ════════════════════════════════════════════════════════════════

-- 1. Création des buckets de stockage (Storage Buckets)
INSERT INTO storage.buckets (id, name, public) VALUES ('stores', 'stores', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', true) ON CONFLICT (id) DO NOTHING;

-- 2. Politiques de lecture publique (SELECT)
DROP POLICY IF EXISTS "Public Read Access for Stores" ON storage.objects;
CREATE POLICY "Public Read Access for Stores" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'stores');

DROP POLICY IF EXISTS "Public Read Access for Products" ON storage.objects;
CREATE POLICY "Public Read Access for Products" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Public Read Access for Verifications" ON storage.objects;
CREATE POLICY "Public Read Access for Verifications" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'verifications');

-- 3. Politiques d'upload et de modification (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow upload to Stores" ON storage.objects;
CREATE POLICY "Allow upload to Stores" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'stores');

DROP POLICY IF EXISTS "Allow upload to Products" ON storage.objects;
CREATE POLICY "Allow upload to Products" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow upload to Verifications" ON storage.objects;
CREATE POLICY "Allow upload to Verifications" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'verifications');

DROP POLICY IF EXISTS "Allow update to Stores" ON storage.objects;
CREATE POLICY "Allow update to Stores" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'stores');

DROP POLICY IF EXISTS "Allow update to Products" ON storage.objects;
CREATE POLICY "Allow update to Products" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow update to Verifications" ON storage.objects;
CREATE POLICY "Allow update to Verifications" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'verifications');
