-- VIBE Clean Database Setup Script
-- This script safely handles existing resources and creates only what's missing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create storage buckets (safe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('message_images', 'message_images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create tables (safe)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('now','5min','away')) DEFAULT 'away',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vibes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('sent','matched')) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('text','image')) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_reads (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id, message_id)
);

-- Create functions (safe)
CREATE OR REPLACE FUNCTION public.get_nearby_users(lat DOUBLE PRECISION, lon DOUBLE PRECISION, meters INT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  approx_distance_m INT,
  presence TEXT,
  last_online TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER AS $$
  WITH src AS (
    SELECT ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography AS g
  ), q AS (
    SELECT p.user_id, p.name, p.avatar_url,
      ROUND(ST_Distance(ul.geom, (SELECT g FROM src)))::int AS d,
      pr.status AS presence, ul.updated_at
    FROM user_locations ul
    JOIN profiles p ON p.user_id = ul.user_id
    LEFT JOIN presence pr ON pr.user_id = ul.user_id
    WHERE ul.updated_at > NOW() - INTERVAL '10 minutes'
  )
  SELECT user_id, name, avatar_url,
    CASE WHEN d < 75 THEN 50 WHEN d < 150 THEN 100 WHEN d < 300 THEN 250 WHEN d < 500 THEN 400 ELSE 500 END AS approx_distance_m,
    COALESCE(presence, 'away') AS presence,
    updated_at AS last_online
  FROM q WHERE d <= meters ORDER BY d ASC;
$$;

CREATE OR REPLACE FUNCTION public.update_my_location(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to update location';
  END IF;
  
  INSERT INTO user_locations (user_id, geom, updated_at)
  VALUES (auth.uid(), ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, NOW())
  ON CONFLICT (user_id) DO UPDATE SET geom = EXCLUDED.geom, updated_at = NOW();
END $$;

CREATE OR REPLACE FUNCTION public.send_vibe(target_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot send vibe to yourself';
  END IF;
  IF EXISTS (
    SELECT 1 FROM vibes v
    WHERE v.sender_id = auth.uid() AND v.receiver_id = target_id AND v.created_at::date = CURRENT_DATE
  ) THEN
    RETURN; -- already sent today
  END IF;
  INSERT INTO vibes(sender_id, receiver_id) VALUES (auth.uid(), target_id);
END $$;

CREATE OR REPLACE FUNCTION public.get_conversation_with(target_id UUID)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT c.id FROM conversations c
  JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = auth.uid()
  JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = target_id
  LIMIT 1
$$;

-- Create triggers (safe)
CREATE OR REPLACE FUNCTION public.enforce_daily_vibe_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM vibes WHERE sender_id = NEW.sender_id AND created_at::date = CURRENT_DATE) >= 20 THEN
    RAISE EXCEPTION 'Daily vibe limit reached';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vibes_limit ON public.vibes;
CREATE TRIGGER vibes_limit BEFORE INSERT ON public.vibes FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_vibe_limit();

CREATE OR REPLACE FUNCTION public.handle_mutual_vibe()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE convo UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM vibes v WHERE v.receiver_id = NEW.sender_id AND v.sender_id = NEW.receiver_id) THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO convo;
    INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (convo, NEW.sender_id), (convo, NEW.receiver_id);
    UPDATE vibes SET status = 'matched'
      WHERE (sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
         OR (sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS vibe_mutual ON public.vibes;
CREATE TRIGGER vibe_mutual AFTER INSERT ON public.vibes FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_vibe();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe)
DROP POLICY IF EXISTS profiles_read_all ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_upsert_own ON public.profiles;
DROP POLICY IF EXISTS locations_upsert_own ON public.user_locations;
DROP POLICY IF EXISTS locations_update_own ON public.user_locations;
DROP POLICY IF EXISTS locations_no_select ON public.user_locations;
DROP POLICY IF EXISTS presence_upsert_own ON public.presence;
DROP POLICY IF EXISTS presence_update_own ON public.presence;
DROP POLICY IF EXISTS presence_read_all ON public.presence;
DROP POLICY IF EXISTS vibes_insert ON public.vibes;
DROP POLICY IF EXISTS vibes_select_parties ON public.vibes;
DROP POLICY IF EXISTS conv_select_participant ON public.conversations;
DROP POLICY IF EXISTS conv_participants_select ON public.conversation_participants;
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
DROP POLICY IF EXISTS messages_insert_participant ON public.messages;

-- Create fresh RLS policies
CREATE POLICY profiles_read_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_upsert_own ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY locations_upsert_own ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY locations_update_own ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY locations_no_select ON public.user_locations FOR SELECT USING (false);

CREATE POLICY presence_upsert_own ON public.presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY presence_update_own ON public.presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY presence_read_all ON public.presence FOR SELECT USING (true);

CREATE POLICY vibes_insert ON public.vibes FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() <> receiver_id);
CREATE POLICY vibes_select_parties ON public.vibes FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY conv_select_participant ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
);
CREATE POLICY conv_participants_select ON public.conversation_participants FOR SELECT USING (user_id = auth.uid());

CREATE POLICY messages_select_participant ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY messages_insert_participant ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Drop existing storage policies first (safe)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read message_images" ON storage.objects;
DROP POLICY IF EXISTS "Upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Upload message_images" ON storage.objects;
DROP POLICY IF EXISTS "Update own file" ON storage.objects;
DROP POLICY IF EXISTS "Delete own file" ON storage.objects;

-- Create fresh storage policies
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read message_images" ON storage.objects FOR SELECT USING (bucket_id = 'message_images');
CREATE POLICY "Upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Upload message_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message_images');
CREATE POLICY "Update own file" ON storage.objects FOR UPDATE TO authenticated USING (owner = auth.uid());
CREATE POLICY "Delete own file" ON storage.objects FOR DELETE TO authenticated USING (owner = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_locations_geom_idx ON public.user_locations USING gist((geom::geometry));
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS vibes_sender_id_idx ON public.vibes(sender_id);
CREATE INDEX IF NOT EXISTS vibes_receiver_id_idx ON public.vibes(receiver_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- Enable realtime for tables (safe)
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vibes;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'VIBE database setup completed successfully!';
  RAISE NOTICE 'All tables, functions, policies, and triggers have been created.';
  RAISE NOTICE 'Your VIBE app is now ready to use!';
END $$;
