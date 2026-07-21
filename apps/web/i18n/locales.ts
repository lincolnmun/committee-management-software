// Locale constants with an actual {code}.json translation file. Split out
// from request.ts (which needs next/headers, server-only) so client
// components like the language switcher can import just the constants.
export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";
