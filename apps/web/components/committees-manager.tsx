"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/client";
import type { Database, LanguageCode } from "@/lib/supabase/database.types";

type Committee = Database["public"]["Tables"]["committees"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

function CommitteeFields({
  name,
  setName,
  capacity,
  setCapacity,
  roomId,
  setRoomId,
  language,
  setLanguage,
  rooms,
  t,
}: {
  name: string;
  setName: (v: string) => void;
  capacity: string;
  setCapacity: (v: string) => void;
  roomId: string;
  setRoomId: (v: string) => void;
  language: LanguageCode;
  setLanguage: (v: LanguageCode) => void;
  rooms: Room[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
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
        {t("capacityLabel")}
        <input
          type="number"
          min={0}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          className="w-24 rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("roomLabel")}
        <select
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">{t("noRoom")}</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("languageLabel")}
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {code.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function CommitteesManager({
  conferenceId,
  committees,
  rooms,
}: {
  conferenceId: string;
  committees: Committee[];
  rooms: Room[];
}) {
  const t = useTranslations("committees");
  const router = useRouter();

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [roomId, setRoomId] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editRoomId, setEditRoomId] = useState("");
  const [editLanguage, setEditLanguage] = useState<LanguageCode>("en");

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("committees").insert({
      conference_id: conferenceId,
      name,
      capacity: capacity ? Number(capacity) : null,
      room_id: roomId || null,
      interface_language: language,
    });

    if (!error) {
      setName("");
      setCapacity("");
      setRoomId("");
      setLanguage("en");
      router.refresh();
    }
  }

  function startEdit(committee: Committee) {
    setEditingId(committee.id);
    setEditName(committee.name);
    setEditCapacity(committee.capacity != null ? String(committee.capacity) : "");
    setEditRoomId(committee.room_id ?? "");
    setEditLanguage(committee.interface_language);
  }

  async function handleSaveEdit(committeeId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("committees")
      .update({
        name: editName,
        capacity: editCapacity ? Number(editCapacity) : null,
        room_id: editRoomId || null,
        interface_language: editLanguage,
      })
      .eq("id", committeeId);

    if (!error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(committeeId: string) {
    const supabase = createClient();
    await supabase.from("committees").delete().eq("id", committeeId);
    router.refresh();
  }

  function roomName(id: string | null) {
    return rooms.find((room) => room.id === id)?.name;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {committees.map((committee) => (
          <li
            key={committee.id}
            className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
          >
            {editingId === committee.id ? (
              <div className="flex flex-wrap items-end gap-2">
                <CommitteeFields
                  name={editName}
                  setName={setEditName}
                  capacity={editCapacity}
                  setCapacity={setEditCapacity}
                  roomId={editRoomId}
                  setRoomId={setEditRoomId}
                  language={editLanguage}
                  setLanguage={setEditLanguage}
                  rooms={rooms}
                  t={t}
                />
                <button
                  onClick={() => handleSaveEdit(committee.id)}
                  className="rounded bg-neutral-900 px-2 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
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
                  <p className="font-medium">{committee.name}</p>
                  <p className="text-sm text-neutral-500">
                    {[
                      committee.capacity ? t("capacityValue", { count: committee.capacity }) : null,
                      roomName(committee.room_id),
                      committee.interface_language.toUpperCase(),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(committee)}>{t("edit")}</button>
                  <button onClick={() => handleDelete(committee.id)} className="text-red-600">
                    {t("delete")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {committees.length === 0 && (
          <p className="text-sm text-neutral-500">{t("empty")}</p>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <CommitteeFields
          name={name}
          setName={setName}
          capacity={capacity}
          setCapacity={setCapacity}
          roomId={roomId}
          setRoomId={setRoomId}
          language={language}
          setLanguage={setLanguage}
          rooms={rooms}
          t={t}
        />
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("addCommittee")}
        </button>
      </form>
    </div>
  );
}
