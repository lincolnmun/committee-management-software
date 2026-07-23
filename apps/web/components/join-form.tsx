"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CommitteeRole } from "@/lib/supabase/database.types";

export function JoinForm({ code, role }: { code: string; role: CommitteeRole }) {
  const t = useTranslations("join");
  const [delegation, setDelegation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");

    const response = await fetch("/api/invites/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        delegation: role === "delegate" ? delegation || null : null,
      }),
    });

    setStatus(response.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-2 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">{t("successTitle")}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {role === "delegate" && (
          <label className="flex flex-col gap-1 text-sm">
            {t("delegationLabel")}
            <input
              value={delegation}
              onChange={(event) => setDelegation(event.target.value)}
              placeholder={t("delegationPlaceholder")}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {t("submit")}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">{t("errorGeneric")}</p>
        )}
      </form>
    </div>
  );
}
