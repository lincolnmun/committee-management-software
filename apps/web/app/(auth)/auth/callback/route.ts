import { NextResponse } from "next/server";
import { claimInvitesByEmail } from "@/lib/invites/claim";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/admin";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.email) {
        const { data: appUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", authUser.id)
          .single();

        if (appUser) {
          await claimInvitesByEmail(appUser.id, authUser.email);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
