"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (status === "sent") {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-2 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">{t("checkYourEmail")}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("checkYourEmailBody", { email })}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{t("signInTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t("signInSubtitle")}
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("emailLabel")}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {t("sendMagicLink")}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">{t("errorGeneric")}</p>
        )}
      </form>

      <div className="flex items-center gap-3 text-xs uppercase text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        {t("orDivider")}
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="rounded border border-neutral-300 px-3 py-2 text-sm font-medium dark:border-neutral-700"
      >
        {t("continueWithGoogle")}
      </button>
    </div>
  );
}
