-- Migration: Amazon + Bureau Veritas Verification System
-- Date: 2026-08-13

ALTER TABLE producers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS rejection_details JSONB DEFAULT '[]';
ALTER TABLE producers ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS last_audit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS next_audit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE producers ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

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
