"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommitteeRole, Database } from "@/lib/supabase/database.types";

type Invite = Database["public"]["Tables"]["invites"]["Row"];
type MemberRow = {
  id: string;
  role: CommitteeRole;
  delegation: string | null;
  displayName: string | null;
  email: string | null;
};

function generateInviteCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

export function RosterManager({
  committees,
  activeCommitteeId,
  invites,
  members,
}: {
  committees: { id: string; name: string }[];
  activeCommitteeId: string | null;
  invites: Invite[];
  members: MemberRow[];
}) {
  const t = useTranslations("roster");
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CommitteeRole>("delegate");
  const [delegation, setDelegation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  function handleCommitteeChange(id: string) {
    router.push(`${pathname}?committee=${id}`);
  }

  async function handleAddInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!activeCommitteeId) return;
    setStatus("saving");

    const supabase = createClient();
    const { error } = await supabase.from("invites").insert({
      committee_id: activeCommitteeId,
      email,
      role,
      delegation: delegation || null,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setEmail("");
    setDelegation("");
    setStatus("idle");
    router.refresh();
  }

  async function handleGenerateCode(codeRole: CommitteeRole) {
    if (!activeCommitteeId) return;
    const supabase = createClient();
    await supabase.from("invites").insert({
      committee_id: activeCommitteeId,
      role: codeRole,
      invite_code: generateInviteCode(),
    });
    router.refresh();
  }

  async function handleRevoke(inviteId: string) {
    const supabase = createClient();
    await supabase.from("invites").update({ status: "revoked" }).eq("id", inviteId);
    router.refresh();
  }

  if (committees.length === 0) {
    return <p className="text-sm text-neutral-500">{t("noCommittees")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        {t("committeeLabel")}
        <select
          value={activeCommitteeId ?? ""}
          onChange={(event) => handleCommitteeChange(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {committees.map((committee) => (
            <option key={committee.id} value={committee.id}>
              {committee.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("membersTitle")}
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("noMembers")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {members.map((member) => (
              <li key={member.id} className="text-sm">
                <span className="font-medium">{member.displayName ?? member.email}</span>
                {" — "}
                {member.role}
                {member.delegation ? ` (${member.delegation})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("invitesTitle")}
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("noInvites")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800"
              >
                <div>
                  <p className="font-medium">
                    {invite.email ?? t("joinCodeLabel")}
                    {invite.delegation ? ` · ${invite.delegation}` : ""}
                  </p>
                  <p className="text-neutral-500">
                    {invite.role} · {invite.status}
                  </p>
                  {invite.invite_code && (
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${invite.invite_code}`}
                      onFocus={(event) => event.currentTarget.select()}
                      className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  )}
                </div>
                {invite.status === "pending" && (
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    className="text-red-600"
                  >
                    {t("revoke")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("addInviteTitle")}
        </h2>
        <form onSubmit={handleAddInvite} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {t("emailLabel")}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("roleLabel")}
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as CommitteeRole)}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="delegate">{t("roleDelegate")}</option>
              <option value="chair">{t("roleChair")}</option>
              <option value="observer">{t("roleObserver")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("delegationLabel")}
            <input
              value={delegation}
              onChange={(event) => setDelegation(event.target.value)}
              placeholder={t("delegationPlaceholder")}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {t("addInvite")}
          </button>
        </form>
        <p className="mt-2 text-sm text-neutral-500">{t("addInviteHelp")}</p>
        {status === "error" && (
          <p className="mt-1 text-sm text-red-600">{t("errorGeneric")}</p>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">
          {t("joinCodeTitle")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateCode("chair")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            {t("generateChairCode")}
          </button>
          <button
            onClick={() => handleGenerateCode("delegate")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            {t("generateDelegateCode")}
          </button>
        </div>
      </div>
    </div>
  );
}
