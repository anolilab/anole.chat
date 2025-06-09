import i18next from "./i18n";

export async function getI18n(lng: string) {
    // TODO: check if lng is supported
    if (lng && i18next.resolvedLanguage !== lng) {
        await i18next.changeLanguage(lng);
    }

    return {
        t: i18next.getFixedT(lng),
        i18n: i18next,
    };
}
