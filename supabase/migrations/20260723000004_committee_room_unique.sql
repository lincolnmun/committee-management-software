-- A room can only be assigned to one committee at a time. Partial index
-- (not a plain unique constraint) so multiple committees can still share
-- room_id = null (no room assigned yet).
create unique index committees_room_id_unique on committees (room_id)
  where room_id is not null;
