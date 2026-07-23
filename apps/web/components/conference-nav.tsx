"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ConferenceNav({ conferenceId }: { conferenceId: string }) {
  const t = useTranslations("conferences");
  const pathname = usePathname();
  const base = `/admin/conferences/${conferenceId}`;

  const tabs = [
    { href: base, label: t("tabOverview") },
    { href: `${base}/rooms`, label: t("tabRooms") },
    { href: `${base}/committees`, label: t("tabCommittees") },
    { href: `${base}/schedule`, label: t("tabSchedule") },
    { href: `${base}/roster`, label: t("tabRoster") },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => {
        const isActive = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              isActive
                ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
