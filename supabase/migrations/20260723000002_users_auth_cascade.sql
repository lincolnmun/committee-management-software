-- users.auth_user_id had no explicit delete behavior, which defaults to
-- blocking deletion of an auth.users row while a linked public.users row
-- exists. Deleting a test (or real) account should cleanly cascade instead.

alter table users drop constraint users_auth_user_id_fkey;

alter table users add constraint users_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;
