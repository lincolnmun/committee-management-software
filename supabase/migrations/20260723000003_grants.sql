-- RLS policies decide which ROWS a role can see/affect, but a role also
-- needs base table-level permission before RLS is even evaluated — and
-- some of our RLS policies (e.g. on users) reference other tables (e.g.
-- committee_members) in subqueries, so evaluating that policy fails with
-- "permission denied for table X" if the role lacks grants on X, even when
-- the actual write is happening on a completely different table.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- So any table added by a future migration gets these grants too, without
-- needing to remember to grant it explicitly every time.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
