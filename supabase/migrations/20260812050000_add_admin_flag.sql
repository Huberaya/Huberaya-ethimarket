-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Grant admin role to specified admin email
UPDATE profiles SET is_admin = true WHERE email = 'bayahubert@yahoo.com';
