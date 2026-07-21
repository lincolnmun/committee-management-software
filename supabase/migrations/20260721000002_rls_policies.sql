-- Row-level security. Tenant isolation is the priority: every table traces
-- back to an organization, and no policy may let one org see another's data.

-- ============================================================================
-- Helper functions
--
-- These are SECURITY DEFINER so they can check membership/admin tables
-- without recursively re-triggering RLS on those same tables. They only ever
-- return a uuid or boolean (never row contents), so they can't be used to
-- exfiltrate data even if called directly by a client.
-- ============================================================================

create function current_app_user_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid();
$$;

create function is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from org_admins
    where organization_id = org_id
    and user_id = current_app_user_id()
  );
$$;

create function conference_org_id(conf_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from conferences where id = conf_id;
$$;

create function committee_conference_id(comm_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select conference_id from committees where id = comm_id;
$$;

create function is_org_admin_of_conference(conf_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select is_org_admin(conference_org_id(conf_id));
$$;

create function is_org_admin_of_committee(comm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select is_org_admin_of_conference(committee_conference_id(comm_id));
$$;

create function is_committee_member(comm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from committee_members
    where committee_id = comm_id
    and user_id = current_app_user_id()
  );
$$;

create function is_committee_chair(comm_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from committee_members
    where committee_id = comm_id
    and user_id = current_app_user_id()
    and role = 'chair'
  );
$$;

-- ============================================================================
-- Bootstrap: a new Supabase auth user automatically gets a public.users row
-- ============================================================================

create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into users (auth_user_id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Org signup: creates the organization and makes the caller its first admin
-- in one transaction. This is the only path that can insert into org_admins
-- without already being an admin — client code must call this, not insert
-- into organizations/org_admins directly.
create function create_organization(org_name text, org_slug text, org_contact_email text default null)
returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  new_org organizations;
begin
  caller_id := current_app_user_id();
  if caller_id is null then
    raise exception 'no users row for the current auth session';
  end if;

  insert into organizations (name, slug, contact_email)
  values (org_name, org_slug, org_contact_email)
  returning * into new_org;

  insert into org_admins (organization_id, user_id)
  values (new_org.id, caller_id);

  return new_org;
end;
$$;

-- ============================================================================
-- users
-- ============================================================================

alter table users enable row level security;

create policy "users read self, committee peers, or their org admin"
on users for select
using (
  auth_user_id = auth.uid()
  or exists (
    select 1 from committee_members mine
    join committee_members theirs on theirs.committee_id = mine.committee_id
    where mine.user_id = current_app_user_id()
    and theirs.user_id = users.id
  )
  or exists (
    select 1 from committee_members cm
    join committees c on c.id = cm.committee_id
    where cm.user_id = users.id
    and is_org_admin_of_conference(c.conference_id)
  )
);

create policy "users insert self"
on users for insert
with check (auth_user_id = auth.uid());

create policy "users update self"
on users for update
using (auth_user_id = auth.uid());

-- ============================================================================
-- organizations
-- ============================================================================

alter table organizations enable row level security;

create policy "org admins manage their organizations"
on organizations for all
using (is_org_admin(id));

-- ============================================================================
-- org_admins
-- ============================================================================

alter table org_admins enable row level security;

create policy "org admins read their own admin rows"
on org_admins for select
using (
  user_id = current_app_user_id()
  or is_org_admin(organization_id)
);

create policy "org admins manage co-admins"
on org_admins for insert
with check (is_org_admin(organization_id));

create policy "org admins remove co-admins"
on org_admins for delete
using (is_org_admin(organization_id));

-- ============================================================================
-- conferences
-- ============================================================================

alter table conferences enable row level security;

create policy "org admins manage their conferences"
on conferences for all
using (is_org_admin(organization_id));

create policy "committee members read their conference"
on conferences for select
using (
  exists (
    select 1 from committees c
    where c.conference_id = conferences.id
    and is_committee_member(c.id)
  )
);

-- ============================================================================
-- rooms
-- ============================================================================

alter table rooms enable row level security;

create policy "org admins manage rooms"
on rooms for all
using (is_org_admin_of_conference(conference_id));

create policy "committee members read their room"
on rooms for select
using (
  exists (
    select 1 from committees c
    where c.room_id = rooms.id
    and is_committee_member(c.id)
  )
);

-- ============================================================================
-- committees
-- ============================================================================

alter table committees enable row level security;

create policy "org admins manage committees"
on committees for all
using (is_org_admin_of_conference(conference_id));

create policy "committee members read their own committee"
on committees for select
using (is_committee_member(id));

-- ============================================================================
-- committee_members
-- ============================================================================

alter table committee_members enable row level security;

create policy "org admins manage committee membership"
on committee_members for all
using (is_org_admin_of_committee(committee_id));

create policy "committee members read their own roster"
on committee_members for select
using (is_committee_member(committee_id));

-- ============================================================================
-- invites — org admins only; the claiming flow uses a service-role function,
-- not client-side RLS, since the claimant has no committee_members row yet.
-- ============================================================================

alter table invites enable row level security;

create policy "org admins manage invites"
on invites for all
using (is_org_admin_of_committee(committee_id));

-- ============================================================================
-- schedule_items
-- ============================================================================

alter table schedule_items enable row level security;

create policy "org admins manage schedule"
on schedule_items for all
using (is_org_admin_of_conference(conference_id));

create policy "committee members read the schedule"
on schedule_items for select
using (
  exists (
    select 1 from committees c
    where c.conference_id = schedule_items.conference_id
    and is_committee_member(c.id)
  )
);

-- ============================================================================
-- sessions
-- ============================================================================

alter table sessions enable row level security;

create policy "committee members read sessions"
on sessions for select
using (is_committee_member(committee_id) or is_org_admin_of_committee(committee_id));

create policy "chairs manage sessions"
on sessions for all
using (is_committee_chair(committee_id));

-- ============================================================================
-- speakers_list / motions / votes / requests / attendance / documents
--
-- Uniform operational pattern: committee members can read; delegates can
-- write only their own rows; chairs can write any row in their committee.
-- ============================================================================

alter table speakers_list enable row level security;

create policy "committee members read speakers list"
on speakers_list for select
using (is_committee_member(committee_id));

create policy "delegates manage their own speakers list entry"
on speakers_list for all
using (delegate_id = current_app_user_id())
with check (delegate_id = current_app_user_id());

create policy "chairs manage speakers list"
on speakers_list for all
using (is_committee_chair(committee_id));

alter table motions enable row level security;

create policy "committee members read motions"
on motions for select
using (is_committee_member(committee_id));

create policy "delegates manage their own motions"
on motions for all
using (delegate_id = current_app_user_id())
with check (delegate_id = current_app_user_id());

create policy "chairs manage motions"
on motions for all
using (is_committee_chair(committee_id));

alter table votes enable row level security;

create policy "committee members read votes"
on votes for select
using (
  exists (select 1 from motions m where m.id = votes.motion_id and is_committee_member(m.committee_id))
);

create policy "delegates cast their own vote"
on votes for all
using (delegate_id = current_app_user_id())
with check (delegate_id = current_app_user_id());

create policy "chairs manage votes"
on votes for all
using (
  exists (select 1 from motions m where m.id = votes.motion_id and is_committee_chair(m.committee_id))
);

alter table requests enable row level security;

create policy "committee members read requests"
on requests for select
using (is_committee_member(committee_id));

create policy "delegates manage their own requests"
on requests for all
using (delegate_id = current_app_user_id())
with check (delegate_id = current_app_user_id());

create policy "chairs manage requests"
on requests for all
using (is_committee_chair(committee_id));

alter table attendance enable row level security;

create policy "committee members read attendance"
on attendance for select
using (is_committee_member(committee_id));

create policy "delegates manage their own attendance"
on attendance for all
using (delegate_id = current_app_user_id())
with check (delegate_id = current_app_user_id());

create policy "chairs manage attendance"
on attendance for all
using (is_committee_chair(committee_id));

alter table documents enable row level security;

create policy "committee members read documents"
on documents for select
using (is_committee_member(committee_id));

create policy "uploaders manage their own documents"
on documents for all
using (uploaded_by = current_app_user_id())
with check (uploaded_by = current_app_user_id());

create policy "chairs manage documents"
on documents for all
using (is_committee_chair(committee_id));

-- ============================================================================
-- drive_links — readable/writable only by the connected chair
-- ============================================================================

alter table drive_links enable row level security;

create policy "chair manages their own drive link"
on drive_links for all
using (chair_id = current_app_user_id())
with check (chair_id = current_app_user_id());

-- ============================================================================
-- announcements — conference-wide (committee_id null) authored by org admins,
-- or committee-specific authored by that committee's chairs.
-- ============================================================================

alter table announcements enable row level security;

create policy "org admins manage conference-wide announcements"
on announcements for all
using (committee_id is null and is_org_admin_of_conference(conference_id))
with check (committee_id is null and is_org_admin_of_conference(conference_id));

create policy "chairs manage their committee announcements"
on announcements for all
using (committee_id is not null and is_committee_chair(committee_id))
with check (committee_id is not null and is_committee_chair(committee_id));

create policy "committee members read announcements"
on announcements for select
using (
  (committee_id is null and exists (
    select 1 from committees c
    where c.conference_id = announcements.conference_id
    and is_committee_member(c.id)
  ))
  or (committee_id is not null and is_committee_member(committee_id))
);
