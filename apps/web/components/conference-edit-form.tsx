"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Conference = Database["public"]["Tables"]["conferences"]["Row"];

export function ConferenceEditForm({ conference }: { conference: Conference }) {
  const t = useTranslations("conferences");
  const router = useRouter();
  const [name, setName] = useState(conference.name);
  const [venueName, setVenueName] = useState(conference.venue_name ?? "");
  const [startDate, setStartDate] = useState(conference.start_date ?? "");
  const [endDate, setEndDate] = useState(conference.end_date ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");

    const supabase = createClient();
    const { error } = await supabase
      .from("conferences")
      .update({
        name,
        venue_name: venueName || null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .eq("id", conference.id);

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {t("nameLabel")}
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {t("save")}
        </button>
        {status === "saved" && <span className="text-sm text-green-600">{t("saved")}</span>}
        {status === "error" && <span className="text-sm text-red-600">{t("errorGeneric")}</span>}
      </div>
    </form>
  );
}
