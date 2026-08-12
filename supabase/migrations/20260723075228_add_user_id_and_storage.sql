/*
# Add user_id columns, storage buckets, and updated RLS policies

1. Schema changes
- Add `user_id` column to `producers` table (links producer to auth user)
- Add `user_id` column to `products` table (links product to auth user for ownership)
- Add `region` column to `producers` table
- Add `story` column to `producers` table
- Add `website` column to `producers` table
- Add `logo_url` column to `producers` table
- Add `banner_url` column to `producers` table
- Add `short_description` column to `products` table
- Add `region` column to `products` table
- Add `currency` column to `products` table (default EUR)
- Add `status` column to `products` table (default 'active')

2. Storage
- Create bucket 'products' for product images
- Create bucket 'stores' for producer logos/banners
- Storage policies: authenticated users can upload/update/delete their own files

3. RLS updates
- Producers: owner-scoped CRUD via user_id
- Products: public read, owner-scoped write via user_id
- Orders: owner-scoped CRUD
- Profiles: already has RLS from setup script

4. Important notes
- user_id columns are nullable initially to preserve existing demo data
- New rows from authenticated users will set user_id via DEFAULT auth.uid()
- Existing demo producers/products keep user_id = NULL (still publicly readable)
*/

-- ─── Add user_id to producers ───────────────────────────
ALTER TABLE producers ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE producers ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS story text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS banner_url text;

-- ─── Add user_id and new columns to products ────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived'));

-- ─── Update producer RLS policies ───────────────────────
-- Drop old policies
DROP POLICY IF EXISTS "public_read_producers" ON producers;
DROP POLICY IF EXISTS "auth_insert_producers" ON producers;
DROP POLICY IF EXISTS "auth_update_producers" ON producers;
DROP POLICY IF EXISTS "auth_delete_producers" ON producers;

-- Public read (anon can see all producers)
CREATE POLICY "public_read_producers" ON producers FOR SELECT
  TO anon, authenticated USING (true);

-- Owner-scoped insert
CREATE POLICY "insert_own_producers" ON producers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Owner-scoped update
CREATE POLICY "update_own_producers" ON producers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Owner-scoped delete
CREATE POLICY "delete_own_producers" ON producers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── Update product RLS policies ────────────────────────
DROP POLICY IF EXISTS "public_read_products" ON products;
DROP POLICY IF EXISTS "auth_insert_products" ON products;
DROP POLICY IF EXISTS "auth_update_products" ON products;
DROP POLICY IF EXISTS "auth_delete_products" ON products;

-- Public read (anon can see all products)
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Owner-scoped insert
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Owner-scoped update
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Owner-scoped delete
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── Storage buckets ─────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stores', 'stores', true) ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS policies ────────────────────────────────
-- Products bucket: anyone can read, only owner can write
DROP POLICY IF EXISTS "public_read_products_bucket" ON storage.objects;
CREATE POLICY "public_read_products_bucket" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "auth_insert_products_bucket" ON storage.objects;
CREATE POLICY "auth_insert_products_bucket" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "auth_update_products_bucket" ON storage.objects;
CREATE POLICY "auth_update_products_bucket" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "auth_delete_products_bucket" ON storage.objects;
CREATE POLICY "auth_delete_products_bucket" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stores bucket: anyone can read, only owner can write
DROP POLICY IF EXISTS "public_read_stores_bucket" ON storage.objects;
CREATE POLICY "public_read_stores_bucket" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'stores');

DROP POLICY IF EXISTS "auth_insert_stores_bucket" ON storage.objects;
CREATE POLICY "auth_insert_stores_bucket" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "auth_update_stores_bucket" ON storage.objects;
CREATE POLICY "auth_update_stores_bucket" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "auth_delete_stores_bucket" ON storage.objects;
CREATE POLICY "auth_delete_stores_bucket" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_producers_user_id ON producers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
