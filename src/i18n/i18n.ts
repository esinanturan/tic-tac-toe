import i18n from "i18next";
import { initReactI18next } from "react-i18next";
// Remove browser language detector as it's not compatible with React Native
// import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslation from "./locales/en.json";
import esTranslation from "./locales/es.json";
import trTranslation from "./locales/tr.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
  tr: {
    translation: trTranslation,
  },
};

i18n
  // detect user language - removing browser detector for now
  // .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    lng: "en", // Set default language explicitly
    fallbackLng: "en",
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false, // React native doesn't support suspense yet
    },
  });

export default i18n;
