import { redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { createClient } from "@/lib/supabase/server";

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

  return <JoinForm code={code} />;
}
