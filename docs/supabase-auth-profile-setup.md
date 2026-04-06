# Supabase Auth + Profile Setup

Use Supabase for:

- Google login
- Email/password login
- User profile
- User policy/preferences

Use D1 for:

- session memory
- episodic history
- memory retrieval

## 1. Create a Supabase project

Create a project in Supabase and copy:

- Project URL
- Publishable key (or anon key)

Set these in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## 2. Enable Google auth

In Supabase dashboard:

- Authentication
- Providers
- Google
- enable it

Configure the Google OAuth redirect URLs according to:

- local: `http://localhost:3000`
- production: your deployed frontend URL

Reference:
- https://supabase.com/docs/guides/auth/social-login/auth-google

## 3. Create the profile table

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company text,
  role text,
  goals text,
  preferred_tone text default 'professional',
  response_style text default 'concise',
  memory_mode text default 'persistent',
  factual_strictness text default 'strict',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "users can view own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

create policy "users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

Reference:
- https://supabase.com/docs/guides/database/postgres/row-level-security

## 4. Install frontend auth dependencies

Inside `frontend`:

```powershell
npm install @supabase/supabase-js
```

## 5. Next build step

After auth is live:

- link D1 `sessionId` to `user.id`
- use profile + policy to drive memory and answer behavior
