import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

const languages = Object.keys(resources);

const runsOnServerSide = typeof window === "undefined";

// Cookie settings for client-side only
const cookieSettings = !runsOnServerSide
    ? {
          lookupCookie: "i18next",
          cookieExpirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
          cookieDomain: window.location.hostname,
          cookieSecure: window.location.protocol === "https:",
          caches: ["cookie"],
      }
    : {};

i18n.use(initReactI18next)
    .use(LanguageDetector)
    .use(resourcesToBackend((language: string) => import(`./locales/${language}.ts`)))
    .init({
        compatibilityJSON: "v4",
        resources,
        interpolation: {
            escapeValue: false,
        },
        defaultNS: "translation",
        detection: {
            order: ["cookie", "navigator"],
            ...cookieSettings,
        },
        lng: "en",
        debug: false, // Add debug mode temporarily
        preload: runsOnServerSide ? languages : [],
    });

/**
 * Change the application language and update the cookie
 * @param language - Language code (e.g., 'en', 'fr', 'es')
 */
export const changeLanguage = (language: string) => {
    if (languages.includes(language)) {
        i18n.changeLanguage(language);
        // The cookie will be set automatically by the LanguageDetector
        console.log(`🌐 Language changed to ${language}`);
        return true;
    }
    console.warn(`🌐 Language ${language} not available`);
    return false;
};

// Preload languages and namespaces
// const languages = Object.keys(resources);
// console.log("🌐 Pre loading languages", languages);
// await Promise.all([
//   i18n.loadLanguages(languages), // TODO: load languages from options
//   i18n.loadNamespaces(["translation"]), // TODO: load namespaces from options
// ]);

i18n.on("languageChanged", (lng) => {
    console.log("🌐 Language changed", lng);
});

export default i18n;
