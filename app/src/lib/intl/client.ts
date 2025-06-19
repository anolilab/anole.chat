import { i18n } from "@lingui/core";
import { detect, fromCookie, fromNavigator } from "@lingui/detect-locale";

// Detect user's locale
export const DEFAULT_LOCALE = "en";

export const locales = {
    en: "EN",
    de: "DE",
};

export const isLocaleValid = (locale: string) => Object.keys(locales).includes(locale);

export const defaultLocale = "en";

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
    const { messages } = await import(`../../locales/${locale}/messages.po`);
    i18n.load(locale, messages);
    i18n.activate(locale);
}
