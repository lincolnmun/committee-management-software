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
        // Self-heals the profile row on every sign-in, not just the first
        // one — the on_auth_user_created trigger only fires on a genuine
        // INSERT into auth.users, so it never re-runs for an existing
        // identity signing back in (e.g. after the profile row was
        // deleted, or any other drift between auth.users and public.users).
        const { data: appUser } = await supabase
          .from("users")
          .upsert(
            {
              auth_user_id: authUser.id,
              display_name:
                authUser.user_metadata?.full_name ?? authUser.email.split("@")[0],
              email: authUser.email,
            },
            { onConflict: "auth_user_id" }
          )
          .select("id")
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
