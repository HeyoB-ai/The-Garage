-- AI-CMS schema (step 5). Run in the Supabase SQL editor or via the CLI.
-- Mirrors DATABASE_SCHEMA.md. The backend uses the SERVICE ROLE key, which
-- bypasses RLS; the policies below are for future authenticated browser access.

create extension if not exists "pgcrypto";

-- One row per customer website.
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  github_repo text not null,
  netlify_site_id text,
  created_at timestamptz not null default now()
);

-- People who can drive a customer's site.
create table if not exists users (
  id uuid primary key,                       -- = auth.users.id
  customer_id uuid references customers(id) on delete cascade,
  name text,
  email text unique not null,
  role text not null default 'editor'
);

-- One row per instruction. `data` holds the full ApiCommand (source of truth
-- for the app); the typed columns are for querying / dashboards.
create table if not exists ai_commands (
  id text primary key,
  customer_id uuid references customers(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  input_text text not null,
  transcript_source text not null default 'text',
  intent text,
  status text not null default 'analyzed',
  requires_approval boolean not null default false,
  branch_name text,
  preview_url text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  deployed_at timestamptz
);
create index if not exists ai_commands_customer_idx on ai_commands (customer_id, created_at desc);

-- Append-only step log per command (drives the timeline + audit).
create table if not exists command_logs (
  id uuid primary key default gen_random_uuid(),
  command_id text not null references ai_commands(id) on delete cascade,
  step text not null,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists command_logs_command_idx on command_logs (command_id, created_at);

-- Uploaded media referenced by content.
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  filename text not null,
  url text not null,
  alt_text text,
  uploaded_at timestamptz not null default now()
);

-- RLS (for future authenticated browser clients; the service role bypasses it).
alter table ai_commands enable row level security;
alter table command_logs enable row level security;
alter table media_assets enable row level security;

drop policy if exists "tenant reads own commands" on ai_commands;
create policy "tenant reads own commands" on ai_commands
  for select using (
    customer_id = (select customer_id from users where id = auth.uid())
  );
