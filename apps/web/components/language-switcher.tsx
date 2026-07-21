"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/locales";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: SupportedLocale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t("label")}</span>
      <select
        className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
        value={locale}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as SupportedLocale)}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
