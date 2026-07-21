# Dais

Real-time Model UN committee management. Free, open source (AGPL-3.0), and
multi-tenant — it ships with no pre-loaded committees, rooms, schedules, or
language assumptions. Every organization builds its own conference structure
from an empty admin console. LINCOLNMUN is the first organization running a
conference on it, but nothing about that conference lives in this codebase.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind, on Supabase (Postgres +
Realtime + Auth, permissions enforced via Postgres RLS). Committee documents
live in the chair's own Google Drive, not Supabase Storage. pnpm workspace.

## Repository layout

```
apps/web/            Next.js app
supabase/migrations/  Schema + RLS, applied via CI — never edited by hand
                       in the Supabase dashboard
```

## Local setup

### 1. Prerequisites

- Node.js 18.17+
- pnpm (`corepack enable` or `npm i -g pnpm`)

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **Project Settings → API** and copy the
   Project URL, `anon` public key, and `service_role` secret key.
3. Apply the migrations in `supabase/migrations/` in order, either via the
   [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase link` then
   `supabase db push`) or by pasting each file's contents into the SQL editor
   in order. Do not hand-edit schema in the dashboard afterwards — all
   schema changes should be new migration files.
4. Under **Authentication → Providers**, enable **Email** (magic link is on
   by default) and **Google**.

### 3. Create a Google OAuth client

Dais uses Google OAuth twice, for two different purposes — you can reuse one
OAuth client for both, or create two:

- **Sign-in ("Google Sign-In")**: configured inside Supabase, under
  **Authentication → Providers → Google**. Create an OAuth 2.0 Client ID in
  the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  (type: Web application), add the redirect URI Supabase's Google provider
  page shows you, and paste the client ID/secret into that Supabase provider
  screen.
- **Document storage (Drive)**: a separate OAuth consent flow the app itself
  drives (Section 10 of the build brief), requesting the narrow
  `drive.file` scope so it can only see files it creates. This uses the
  `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` /
  `GOOGLE_OAUTH_REDIRECT_URI` env vars below and isn't required until M5.

### 4. Configure environment variables

```
cp apps/web/.env.example apps/web/.env.local
```

Fill in the Supabase values from step 2. The Google Drive and encryption
key variables aren't needed until the document storage milestone (M5).

### 5. Install and run

```
pnpm install
pnpm dev
```

Visit `http://localhost:3000` — you'll be redirected to sign in, then to an
empty admin dashboard where you can create your organization.