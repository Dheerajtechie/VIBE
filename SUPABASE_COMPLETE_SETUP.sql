-- VIBE Complete Database Setup Script
-- Run this in your Supabase SQL Editor to set up everything perfectly

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('message_images', 'message_images', true) 
ON CONFLICT (id) DO NOTHING;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_locations table
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create presence table
CREATE TABLE IF NOT EXISTS public.presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('now','5min','away')) DEFAULT 'away',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vibes table
CREATE TABLE IF NOT EXISTS public.vibes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('sent','matched')) DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('text','image')) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message_reads table
CREATE TABLE IF NOT EXISTS public.message_reads (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id, message_id)
);

-- Create functions
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
  INSERT INTO user_locations (user_id, geom, updated_at)
  VALUES (auth.uid(), ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, NOW())
  ON CONFLICT (user_id) DO UPDATE SET geom = EXCLUDED.geom, updated_at = NOW();
END $$;

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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS handling)
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_read_all') THEN
    CREATE POLICY profiles_read_all ON public.profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_upsert_own') THEN
    CREATE POLICY profiles_upsert_own ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Locations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'locations_upsert_own') THEN
    CREATE POLICY locations_upsert_own ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'locations_update_own') THEN
    CREATE POLICY locations_update_own ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_locations' AND policyname = 'locations_no_select') THEN
    CREATE POLICY locations_no_select ON public.user_locations FOR SELECT USING (false);
  END IF;

  -- Presence policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'presence' AND policyname = 'presence_upsert_own') THEN
    CREATE POLICY presence_upsert_own ON public.presence FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'presence' AND policyname = 'presence_update_own') THEN
    CREATE POLICY presence_update_own ON public.presence FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'presence' AND policyname = 'presence_read_all') THEN
    CREATE POLICY presence_read_all ON public.presence FOR SELECT USING (true);
  END IF;

  -- Vibes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vibes' AND policyname = 'vibes_insert') THEN
    CREATE POLICY vibes_insert ON public.vibes FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() <> receiver_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vibes' AND policyname = 'vibes_select_parties') THEN
    CREATE POLICY vibes_select_parties ON public.vibes FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;

  -- Conversations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conv_select_participant') THEN
    CREATE POLICY conv_select_participant ON public.conversations FOR SELECT USING (
      EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'conv_participants_select') THEN
    CREATE POLICY conv_participants_select ON public.conversation_participants FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_select_participant') THEN
    CREATE POLICY messages_select_participant ON public.messages FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
      )
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_insert_participant') THEN
    CREATE POLICY messages_insert_participant ON public.messages FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM conversation_participants cp 
        WHERE cp.conversation_id = messages.conversation_id 
        AND cp.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Storage policies (with IF NOT EXISTS handling)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read avatars') THEN
    CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read message_images') THEN
    CREATE POLICY "Public read message_images" ON storage.objects FOR SELECT USING (bucket_id = 'message_images');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Upload avatars') THEN
    CREATE POLICY "Upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Upload message_images') THEN
    CREATE POLICY "Upload message_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message_images');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Update own file') THEN
    CREATE POLICY "Update own file" ON storage.objects FOR UPDATE TO authenticated USING (owner = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Delete own file') THEN
    CREATE POLICY "Delete own file" ON storage.objects FOR DELETE TO authenticated USING (owner = auth.uid());
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_locations_geom_idx ON public.user_locations USING gist((geom::geometry));
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS vibes_sender_id_idx ON public.vibes(sender_id);
CREATE INDEX IF NOT EXISTS vibes_receiver_id_idx ON public.vibes(receiver_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NULL);
  RETURN NEW;
END $$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Enable realtime for tables (with error handling)
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'VIBE database setup completed successfully!';
  RAISE NOTICE 'All tables, functions, policies, and triggers have been created.';
  RAISE NOTICE 'Your VIBE app is now ready to use!';
END $$;
