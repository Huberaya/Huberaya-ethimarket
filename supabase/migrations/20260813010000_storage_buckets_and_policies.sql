-- Migration for Professional Storage Buckets and Policies

-- 1. Insert Buckets into storage.buckets if not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('farm-photos', 'farm-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-photos', 'product-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('organization-logos', 'organization-logos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('organization-banners', 'organization-banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('team-photos', 'team-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('identity-documents', 'identity-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('certifications', 'certifications', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('business-documents', 'business-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('lab-analyses', 'lab-analyses', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Storage Policies for Public Buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read for public storage buckets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read for public storage buckets" ON storage.objects
      FOR SELECT USING (
        bucket_id IN (
          'profile-photos', 'farm-photos', 'product-photos',
          'organization-logos', 'organization-banners', 'team-photos', 'verifications', 'products'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Auth read for private storage buckets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Auth read for private storage buckets" ON storage.objects
      FOR SELECT USING (
        bucket_id IN ('identity-documents', 'certifications', 'business-documents', 'lab-analyses')
        AND auth.uid() IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Owner insert for storage objects' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owner insert for storage objects" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Owner update for storage objects' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owner update for storage objects" ON storage.objects
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Owner delete for storage objects' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owner delete for storage objects" ON storage.objects
      FOR DELETE USING (
        auth.uid() IS NOT NULL
      );
  END IF;
END $$;
