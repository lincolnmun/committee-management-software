"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ConferenceForm({ organizationId }: { organizationId: string }) {
  const t = useTranslations("conferences");
  const router = useRouter();
  const [name, setName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("conferences")
      .insert({
        organization_id: organizationId,
        name,
        venue_name: venueName || null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setStatus("error");
      return;
    }

    router.push(`/admin/conferences/${data.id}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{t("newTitle")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("nameLabel")}
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("namePlaceholder")}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("venueLabel")}
          <input
            value={venueName}
            onChange={(event) => setVenueName(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("startDateLabel")}
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("endDateLabel")}
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={status === "saving"}
          className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {t("createConference")}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-600">{t("errorGeneric")}</p>
        )}
      </form>
    </div>
  );
}
