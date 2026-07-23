"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpeakingTimer } from "@/components/speaking-timer";
import { useCommitteeChannel } from "@/lib/realtime/use-committee-channel";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Session = Database["public"]["Tables"]["sessions"]["Row"];

export type SpeakerRow = Database["public"]["Tables"]["speakers_list"]["Row"] & {
  displayName: string | null;
};

export function ChairQueueView({
  committeeId,
  session,
  speakers,
}: {
  committeeId: string;
  session: Session;
  speakers: SpeakerRow[];
}) {
  const t = useTranslations("queue");
  const router = useRouter();
  const [speakingSeconds, setSpeakingSeconds] = useState(session.speaking_time_seconds ?? 60);

  useCommitteeChannel(committeeId);

  const waiting = speakers
    .filter((s) => s.status === "waiting")
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  const speaking = speakers.find((s) => s.status === "speaking");

  async function handleCallNext() {
    const supabase = createClient();
    const now = new Date().toISOString();

    if (speaking) {
      await supabase
        .from("speakers_list")
        .update({ status: "done", finished_at: now })
        .eq("id", speaking.id);
    }

    const next = waiting[0];
    if (next) {
      await supabase
        .from("speakers_list")
        .update({ status: "speaking", called_at: now })
        .eq("id", next.id);
    }

    router.refresh();
  }

  async function handleSaveSpeakingTime(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    await supabase
      .from("sessions")
      .update({ speaking_time_seconds: speakingSeconds })
      .eq("id", session.id);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{t("chairTitle")}</h1>

      <div className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("nowSpeaking")}
        </h2>
        {speaking ? (
          <div className="flex items-center justify-between">
            <span className="font-medium">{speaking.displayName}</span>
            {speaking.called_at && (
              <SpeakingTimer
                calledAt={speaking.called_at}
                speakingSeconds={session.speaking_time_seconds ?? 60}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t("noOneSpeaking")}</p>
        )}
      </div>

      <button
        onClick={handleCallNext}
        disabled={waiting.length === 0}
        className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {t("callNextSpeaker")}
      </button>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("queueTitle", { count: waiting.length })}
        </h2>
        {waiting.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("queueEmpty")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {waiting.map((speaker, index) => (
              <li
                key={speaker.id}
                className="flex items-center gap-3 rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800"
              >
                <span className="text-neutral-400">{index + 1}</span>
                <span>{speaker.displayName}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form onSubmit={handleSaveSpeakingTime} className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {t("speakingTimeLabel")}
          <input
            type="number"
            min={10}
            value={speakingSeconds}
            onChange={(event) => setSpeakingSeconds(Number(event.target.value))}
            className="w-24 rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
        >
          {t("save")}
        </button>
      </form>
    </div>
  );
}
