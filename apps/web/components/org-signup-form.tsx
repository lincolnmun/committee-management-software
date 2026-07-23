"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function OrgSignupForm() {
  const t = useTranslations("orgSignup");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.rpc("create_organization", {
      org_name: name,
      org_slug: slug,
      org_contact_email: contactEmail || null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("duplicate") ? t("errorSlugTaken") : error.message
      );
      return;
    }

    // A hard reload (not router.refresh()) so this reliably reflects the
    // new organization regardless of client-side router/cache quirks —
    // this only runs once per account, so the extra reload cost is fine.
    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("orgNameLabel")}
          <input
            required
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder={t("orgNamePlaceholder")}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("slugLabel")}
          <input
            required
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value));
            }}
            className="rounded border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <span className="text-xs text-neutral-500">{t("slugHelp")}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("contactEmailLabel")}
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <button
          type="submit"
          disabled={status === "saving"}
          className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {t("createOrganization")}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
