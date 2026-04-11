-- ============================================================
-- CAMPUS AI Optional Legacy RAG Schema
-- ============================================================
-- Use this only if you want the older citation/cache pipeline.
-- Core app functionality does NOT require these tables.
--
-- Tables:
--   - public.cache_sources (source-level cache records)
--   - public.notes         (generated note chunks per source)
--   - public.embeddings    (vector embeddings for note chunks)
-- ============================================================

-- Extensions
create extension if not exists pgcrypto with schema public;
create extension if not exists vector with schema public;

-- ------------------------------------------------------------
-- 1) Source cache
-- ------------------------------------------------------------
create table if not exists public.cache_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_content text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_cache_sources_created_at
  on public.cache_sources (created_at desc);

-- ------------------------------------------------------------
-- 2) Note chunks
-- ------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  cache_source_id uuid not null references public.cache_sources(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_notes_cache_source_id
  on public.notes (cache_source_id);

create index if not exists idx_notes_created_at
  on public.notes (created_at desc);

-- ------------------------------------------------------------
-- 3) Embeddings
-- ------------------------------------------------------------
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  embedding vector(3072) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_embeddings_note_id
  on public.embeddings (note_id);

-- Optional vector index (recommended only once table has enough rows)
-- create index if not exists idx_embeddings_vector_ivfflat
--   on public.embeddings using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.cache_sources enable row level security;
alter table public.notes enable row level security;
alter table public.embeddings enable row level security;

-- Public read policies (legacy cache is non-user-specific in this model)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cache_sources' and policyname = 'cache_sources_public_read'
  ) then
    create policy cache_sources_public_read
      on public.cache_sources
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notes' and policyname = 'notes_public_read'
  ) then
    create policy notes_public_read
      on public.notes
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'embeddings' and policyname = 'embeddings_public_read'
  ) then
    create policy embeddings_public_read
      on public.embeddings
      for select
      using (true);
  end if;
end
$$;

-- Service role can always manage all rows; no extra write policy needed for backend jobs.

