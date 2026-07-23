import { CommitteesManager } from "@/components/committees-manager";
import { requireConferenceAccess } from "@/lib/auth/current-org";

export default async function CommitteesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireConferenceAccess(id);

  const [{ data: committees }, { data: rooms }] = await Promise.all([
    supabase
      .from("committees")
      .select("*")
      .eq("conference_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("rooms")
      .select("*")
      .eq("conference_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <CommitteesManager
      conferenceId={id}
      committees={committees ?? []}
      rooms={rooms ?? []}
    />
  );
}
