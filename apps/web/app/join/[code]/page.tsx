import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/sign-in?next=${encodeURIComponent(`/join/${code}`)}`);
  }

  // Looked up with the service-role client since invites are only readable
  // by org admins under normal RLS — the person claiming a code isn't one.
  const { data: invite } = await createServiceRoleClient()
    .from("invites")
    .select("role, status")
    .eq("invite_code", code)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    const t = await getTranslations("join");
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-2 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-red-600">{t("errorGeneric")}</p>
      </div>
    );
  }

  return <JoinForm code={code} role={invite.role} />;
}
