import { ChairQueueView, type SpeakerRow } from "@/components/chair-queue-view";
import { DelegateQueueView } from "@/components/delegate-queue-view";
import { requireCommitteeAccess } from "@/lib/auth/committee-access";
import type { Database } from "@/lib/supabase/database.types";

type Session = Database["public"]["Tables"]["sessions"]["Row"];

export default async function CommitteeFloorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, appUserId, membership } = await requireCommitteeAccess(id);

  let session: Session | null = null;

  const { data: activeSession } = await supabase
    .from("sessions")
    .select("*")
    .eq("committee_id", id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  session = activeSession;

  if (!session && membership.role === "chair") {
    const { data: newSession } = await supabase
      .from("sessions")
      .insert({ committee_id: id, mode: "gsl", speaking_time_seconds: 60, status: "active" })
      .select("*")
      .single();
    session = newSession;
  }

  let speakers: SpeakerRow[] = [];

  if (session) {
    const { data: speakerRows } = await supabase
      .from("speakers_list")
      .select("*")
      .eq("session_id", session.id)
      .in("status", ["waiting", "speaking"]);

    const delegateIds = (speakerRows ?? [])
      .map((row) => row.delegate_id)
      .filter((value): value is string => Boolean(value));

    const { data: userRows } =
      delegateIds.length > 0
        ? await supabase.from("users").select("id, display_name").in("id", delegateIds)
        : { data: [] };

    speakers = (speakerRows ?? []).map((row) => ({
      ...row,
      displayName: userRows?.find((u) => u.id === row.delegate_id)?.display_name ?? null,
    }));
  }

  if (membership.role === "chair" && session) {
    return <ChairQueueView committeeId={id} session={session} speakers={speakers} />;
  }

  return (
    <DelegateQueueView
      committeeId={id}
      session={session}
      speakers={speakers}
      currentUserId={appUserId}
      canJoin={membership.role === "delegate"}
    />
  );
}
