"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type ScheduleItem = Database["public"]["Tables"]["schedule_items"]["Row"];

function toLocalInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

export function ScheduleManager({
  conferenceId,
  items,
}: {
  conferenceId: string;
  items: ScheduleItem[];
}) {
  const t = useTranslations("schedule");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("schedule_items").insert({
      conference_id: conferenceId,
      title,
      description: description || null,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
    });

    if (!error) {
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      router.refresh();
    }
  }

  function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditStartTime(toLocalInput(item.start_time));
    setEditEndTime(toLocalInput(item.end_time));
  }

  async function handleSaveEdit(itemId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedule_items")
      .update({
        title: editTitle,
        description: editDescription || null,
        start_time: editStartTime ? new Date(editStartTime).toISOString() : null,
        end_time: editEndTime ? new Date(editEndTime).toISOString() : null,
      })
      .eq("id", itemId);

    if (!error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(itemId: string) {
    const supabase = createClient();
    await supabase.from("schedule_items").delete().eq("id", itemId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
          >
            {editingId === item.id ? (
              <div className="flex flex-wrap items-end gap-2">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder={t("descriptionLabel")}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  type="datetime-local"
                  value={editStartTime}
                  onChange={(event) => setEditStartTime(event.target.value)}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  type="datetime-local"
                  value={editEndTime}
                  onChange={(event) => setEditEndTime(event.target.value)}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  onClick={() => handleSaveEdit(item.id)}
                  className="rounded bg-neutral-900 px-2 py-1 text-sm text-white dark:bg-white dark:text-neutral-900"
                >
                  {t("save")}
                </button>
                <button onClick={() => setEditingId(null)} className="text-sm text-neutral-500">
                  {t("cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-neutral-500">{item.description}</p>
                  )}
                  {(item.start_time || item.end_time) && (
                    <p className="text-sm text-neutral-500">
                      {item.start_time ? new Date(item.start_time).toLocaleString() : ""}
                      {item.end_time ? ` – ${new Date(item.end_time).toLocaleString()}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(item)}>{t("edit")}</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600">
                    {t("delete")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-neutral-500">{t("empty")}</p>}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {t("titleLabel")}
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("descriptionLabel")}
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("startTimeLabel")}
          <input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("endTimeLabel")}
          <input
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("addItem")}
        </button>
      </form>
    </div>
  );
}
