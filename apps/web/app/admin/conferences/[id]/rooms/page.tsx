import { RoomsManager } from "@/components/rooms-manager";
import { requireConferenceAccess } from "@/lib/auth/current-org";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireConferenceAccess(id);

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("conference_id", id)
    .order("created_at", { ascending: true });

  return <RoomsManager conferenceId={id} rooms={rooms ?? []} />;
}
