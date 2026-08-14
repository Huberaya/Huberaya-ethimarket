/*
# Create profiles table

The handle_new_user() trigger and the frontend auth code both
reference a `profiles` table that was never created. This caused
every signup to silently fail the profile insert, so users saw
"Profil producteur non trouvé" in the dashboard.

1. New Table
- `profiles`
  - id (uuid, PK, matches auth.users.id)
  - email (text, not null)
  - full_name (text, nullable)
  - company (text, nullable)
  - phone (text, nullable)
  - role (text, default 'buyer')
  - avatar_url (text, nullable)
  - created_at (timestamptz, default now())

2. Security
- RLS enabled.
- Owner-scoped CRUD: each authenticated user can only access their own row.
- SELECT also allowed for anon/authenticated so public profile lookups work.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company text,
  phone text,
  role text DEFAULT 'buyer',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
