-- Dais initial schema. No seed data — every organization builds its own
-- conference structure from an empty base through the admin console.

create extension if not exists "pgcrypto";

-- Enums
create type org_role as enum ('org_admin');
create type committee_role as enum ('chair', 'delegate', 'observer');
-- Interface locales. 'en' and 'es' ship with full translation files at
-- launch; the rest are pre-declared here so adding their locale JSON file
-- later needs no schema migration. 'hi-Latn'/'zh-Latn' are Latin-script
-- (romanized/Pinyin) variants of Hindi/Mandarin alongside their native
-- script. Extend this enum when adding more.
create type language_code as enum (
  'en', 'es', 'fr', 'de', 'nl',
  'zh', 'zh-Latn',
  'ar', 'pt',
  'hi', 'hi-Latn',
  'ru', 'ja', 'ko', 'it', 'tr',
  'bn', 'ur', 'id', 'vi', 'fa', 'sw', 'th', 'pl'
);
create type session_mode as enum ('gsl', 'moderated_caucus', 'unmoderated_caucus', 'voting_procedure', 'suspended', 'not_started');
create type list_type as enum ('gsl', 'moderated_caucus');
create type speaker_status as enum ('waiting', 'speaking', 'done', 'withdrawn');
create type motion_type as enum (
  'point_of_order', 'point_of_personal_privilege', 'point_of_inquiry',
  'open_gsl', 'close_gsl', 'extend_gsl',
  'moderated_caucus', 'unmoderated_caucus',
  'introduce_draft_resolution', 'introduce_amendment',
  'vote_on_resolution', 'vote_on_amendment', 'other'
);
create type motion_status as enum ('pending', 'approved', 'rejected', 'in_vote', 'closed');
create type vote_value as enum ('for', 'against', 'abstain');
create type request_type as enum ('bathroom', 'point_of_information', 'chair_assistance', 'other');
create type request_status as enum ('pending', 'approved', 'held', 'denied');
create type doc_type as enum ('resolution', 'amendment', 'position_paper', 'other');
create type invite_status as enum ('pending', 'claimed', 'revoked');

-- Users (linked 1:1 to Supabase auth.users; a person's identity, not their role)
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id),
  display_name text not null,
  email text not null,
  preferred_interface_language language_code not null default 'en',
  created_at timestamptz default now()
);

-- Organizations (the top-level tenant)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  contact_email text,
  created_at timestamptz default now()
);

-- Org admins — junction table, a user can admin more than one org in theory
create table org_admins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- Conferences (a specific event run by an organization)
create table conferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  venue_name text,
  status text default 'setup',
  created_at timestamptz default now()
);

-- Rooms (admin-defined, scoped to a conference)
create table rooms (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid references conferences(id) on delete cascade,
  name text not null,
  floor text,
  created_at timestamptz default now()
);

-- Committees (admin-defined, scoped to a conference — nothing pre-loaded)
create table committees (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid references conferences(id) on delete cascade,
  name text not null,
  capacity int,
  room_id uuid references rooms(id),
  interface_language language_code not null default 'en',
  status text default 'not_started',
  created_at timestamptz default now()
);

-- Committee membership (chairs, delegates, observers)
create table committee_members (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role committee_role not null,
  delegation text,
  created_at timestamptz default now(),
  unique(committee_id, user_id)
);

-- Invites — how an org admin provisions chairs/delegates before they've signed in
create table invites (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  email text not null,
  role committee_role not null,
  delegation text,
  status invite_status not null default 'pending',
  invite_code text unique,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  claimed_at timestamptz
);

-- Schedule (admin-defined, scoped to a conference — fully generic, no assumed structure)
create table schedule_items (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid references conferences(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz default now()
);

-- Sessions (a committee's current procedural state during a live session)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  mode session_mode not null default 'not_started',
  topic text,
  speaking_time_seconds int,
  total_time_seconds int,
  status text default 'active',
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Speakers list
create table speakers_list (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  delegate_id uuid references users(id),
  list_type list_type not null,
  status speaker_status not null default 'waiting',
  joined_at timestamptz default now(),
  called_at timestamptz,
  finished_at timestamptz
);

-- Motions & points
create table motions (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  delegate_id uuid references users(id),
  motion_type motion_type not null,
  params jsonb,
  status motion_status not null default 'pending',
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references users(id)
);

-- Votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  motion_id uuid references motions(id) on delete cascade,
  delegate_id uuid references users(id),
  value vote_value not null,
  cast_at timestamptz default now(),
  unique(motion_id, delegate_id)
);

-- Requests (bathroom, POI, chair assistance)
create table requests (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  delegate_id uuid references users(id),
  type request_type not null,
  status request_status not null default 'pending',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Attendance
create table attendance (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  delegate_id uuid references users(id),
  session_date date not null,
  present boolean default false,
  present_and_voting boolean default false,
  unique(committee_id, delegate_id, session_date)
);

-- Documents (metadata only — files live in the chair's Google Drive)
create table documents (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  uploaded_by uuid references users(id),
  title text not null,
  doc_type doc_type not null,
  drive_file_id text not null,
  drive_link text not null,
  version int default 1,
  created_at timestamptz default now()
);

-- Google Drive connection per committee (the committee's primary chair links their Drive)
create table drive_links (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid references committees(id) on delete cascade,
  chair_id uuid references users(id),
  drive_folder_id text not null,
  oauth_refresh_token_encrypted text not null,
  connected_at timestamptz default now(),
  unique(committee_id)
);

-- Announcements (conference-wide or committee-specific)
create table announcements (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid references conferences(id) on delete cascade,
  committee_id uuid references committees(id),
  body text not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Indexes
create index on committees (conference_id);
create index on committee_members (committee_id, user_id);
create index on invites (email);
create index on invites (invite_code);
create index on speakers_list (committee_id, status);
create index on motions (committee_id, status);
create index on requests (committee_id, status);
