# Database Schema (proposal)

A future Supabase (Postgres) database backs the AI-CMS for **multiple customer
websites**. It stores who the customers are, which repo/site each maps to, every
command they issue, a per-step log, and uploaded media.

**Status: implemented (step 5).** The runnable migration is
`supabase/migrations/0001_ai_cms.sql` and the backend persists through
`server/cms/stores/` (env-gated). To activate, create a Supabase project, run
the migration, and set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server-side
only) in `.env.local` and in the Netlify site environment. Without them the
backend uses an in-memory store. The tables below match the migration (the app
also keeps the full command in an `ai_commands.data` jsonb column).

---

## Entity overview

```
customers ──< users
customers ──< ai_commands ──< command_logs
customers ──< media_assets
users      ──< ai_commands   (who issued it)
```

## Tables

### `customers`
One row per customer website.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | `default gen_random_uuid()` |
| name | text | Customer / business name |
| domain | text | Live domain |
| github_repo | text | e.g. `HeyoB-ai/the-garage` |
| netlify_site_id | text | Netlify site identifier |
| created_at | timestamptz | `default now()` |

### `users`
People who can drive a customer's site.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | maps to Supabase `auth.users.id` |
| customer_id | uuid FK → customers.id | tenant scope |
| name | text | |
| email | text | unique |
| role | text | `owner` \| `editor` \| `viewer` |

### `ai_commands`
One row per instruction.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| customer_id | uuid FK → customers.id | |
| user_id | uuid FK → users.id | who issued it |
| input_text | text | raw transcript / typed text |
| transcript_source | text | `text` \| `voice` |
| intent | text | from the parser (e.g. `add_news`) |
| status | text | `received`→`analyzed`→`planned`→`preview_ready`→`approved`→`live` \| `cancelled` |
| requires_approval | boolean | structural ⇒ true |
| branch_name | text | e.g. `cms/add-news-a1b2c` |
| preview_url | text | Netlify deploy preview |
| created_at | timestamptz | `default now()` |
| approved_at | timestamptz | nullable |
| deployed_at | timestamptz | nullable |

### `command_logs`
Append-only step log per command (drives the dashboard timeline + audit/rollback).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| command_id | uuid FK → ai_commands.id | |
| step | text | `analyze` \| `plan` \| `apply` \| `build` \| `preview` \| `approve` \| `deploy` \| `error` |
| message | text | human-readable detail |
| created_at | timestamptz | `default now()` |

### `media_assets`
Uploaded images/files referenced by content.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| customer_id | uuid FK → customers.id | |
| filename | text | |
| url | text | Supabase Storage / Netlify Blobs URL |
| alt_text | text | for accessibility + SEO |
| uploaded_at | timestamptz | `default now()` |

---

## Illustrative SQL

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  github_repo text not null,
  netlify_site_id text,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,                       -- = auth.users.id
  customer_id uuid not null references customers(id) on delete cascade,
  name text,
  email text unique not null,
  role text not null default 'editor'
);

create table ai_commands (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  input_text text not null,
  transcript_source text not null default 'text',
  intent text,
  status text not null default 'received',
  requires_approval boolean not null default false,
  branch_name text,
  preview_url text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  deployed_at timestamptz
);

create table command_logs (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references ai_commands(id) on delete cascade,
  step text not null,
  message text,
  created_at timestamptz not null default now()
);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  filename text not null,
  url text not null,
  alt_text text,
  uploaded_at timestamptz not null default now()
);
```

## Row-Level Security (when wired)

Enable RLS on every table and scope by `customer_id` so each customer only sees
their own data. Example policy shape:

```sql
alter table ai_commands enable row level security;
create policy "tenant can read own commands"
  on ai_commands for select
  using (customer_id = (select customer_id from users where id = auth.uid()));
```
