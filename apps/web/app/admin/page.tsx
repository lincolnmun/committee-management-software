import { getTranslations } from "next-intl/server";
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

  const organizationIds = (adminRows ?? []).map((row) => row.organization_id);

  if (organizationIds.length === 0) {
    return <OrgSignupForm />;
  }

  const t = await getTranslations("adminDashboard");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <div className="rounded border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="font-medium">{t("emptyTitle")}</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t("emptyBody")}
        </p>
      </div>
    </div>
  );
}
