import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOrgAdmin() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/sign-in");
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!appUser) {
    redirect("/sign-in");
  }

  const { data: adminRows } = await supabase
    .from("org_admins")
    .select("organization_id")
    .eq("user_id", appUser.id);

  const organizationId = adminRows?.[0]?.organization_id;

  if (!organizationId) {
    redirect("/admin");
  }

  return { supabase, appUserId: appUser.id, organizationId };
}

export async function requireConferenceAccess(conferenceId: string) {
  const { supabase, appUserId, organizationId } = await requireOrgAdmin();

  const { data: conference } = await supabase
    .from("conferences")
    .select("*")
    .eq("id", conferenceId)
    .eq("organization_id", organizationId)
    .single();

  if (!conference) {
    notFound();
  }

  return { supabase, appUserId, organizationId, conference };
}
