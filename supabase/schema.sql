-- BroQuest — full database schema for Supabase (Postgres)
-- Run this once in the Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: drops are guarded and policies/functions use create-or-replace.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  display_name      text not null default 'Bro',
  nickname          text,
  nickname_color    text not null default '#1cb0f6',
  coin_balance      integer not null default 100,
  streak_count      integer not null default 0,
  streak_last_fed   date,
  avatar_look       jsonb not null default
    '{"skin":"#f1c89f","hair":"short","hairColor":"#3a2b1f","acc":"none"}'::jsonb,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- friendships  (bond lives here, per-relationship)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted','declined')),
  bond_level    integer not null default 1,
  bond_xp       integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint friendships_distinct check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- groups (friend circles)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- chats + participants + messages
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.chats (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'direct' check (type in ('direct','group')),
  group_id    uuid references public.groups(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_participants (
  chat_id  uuid not null references public.chats(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (chat_id, user_id)
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null default '',
  quest_id    uuid,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- quest rounds (group random assignment)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.quest_rounds (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','done')),
  assignments jsonb not null default '[]'::jsonb, -- [{ giver, receiver }]
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- quests
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.quests (
  id             uuid primary key default gen_random_uuid(),
  chat_id        uuid references public.chats(id) on delete set null,
  giver_id       uuid not null references public.profiles(id) on delete cascade,
  receiver_id    uuid not null references public.profiles(id) on delete cascade,
  title          text not null default '',
  description    text not null default '',
  status         text not null default 'assigned'
                   check (status in ('assigned','in_progress','submitted','completed','expired')),
  reward_coins   integer not null default 50,
  proof_required boolean not null default false,
  proof_text     text,
  author_mode    text not null default 'manual'
                   check (author_mode in ('manual','ai_assisted','ai_full')),
  category       text not null default 'dare',
  gesture        text not null default 'fist',
  round_id       uuid references public.quest_rounds(id) on delete set null,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index if not exists quests_receiver_idx on public.quests(receiver_id, status);
create index if not exists quests_giver_idx    on public.quests(giver_id, status);
create index if not exists messages_chat_idx   on public.messages(chat_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- cosmetics + inventory
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cosmetics (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('accessory','nickname_color','flame_decoration')),
  name       text not null,
  price      integer not null default 100,
  asset_ref  text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  cosmetic_id  uuid not null references public.cosmetics(id) on delete cascade,
  equipped     boolean not null default false,
  acquired_at  timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: is the current user a participant of a chat?  (avoids RLS recursion)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_chat_participant(p_chat uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_member(p_group uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group and user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- New-user trigger: create a profile row automatically on signup
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Bro'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Bro')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: complete a quest atomically (awards coins + feeds streak + bond xp)
--   Callable by either the receiver (self-complete) or the giver (confirm).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.complete_quest(p_quest uuid)
returns public.quests language plpgsql security definer set search_path = public as $$
declare
  q public.quests;
  today date := (now() at time zone 'utc')::date;
  new_streak integer;
begin
  select * into q from public.quests where id = p_quest for update;
  if not found then raise exception 'quest not found'; end if;
  if auth.uid() <> q.giver_id and auth.uid() <> q.receiver_id then
    raise exception 'not authorized';
  end if;
  if q.status = 'completed' then return q; end if;

  update public.quests
     set status = 'completed', completed_at = now()
   where id = p_quest
   returning * into q;

  -- award coins to receiver
  update public.profiles
     set coin_balance = coin_balance + q.reward_coins
   where id = q.receiver_id;

  -- feed the streak flame for the receiver
  update public.profiles p
     set streak_count = case
           when p.streak_last_fed = today then p.streak_count            -- already fed today
           when p.streak_last_fed = today - 1 then p.streak_count + 1     -- consecutive day
           else 1                                                          -- reset / first feed
         end,
         streak_last_fed = today
   where p.id = q.receiver_id
   returning streak_count into new_streak;

  -- bump bond xp on the friendship between giver & receiver (if any)
  update public.friendships
     set bond_xp = bond_xp + 15,
         bond_level = least(5, bond_level + ((bond_xp + 15) / 150))
   where status = 'accepted'
     and ((requester_id = q.giver_id and addressee_id = q.receiver_id)
       or (requester_id = q.receiver_id and addressee_id = q.giver_id));

  return q;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: buy a cosmetic atomically (checks balance, deducts, grants)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.buy_cosmetic(p_cosmetic uuid)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  c public.cosmetics;
  me public.profiles;
begin
  select * into c from public.cosmetics where id = p_cosmetic;
  if not found then raise exception 'cosmetic not found'; end if;

  select * into me from public.profiles where id = auth.uid() for update;
  if exists (select 1 from public.inventory where user_id = auth.uid() and cosmetic_id = p_cosmetic) then
    raise exception 'already owned';
  end if;
  if me.coin_balance < c.price then raise exception 'not enough coins'; end if;

  update public.profiles set coin_balance = coin_balance - c.price
   where id = auth.uid() returning * into me;
  insert into public.inventory (user_id, cosmetic_id) values (auth.uid(), p_cosmetic);
  return me;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.friendships       enable row level security;
alter table public.groups            enable row level security;
alter table public.group_members     enable row level security;
alter table public.chats             enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages          enable row level security;
alter table public.quest_rounds      enable row level security;
alter table public.quests            enable row level security;
alter table public.cosmetics         enable row level security;
alter table public.inventory         enable row level security;

-- profiles: everyone authed can read (to find friends); update only your own
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());

-- friendships: only the two involved users
drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requester_id = auth.uid());
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- groups: members can read; owner manages
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select to authenticated
  using (owner_id = auth.uid() or public.is_group_member(id));
drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups for update to authenticated using (owner_id = auth.uid());

-- group_members: members can read; user can join/leave themselves; owner can add
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select to authenticated
  using (public.is_group_member(group_id) or user_id = auth.uid());
drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members for insert to authenticated
  with check (user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()));
drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members for delete to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()));

-- chats: participants only
drop policy if exists chats_select on public.chats;
create policy chats_select on public.chats for select to authenticated using (public.is_chat_participant(id));
drop policy if exists chats_insert on public.chats;
create policy chats_insert on public.chats for insert to authenticated with check (true);

-- chat_participants
drop policy if exists chat_participants_select on public.chat_participants;
create policy chat_participants_select on public.chat_participants for select to authenticated
  using (public.is_chat_participant(chat_id) or user_id = auth.uid());
drop policy if exists chat_participants_insert on public.chat_participants;
create policy chat_participants_insert on public.chat_participants for insert to authenticated with check (true);

-- messages: participants of the chat
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (public.is_chat_participant(chat_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_chat_participant(chat_id));

-- quest_rounds: group members
drop policy if exists quest_rounds_select on public.quest_rounds;
create policy quest_rounds_select on public.quest_rounds for select to authenticated
  using (public.is_group_member(group_id));
drop policy if exists quest_rounds_insert on public.quest_rounds;
create policy quest_rounds_insert on public.quest_rounds for insert to authenticated
  with check (public.is_group_member(group_id));
drop policy if exists quest_rounds_update on public.quest_rounds;
create policy quest_rounds_update on public.quest_rounds for update to authenticated
  using (public.is_group_member(group_id));

-- quests: giver or receiver
drop policy if exists quests_select on public.quests;
create policy quests_select on public.quests for select to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid());
drop policy if exists quests_insert on public.quests;
create policy quests_insert on public.quests for insert to authenticated with check (giver_id = auth.uid());
drop policy if exists quests_update on public.quests;
create policy quests_update on public.quests for update to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid());

-- cosmetics: public read
drop policy if exists cosmetics_select on public.cosmetics;
create policy cosmetics_select on public.cosmetics for select to authenticated using (true);

-- inventory: only your own
drop policy if exists inventory_select on public.inventory;
create policy inventory_select on public.inventory for select to authenticated using (user_id = auth.uid());
drop policy if exists inventory_insert on public.inventory;
create policy inventory_insert on public.inventory for insert to authenticated with check (user_id = auth.uid());
drop policy if exists inventory_update on public.inventory;
create policy inventory_update on public.inventory for update to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed cosmetics (idempotent on name)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.cosmetics (category, name, price, asset_ref)
select * from (values
  ('accessory'::text,        'Cool Glasses',     150, 'glasses'),
  ('accessory'::text,        'Snapback Cap',     200, 'cap'),
  ('nickname_color'::text,   'Hot Pink',         120, '#ff5da2'),
  ('nickname_color'::text,   'Electric Purple',  120, '#b56bff'),
  ('nickname_color'::text,   'Lime Green',       120, '#33c46a'),
  ('nickname_color'::text,   'Sunset Orange',    120, '#ff7a00'),
  ('flame_decoration'::text, 'Blue Flame',       300, 'blue'),
  ('flame_decoration'::text, 'Rainbow Flame',    500, 'rainbow'),
  ('flame_decoration'::text, 'Golden Crown',     450, 'crown')
) as v(category, name, price, asset_ref)
where not exists (select 1 from public.cosmetics c where c.name = v.name);

-- ─────────────────────────────────────────────────────────────────────────────
-- Proof photos + AI review (additive; safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.quests add column if not exists proof_image_url   text;
alter table public.quests add column if not exists ai_score          int;
alter table public.quests add column if not exists ai_verdict        text;
alter table public.quests add column if not exists ai_feedback       text;
alter table public.quests add column if not exists proof_reviewed_at timestamptz;

-- Storage bucket for proof photos (public read; uploads gated by policy below).
insert into storage.buckets (id, name, public)
values ('quest-proofs', 'quest-proofs', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'quest_proofs_insert'
  ) then
    create policy quest_proofs_insert on storage.objects
      for insert to authenticated with check (bucket_id = 'quest-proofs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'quest_proofs_update'
  ) then
    create policy quest_proofs_update on storage.objects
      for update to authenticated using (bucket_id = 'quest-proofs' and owner = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'quest_proofs_select'
  ) then
    create policy quest_proofs_select on storage.objects
      for select to authenticated using (bucket_id = 'quest-proofs');
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime: expose tables on the supabase_realtime publication (idempotent).
-- The client subscribes to postgres_changes over a websocket to live-refresh
-- the UI. RLS still applies, so each user only receives rows they may SELECT.
-- Safe to re-run. If realtime is ever off, the app falls back to navigation /
-- action refreshes (and polling in chat) — nothing breaks.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array['messages', 'quests', 'friendships'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
