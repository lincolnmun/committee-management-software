import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrgSignupForm } from "@/components/org-signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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

  const { data: adminRows } = appUser
    ? await supabase
        .from("org_admins")
        .select("organization_id")
        .eq("user_id", appUser.id)
    : { data: null };

  const organizationId = adminRows?.[0]?.organization_id;

  if (!organizationId) {
    const { data: membershipRows } = appUser
      ? await supabase
          .from("committee_members")
          .select("id")
          .eq("user_id", appUser.id)
          .limit(1)
      : { data: null };

    if (membershipRows && membershipRows.length > 0) {
      const t = await getTranslations("adminDashboard");
      return (
        <div className="mx-auto flex max-w-md flex-col gap-2 px-6 py-24 text-center">
          <p className="font-medium">{t("committeeMemberTitle")}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t("committeeMemberBody")}
          </p>
        </div>
      );
    }

    return <OrgSignupForm />;
  }

  const { data: conferences } = await supabase
    .from("conferences")
    .select("id, name, start_date, end_date")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const t = await getTranslations("adminDashboard");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Link
          href="/admin/conferences/new"
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("createConference")}
        </Link>
      </div>

      {conferences && conferences.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {conferences.map((conference) => (
            <li key={conference.id}>
              <Link
                href={`/admin/conferences/${conference.id}`}
                className="block rounded border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800"
              >
                <p className="font-medium">{conference.name}</p>
                {(conference.start_date || conference.end_date) && (
                  <p className="text-sm text-neutral-500">
                    {conference.start_date} – {conference.end_date}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {t("emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
