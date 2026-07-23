import { ConferenceForm } from "@/components/conference-form";
import { requireOrgAdmin } from "@/lib/auth/current-org";

export default async function NewConferencePage() {
  const { organizationId } = await requireOrgAdmin();

  return <ConferenceForm organizationId={organizationId} />;
}
