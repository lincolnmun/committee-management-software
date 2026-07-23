import { NextResponse } from "next/server";
import { claimInviteByCode } from "@/lib/invites/claim";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { code, delegation } = await request.json();

  if (typeof code !== "string" || !code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const result = await claimInviteByCode(
    appUser.id,
    code,
    typeof delegation === "string" && delegation ? delegation : null
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ committeeId: result.committeeId });
}
