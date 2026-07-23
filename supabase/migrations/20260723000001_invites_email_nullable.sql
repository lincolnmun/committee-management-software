-- Open join-code invites (Section 9, path B) have no associated person yet,
-- only a code — so email can't be required for every invite, only for the
-- pre-loaded roster path (path A). At least one of email/invite_code must
-- still be set.

alter table invites alter column email drop not null;

alter table invites add constraint invites_email_or_code_check
  check (email is not null or invite_code is not null);
