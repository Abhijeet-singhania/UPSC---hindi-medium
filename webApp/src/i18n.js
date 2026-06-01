import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import hiTranslation from './locales/hi/translation.json';
import enTranslation from './locales/en/translation.json';
import { getStoredLanguage } from './utils/language';

const resources = {
  hi: {
    translation: hiTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
