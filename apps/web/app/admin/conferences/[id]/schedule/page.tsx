import { ScheduleManager } from "@/components/schedule-manager";
import { requireConferenceAccess } from "@/lib/auth/current-org";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireConferenceAccess(id);

  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("conference_id", id)
    .order("start_time", { ascending: true, nullsFirst: false });

  return <ScheduleManager conferenceId={id} items={items ?? []} />;
}
