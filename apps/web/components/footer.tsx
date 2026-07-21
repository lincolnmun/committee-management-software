import { LanguageSwitcher } from "@/components/language-switcher";

export function Footer() {
  return (
    <footer className="flex items-center justify-between gap-4 border-t border-neutral-200 px-6 py-4 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        Dais
      </span>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <span>© {new Date().getFullYear()} Dais</span>
      </div>
    </footer>
  );
}
