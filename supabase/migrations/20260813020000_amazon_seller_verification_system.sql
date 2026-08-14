-- ==============================================================================
-- ETHIMARKET — SCRIPT SQL COMPLET SÉCURISÉ & AUTO-RÉPARATEUR
-- Ce script ajoute la colonne `is_admin` manquante avant d'exécuter les politiques RLS.
-- ==============================================================================

-- 1. S'assurer que la colonne is_admin existe dans profiles
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Étendre la table producers avec les champs de vérification Amazon / Bureau Veritas
ALTER TABLE IF EXISTS producers 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

-- Index pour accélérer les recherches et filtres
CREATE INDEX IF NOT EXISTS idx_producers_verification_status ON producers(verification_status);
CREATE INDEX IF NOT EXISTS idx_producers_submitted_at ON producers(submitted_at);

-- 3. Table des notifications administrateur
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  user_id UUID,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sécurité RLS pour admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_notifications" ON admin_notifications;
CREATE POLICY "admins_read_notifications" ON admin_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "producers_insert_notifications" ON admin_notifications;
CREATE POLICY "producers_insert_notifications" ON admin_notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 4. Table de l'historique des vérifications et audits
CREATE TABLE IF NOT EXISTS verification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  admin_id UUID,
  reason TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sécurité RLS pour verification_history
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_history" ON verification_history;
CREATE POLICY "admins_read_history" ON verification_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "producers_read_own_history" ON verification_history;
CREATE POLICY "producers_read_own_history" ON verification_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM producers WHERE producers.id = verification_history.producer_id AND producers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "authenticated_insert_history" ON verification_history;
CREATE POLICY "authenticated_insert_history" ON verification_history
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 5. Attribution des droits administrateur
UPDATE profiles 
SET is_admin = true 
WHERE email = 'bayahubert@yahoo.com';
