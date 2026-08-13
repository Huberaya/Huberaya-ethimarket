-- Migration: Amazon + Bureau Veritas Verification System
-- Date: 2026-08-13

-- 1. Ensure columns on producers table
ALTER TABLE producers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft';
-- Status options: 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended', 'banned'

ALTER TABLE producers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS rejection_details JSONB DEFAULT '[]';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS last_audit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS next_audit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

-- 2. Create Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'Admins see notifications'
  ) THEN
    CREATE POLICY "Admins see notifications" ON admin_notifications
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'Authenticated users insert notifications'
  ) THEN
    CREATE POLICY "Authenticated users insert notifications" ON admin_notifications
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'Admins update notifications'
  ) THEN
    CREATE POLICY "Admins update notifications" ON admin_notifications
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- 3. Create Verification History Table
CREATE TABLE IF NOT EXISTS verification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  details JSONB DEFAULT '{}',
  documents_reviewed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'verification_history' AND policyname = 'Admins manage history'
  ) THEN
    CREATE POLICY "Admins manage history" ON verification_history
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'verification_history' AND policyname = 'Producers see own history'
  ) THEN
    CREATE POLICY "Producers see own history" ON verification_history
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM producers WHERE id = verification_history.producer_id AND user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'verification_history' AND policyname = 'Producers insert own history'
  ) THEN
    CREATE POLICY "Producers insert own history" ON verification_history
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM producers WHERE id = verification_history.producer_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;
