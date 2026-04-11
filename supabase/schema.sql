-- ============================================================
-- CAMPUS AI Canonical Schema (Core App Tables)
-- ============================================================
-- This file is the source of truth for the current app logic.
-- It defines the tables used directly by the web application:
-- courses, modules, topics, progress, certificates.
--
-- Notes:
-- 1) The script is idempotent (safe to re-run).
-- 2) Legacy/experimental citation-cache tables are intentionally
--    excluded from this core schema to avoid future confusion.
-- ============================================================

-- Extensions
create extension if not exists pgcrypto with schema public;

-- ------------------------------------------------------------
-- 1) Courses
-- ------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year text,
  branch text,
  semester integer,
  course_name text not null default 'Untitled Course',
  syllabus_text text,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ------------------------------------------------------------
-- 2) Modules
-- ------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  order_index integer not null,
  estimated_time integer,
  status text not null default 'locked' check (status in ('locked', 'in_progress', 'completed')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (course_id, order_index)
);

-- ------------------------------------------------------------
-- 3) Topics
-- ------------------------------------------------------------
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  notes text,
  video_playlist_json jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ------------------------------------------------------------
-- 4) Progress
-- ------------------------------------------------------------
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  notes_completed boolean default false,
  video_progress integer default 0 check (video_progress between 0 and 100),
  practice_completed boolean default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, topic_id)
);

-- ------------------------------------------------------------
-- 5) Certificates
-- ------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_url text not null,
  verification_id text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, course_id)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists idx_courses_user_created_at
  on public.courses (user_id, created_at desc);

create index if not exists idx_modules_course_order
  on public.modules (course_id, order_index asc);

create index if not exists idx_topics_module_id
  on public.topics (module_id);

create index if not exists idx_topics_created_at
  on public.topics (created_at);

create index if not exists idx_progress_user_id
  on public.progress (user_id);

create index if not exists idx_progress_topic_id
  on public.progress (topic_id);

create index if not exists idx_certificates_user_id
  on public.certificates (user_id);

create index if not exists idx_certificates_course_id
  on public.certificates (course_id);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;

-- ------------------------------------------------------------
-- Policies: courses
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_select_own'
  ) then
    create policy courses_select_own
      on public.courses
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_insert_own'
  ) then
    create policy courses_insert_own
      on public.courses
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_update_own'
  ) then
    create policy courses_update_own
      on public.courses
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_delete_own'
  ) then
    create policy courses_delete_own
      on public.courses
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

-- ------------------------------------------------------------
-- Policies: modules (inherit ownership via courses)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'modules' and policyname = 'modules_all_via_course_owner'
  ) then
    create policy modules_all_via_course_owner
      on public.modules
      for all
      using (
        exists (
          select 1
          from public.courses c
          where c.id = modules.course_id
            and c.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.courses c
          where c.id = modules.course_id
            and c.user_id = auth.uid()
        )
      );
  end if;
end
$$;

-- ------------------------------------------------------------
-- Policies: topics (inherit ownership via modules -> courses)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'topics' and policyname = 'topics_all_via_course_owner'
  ) then
    create policy topics_all_via_course_owner
      on public.topics
      for all
      using (
        exists (
          select 1
          from public.modules m
          join public.courses c on c.id = m.course_id
          where m.id = topics.module_id
            and c.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.modules m
          join public.courses c on c.id = m.course_id
          where m.id = topics.module_id
            and c.user_id = auth.uid()
        )
      );
  end if;
end
$$;

-- ------------------------------------------------------------
-- Policies: progress
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'progress' and policyname = 'progress_owner_all'
  ) then
    create policy progress_owner_all
      on public.progress
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- ------------------------------------------------------------
-- Policies: certificates
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certificates' and policyname = 'certificates_owner_all'
  ) then
    create policy certificates_owner_all
      on public.certificates
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certificates' and policyname = 'certificates_public_verify_read'
  ) then
    create policy certificates_public_verify_read
      on public.certificates
      for select
      using (true);
  end if;
end
$$;

