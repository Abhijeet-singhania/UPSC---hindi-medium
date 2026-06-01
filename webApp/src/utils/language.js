import i18n from '../i18n';

export const LANGUAGE_STORAGE_KEY = 'app-language';
export const SUPPORTED_LANGUAGES = ['hi', 'en'];

/** Normalize to hi or en; default hi. */
export function normalizeLanguage(lang) {
  const code = (lang || '').toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(code) ? code : 'hi';
}

export function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return 'hi';
  }
}

/** Apply UI language globally (i18n + storage + html lang). */
export function applyLanguage(lang) {
  const code = normalizeLanguage(lang);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
  if (i18n.language !== code) {
    i18n.changeLanguage(code);
  }
  document.documentElement.lang = code;
  return code;
}

/** Content/API language from user profile or current UI language. */
export function getContentLanguage(user) {
  if (user?.preferred_language) {
    return normalizeLanguage(user.preferred_language);
  }
  return normalizeLanguage(i18n.language || getStoredLanguage());
}
