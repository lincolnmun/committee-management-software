import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type SupportedLocale } from "./locales";

// Interface locale is not part of the URL — it's resolved per request from
// (in order) a language-switcher cookie, then falls back to English. Once
// signed in, the sign-in flow syncs this cookie from the user's
// preferred_interface_language / their committee's interface_language.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)
    ? (cookieLocale as SupportedLocale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});
