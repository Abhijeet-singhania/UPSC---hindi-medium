import React from 'react';
import { useTranslation } from 'react-i18next';
import { applyLanguage } from '../../utils/language';

/**
 * Hindi / English toggle. Calls onChange(lang) when provided (e.g. signup save to API).
 */
const LanguageToggle = ({ value, onChange, className = '' }) => {
  const { t, i18n } = useTranslation();
  const current = value || i18n.language || 'hi';

  const select = (lang) => {
    applyLanguage(lang);
    onChange?.(lang);
  };

  const btnClass = (active) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
      active
        ? 'border-primary bg-primary/10 text-text-primary ring-1 ring-primary'
        : 'border-border-default bg-bg-surface text-text-muted hover:border-primary/40'
    }`;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button type="button" onClick={() => select('hi')} className={btnClass(current === 'hi')}>
        <span className="text-lg">🇮🇳</span>
        <span className="text-sm font-medium">{t('settings.hindi')}</span>
      </button>
      <button type="button" onClick={() => select('en')} className={btnClass(current === 'en')}>
        <span className="text-lg">🇬🇧</span>
        <span className="text-sm font-medium">{t('settings.english')}</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
