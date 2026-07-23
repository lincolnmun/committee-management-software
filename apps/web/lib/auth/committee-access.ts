import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireCommitteeAccess(committeeId: string) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/sign-in?next=${encodeURIComponent(`/committee/${committeeId}`)}`);
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!appUser) {
    redirect("/sign-in");
  }

  const { data: membership } = await supabase
    .from("committee_members")
    .select("role, delegation")
    .eq("committee_id", committeeId)
    .eq("user_id", appUser.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: committee } = await supabase
    .from("committees")
    .select("*")
    .eq("id", committeeId)
    .single();

  if (!committee) {
    notFound();
  }

  return { supabase, appUserId: appUser.id, membership, committee };
}
