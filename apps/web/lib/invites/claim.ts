import { createServiceRoleClient } from "@/lib/supabase/service-role";

const UNIQUE_VIOLATION = "23505";

// Path A (Section 9): a pre-loaded roster invite is tied to one specific
// person, matched by email on their first sign-in. Single-use — claiming it
// marks the invite 'claimed' so it can't be matched again.
export async function claimInvitesByEmail(userId: string, email: string) {
  const supabase = createServiceRoleClient();

  const { data: pendingInvites } = await supabase
    .from("invites")
    .select("id, committee_id, role, delegation")
    .eq("status", "pending")
    .ilike("email", email);

  if (!pendingInvites || pendingInvites.length === 0) {
    return;
  }

  for (const invite of pendingInvites) {
    const { error: memberError } = await supabase.from("committee_members").insert({
      committee_id: invite.committee_id,
      user_id: userId,
      role: invite.role,
      delegation: invite.delegation,
    });

    if (!memberError || memberError.code === UNIQUE_VIOLATION) {
      await supabase
        .from("invites")
        .update({ status: "claimed", claimed_at: new Date().toISOString() })
        .eq("id", invite.id);
    }
  }
}

// Path B (Section 9): an open join code is reusable by many different
// people until an admin revokes it — unlike path A, using it does NOT mark
// the invite 'claimed', since that would make it single-use.
export async function claimInviteByCode(
  userId: string,
  code: string,
  delegation: string | null
) {
  const supabase = createServiceRoleClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, committee_id, role, status")
    .eq("invite_code", code)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    return { error: "invalid_or_revoked_code" as const };
  }

  const { error: memberError } = await supabase.from("committee_members").insert({
    committee_id: invite.committee_id,
    user_id: userId,
    role: invite.role,
    delegation,
  });

  if (memberError && memberError.code !== UNIQUE_VIOLATION) {
    return { error: "insert_failed" as const };
  }

  return { committeeId: invite.committee_id };
}
