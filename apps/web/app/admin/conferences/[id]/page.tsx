import { ConferenceEditForm } from "@/components/conference-edit-form";
import { requireConferenceAccess } from "@/lib/auth/current-org";

export default async function ConferenceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { conference } = await requireConferenceAccess(id);

  return <ConferenceEditForm conference={conference} />;
}
