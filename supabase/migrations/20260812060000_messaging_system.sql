-- Table conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES auth.users(id),
  participant_2 UUID REFERENCES auth.users(id),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count_1 INTEGER DEFAULT 0,
  unread_count_2 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies conversations
DROP POLICY IF EXISTS "Users see own conversations" ON conversations;
CREATE POLICY "Users see own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

DROP POLICY IF EXISTS "Users create conversations" ON conversations;
CREATE POLICY "Users create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1);

DROP POLICY IF EXISTS "Users update own conversations" ON conversations;
CREATE POLICY "Users update own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- Policies messages
DROP POLICY IF EXISTS "Users see conversation messages" ON messages;
CREATE POLICY "Users see conversation messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users update own messages" ON messages;
CREATE POLICY "Users update own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users upload chat files" ON storage.objects;
CREATE POLICY "Authenticated users upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "Users read chat files" ON storage.objects;
CREATE POLICY "Users read chat files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-files');
