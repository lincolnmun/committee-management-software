-- Postgres Changes only stream for tables explicitly added to this
-- publication — without this, Realtime subscriptions silently receive
-- nothing, no error.
alter publication supabase_realtime add table sessions, speakers_list;
