-- VIBE Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable PostGIS and pgcrypto for UUIDs
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Storage buckets (idempotent)
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('message_images','message_images', true) on conflict do nothing;

-- Tables
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  geom geography(Point, 4326) not null,
  updated_at timestamptz default now()
);

create table if not exists public.presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text check (status in ('now','5min','away')) default 'away',
  updated_at timestamptz default now()
);

create table if not exists public.vibes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text check (status in ('sent','matched')) default 'sent',
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('text','image')) not null,
  content text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.message_reads (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (conversation_id, user_id, message_id)
);

-- Functions
create or replace function public.get_nearby_users(lat double precision, lon double precision, meters int)
returns table (
  user_id uuid,
  name text,
  avatar_url text,
  approx_distance_m int,
  presence text,
  last_online timestamptz
) language sql security definer as $$
  with src as (
    select ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography as g
  ), q as (
    select p.user_id, p.name, p.avatar_url,
      round(ST_Distance(ul.geom, (select g from src)))::int as d,
      pr.status as presence, ul.updated_at
    from user_locations ul
    join profiles p on p.user_id = ul.user_id
    left join presence pr on pr.user_id = ul.user_id
    where ul.updated_at > now() - interval '10 minutes'
  )
  select user_id, name, avatar_url,
    case when d < 75 then 50 when d < 150 then 100 when d < 300 then 250 when d < 500 then 400 else 500 end as approx_distance_m,
    coalesce(presence, 'away') as presence,
    updated_at as last_online
  from q where d <= meters order by d asc;
$$;

create or replace function public.update_my_location(lat double precision, lon double precision)
returns void language plpgsql security definer as $$
begin
  insert into user_locations (user_id, geom, updated_at)
  values (auth.uid(), ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, now())
  on conflict (user_id) do update set geom = excluded.geom, updated_at = now();
end $$;

create or replace function public.enforce_daily_vibe_limit()
returns trigger language plpgsql security definer as $$
begin
  if (select count(*) from vibes where sender_id = new.sender_id and created_at::date = current_date) >= 20 then
    raise exception 'Daily vibe limit reached';
  end if;
  return new;
end $$;

drop trigger if exists vibes_limit on public.vibes;
create trigger vibes_limit before insert on public.vibes for each row execute function public.enforce_daily_vibe_limit();

create or replace function public.handle_mutual_vibe()
returns trigger language plpgsql security definer as $$
declare convo uuid;
begin
  if exists (select 1 from vibes v where v.receiver_id = new.sender_id and v.sender_id = new.receiver_id) then
    insert into conversations default values returning id into convo;
    insert into conversation_participants (conversation_id, user_id)
      values (convo, new.sender_id), (convo, new.receiver_id);
    update vibes set status = 'matched'
      where (sender_id = new.sender_id and receiver_id = new.receiver_id)
         or (sender_id = new.receiver_id and receiver_id = new.sender_id);
  end if;
  return new;
end $$;

drop trigger if exists vibe_mutual on public.vibes;
create trigger vibe_mutual after insert on public.vibes for each row execute function public.handle_mutual_vibe();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_locations enable row level security;
alter table public.presence enable row level security;
alter table public.vibes enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;

-- Profiles
create policy profiles_read_all on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for insert with check (auth.uid() = user_id);
create policy profiles_upsert_own on public.profiles for update using (auth.uid() = user_id);

-- Locations (no direct select; only upsert own)
create policy locations_upsert_own on public.user_locations for insert with check (auth.uid() = user_id);
create policy locations_update_own on public.user_locations for update using (auth.uid() = user_id);
create policy locations_no_select on public.user_locations for select using (false);

-- Presence (update own)
create policy presence_upsert_own on public.presence for insert with check (auth.uid() = user_id);
create policy presence_update_own on public.presence for update using (auth.uid() = user_id);
create policy presence_read_all on public.presence for select using (true);

-- Vibes
create policy vibes_insert on public.vibes for insert with check (auth.uid() = sender_id and auth.uid() <> receiver_id);
create policy vibes_select_parties on public.vibes for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Conversations/participants
create policy conv_select_participant on public.conversations for select using (
  exists (select 1 from conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
);
create policy conv_participants_select on public.conversation_participants for select using (user_id = auth.uid());

-- Messages
create policy messages_select_participant on public.messages for select using (
  exists (
    select 1 from conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  )
);

-- Public read on storage.objects for these buckets
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read avatars'
  ) then
    execute 'create policy "Public read avatars" on storage.objects for select using (bucket_id = ''avatars'')';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read message_images'
  ) then
    execute 'create policy "Public read message_images" on storage.objects for select using (bucket_id = ''message_images'')';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Upload avatars'
  ) then
    execute 'create policy "Upload avatars" on storage.objects for insert to authenticated with check (bucket_id = ''avatars'')';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Upload message_images'
  ) then
    execute 'create policy "Upload message_images" on storage.objects for insert to authenticated with check (bucket_id = ''message_images'')';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Update own file'
  ) then
    execute 'create policy "Update own file" on storage.objects for update to authenticated using (owner = auth.uid())';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Delete own file'
  ) then
    execute 'create policy "Delete own file" on storage.objects for delete to authenticated using (owner = auth.uid())';
  end if;
end $$;

create policy messages_insert_in_range on public.messages for insert with check (
  exists (
    select 1 from conversation_participants me
    join conversation_participants you on you.conversation_id = me.conversation_id and you.user_id <> me.user_id
    join user_locations a on a.user_id = me.user_id
    join user_locations b on b.user_id = you.user_id
    where me.conversation_id = messages.conversation_id
      and me.user_id = auth.uid()
      and a.updated_at > now() - interval '3 minutes'
      and b.updated_at > now() - interval '3 minutes'
      and ST_Distance(a.geom, b.geom) <= 1000
  )
);

-- Send vibe RPC with duplicate prevention
create or replace function public.send_vibe(target_id uuid)
returns void language plpgsql security definer as $$
begin
  if target_id = auth.uid() then
    raise exception 'Cannot send vibe to yourself';
  end if;
  if exists (
    select 1 from vibes v
    where v.sender_id = auth.uid() and v.receiver_id = target_id and v.created_at::date = current_date
  ) then
    return; -- already sent today
  end if;
  insert into vibes(sender_id, receiver_id) values (auth.uid(), target_id);
end $$;

-- Helpful index for distance queries
create index if not exists user_locations_geom_idx on public.user_locations using gist((geom::geometry));

-- Fetch conversation id between me and target (if any)
create or replace function public.get_conversation_with(target_id uuid)
returns uuid language sql security definer as $$
  select c.id from conversations c
  join conversation_participants a on a.conversation_id = c.id and a.user_id = auth.uid()
  join conversation_participants b on b.conversation_id = c.id and b.user_id = target_id
  limit 1
$$;
