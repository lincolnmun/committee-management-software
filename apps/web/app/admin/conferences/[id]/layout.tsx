import { ConferenceNav } from "@/components/conference-nav";
import { requireConferenceAccess } from "@/lib/auth/current-org";

export default async function ConferenceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { conference } = await requireConferenceAccess(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{conference.name}</h1>
      <ConferenceNav conferenceId={id} />
      {children}
    </div>
  );
}
