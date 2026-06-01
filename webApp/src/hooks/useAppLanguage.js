import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { applyLanguage, getContentLanguage } from '../utils/language';

/**
 * Single source for UI + API content language.
 * - UI: i18n (synced from user.preferred_language on login)
 * - API: preferred_language from profile, else current i18n language
 */
export function useAppLanguage() {
  const { i18n, t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  const language = i18n.language || 'hi';
  const contentLanguage = getContentLanguage(user);

  const setLanguage = useCallback((lang) => {
    applyLanguage(lang);
  }, []);

  return { language, contentLanguage, setLanguage, t };
}

export default useAppLanguage;
