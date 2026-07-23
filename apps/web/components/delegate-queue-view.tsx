"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SpeakingTimer } from "@/components/speaking-timer";
import { useCommitteeChannel } from "@/lib/realtime/use-committee-channel";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { SpeakerRow } from "@/components/chair-queue-view";

type Session = Database["public"]["Tables"]["sessions"]["Row"];

export function DelegateQueueView({
  committeeId,
  session,
  speakers,
  currentUserId,
  canJoin,
}: {
  committeeId: string;
  session: Session | null;
  speakers: SpeakerRow[];
  currentUserId: string;
  canJoin: boolean;
}) {
  const t = useTranslations("queue");
  const router = useRouter();

  useCommitteeChannel(committeeId);

  const waiting = speakers
    .filter((s) => s.status === "waiting")
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  const speaking = speakers.find((s) => s.status === "speaking");
  const myEntry = speakers.find(
    (s) => s.delegate_id === currentUserId && (s.status === "waiting" || s.status === "speaking")
  );
  const myPosition = myEntry ? waiting.findIndex((s) => s.id === myEntry.id) + 1 : 0;

  async function handleJoin() {
    if (!session) return;
    const supabase = createClient();
    await supabase.from("speakers_list").insert({
      committee_id: committeeId,
      session_id: session.id,
      delegate_id: currentUserId,
      list_type: "gsl",
    });
    router.refresh();
  }

  async function handleWithdraw() {
    if (!myEntry) return;
    const supabase = createClient();
    await supabase
      .from("speakers_list")
      .update({ status: "withdrawn" })
      .eq("id", myEntry.id);
    router.refresh();
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-2 px-6 py-24 text-center">
        <p className="font-medium">{t("waitingForChairTitle")}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t("waitingForChairBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{t("delegateTitle")}</h1>

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

      {myEntry?.status === "speaking" ? (
        <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {t("yourTurn")}
        </p>
      ) : myEntry?.status === "waiting" ? (
        <div className="flex items-center justify-between rounded border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm">{t("yourPosition", { position: myPosition })}</p>
          <button onClick={handleWithdraw} className="text-sm text-red-600">
            {t("withdraw")}
          </button>
        </div>
      ) : canJoin ? (
        <button
          onClick={handleJoin}
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("joinQueue")}
        </button>
      ) : null}

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
    </div>
  );
}
