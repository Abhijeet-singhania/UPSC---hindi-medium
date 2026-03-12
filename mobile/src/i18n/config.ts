import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import hi from './hi.json';

const LANGUAGE_STORE_KEY = '@app_language';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
};

const languageDetector = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORE_KEY);
            if (storedLanguage) {
                return callback(storedLanguage);
            }
            return callback('hi'); // Default to Hindi
        } catch (error) {
            console.warn('Error reading language from AsyncStorage', error);
            return callback('hi');
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORE_KEY, lng);
        } catch (error) {
            console.warn('Error saving language to AsyncStorage', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React handles escaping
        },
        react: {
            useSuspense: false, // Better for React Native fetching
        },
    });

export default i18n;
