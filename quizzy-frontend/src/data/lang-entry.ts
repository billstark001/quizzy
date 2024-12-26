import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

import langRes from "./lang";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: langRes.en,
  },
  ja: {
    translation: langRes.ja,
  },
  zh: {
    translation: langRes.zh,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    fallbackLng: 'en', // default
    detection: {
      order: ['navigator', 'htmlTag', 'localStorage', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });


export const getSystemLanguage = () => {
  const languageDetector = new LanguageDetector();
  languageDetector.init(null, i18n.options.detection);
  const systemLanguage = languageDetector.detect();
  return  Array.isArray(systemLanguage)
    ? systemLanguage[0]
    : systemLanguage || '';
};

export default i18n;
