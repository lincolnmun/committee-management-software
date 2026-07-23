import { RosterManager } from "@/components/roster-manager";
import { requireConferenceAccess } from "@/lib/auth/current-org";
import type { Database } from "@/lib/supabase/database.types";

type Invite = Database["public"]["Tables"]["invites"]["Row"];

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ committee?: string }>;
}) {
  const { id } = await params;
  const { committee: requestedCommitteeId } = await searchParams;
  const { supabase } = await requireConferenceAccess(id);

  const { data: committees } = await supabase
    .from("committees")
    .select("id, name")
    .eq("conference_id", id)
    .order("created_at", { ascending: true });

  const activeCommitteeId =
    requestedCommitteeId && committees?.some((c) => c.id === requestedCommitteeId)
      ? requestedCommitteeId
      : (committees?.[0]?.id ?? null);

  let invites: Invite[] = [];
  let members: {
    id: string;
    role: Database["public"]["Tables"]["committee_members"]["Row"]["role"];
    delegation: string | null;
    displayName: string | null;
    email: string | null;
  }[] = [];

  if (activeCommitteeId) {
    const [{ data: inviteRows }, { data: memberRows }] = await Promise.all([
      supabase
        .from("invites")
        .select("*")
        .eq("committee_id", activeCommitteeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("committee_members")
        .select("*")
        .eq("committee_id", activeCommitteeId)
        .order("created_at", { ascending: true }),
    ]);

    invites = inviteRows ?? [];

    const userIds = (memberRows ?? [])
      .map((row) => row.user_id)
      .filter((value): value is string => Boolean(value));

    const { data: userRows } =
      userIds.length > 0
        ? await supabase.from("users").select("id, display_name, email").in("id", userIds)
        : { data: [] };

    members = (memberRows ?? []).map((row) => {
      const user = userRows?.find((u) => u.id === row.user_id);
      return {
        id: row.id,
        role: row.role,
        delegation: row.delegation,
        displayName: user?.display_name ?? null,
        email: user?.email ?? null,
      };
    });
  }

  return (
    <RosterManager
      committees={committees ?? []}
      activeCommitteeId={activeCommitteeId}
      invites={invites}
      members={members}
    />
  );
}
