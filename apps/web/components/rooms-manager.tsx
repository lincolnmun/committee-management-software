"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export function RoomsManager({
  conferenceId,
  rooms,
}: {
  conferenceId: string;
  rooms: Room[];
}) {
  const t = useTranslations("rooms");
  const router = useRouter();
  const [name, setName] = useState("");
  const [floor, setFloor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFloor, setEditFloor] = useState("");

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from("rooms")
      .insert({ conference_id: conferenceId, name, floor: floor || null });

    if (!error) {
      setName("");
      setFloor("");
      router.refresh();
    }
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setEditName(room.name);
    setEditFloor(room.floor ?? "");
  }

  async function handleSaveEdit(roomId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("rooms")
      .update({ name: editName, floor: editFloor || null })
      .eq("id", roomId);

    if (!error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(roomId: string, roomName: string) {
    if (!window.confirm(t("confirmDelete", { name: roomName }))) return;
    const supabase = createClient();
    await supabase.from("rooms").delete().eq("id", roomId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
          >
            {editingId === room.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <input
                  value={editFloor}
                  onChange={(event) => setEditFloor(event.target.value)}
                  placeholder={t("floorLabel")}
                  className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  onClick={() => handleSaveEdit(room.id)}
                  className="rounded bg-neutral-900 px-2 py-1 text-sm text-white dark:bg-white dark:text-neutral-900"
                >
                  {t("save")}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm text-neutral-500"
                >
                  {t("cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{room.name}</p>
                  {room.floor && (
                    <p className="text-sm text-neutral-500">{room.floor}</p>
                  )}
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(room)}>{t("edit")}</button>
                  <button
                    onClick={() => handleDelete(room.id, room.name)}
                    className="text-red-600"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {rooms.length === 0 && (
          <p className="text-sm text-neutral-500">{t("empty")}</p>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
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
          {t("floorLabel")}
          <input
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className="w-28 rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("addRoom")}
        </button>
      </form>
    </div>
  );
}
