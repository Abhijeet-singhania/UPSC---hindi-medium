import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppLanguage from '../../hooks/useAppLanguage';
import { PenLine } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_TITLE_MAP = {
  '/dashboard': 'sidebar.dashboard',
  '/roadmap': 'sidebar.myRoadmap',
  '/content': 'sidebar.studyContent',
  '/affairs': 'sidebar.currentAffairs',
  '/prelims': 'sidebar.prelimsLab',
  '/past-year': 'sidebar.pastYearProblems',
  '/ask-ai': 'sidebar.askAI',
  '/answers': 'sidebar.answerWriting',
  '/rewards': 'sidebar.rewards',
  '/community': 'sidebar.community',
  '/wellbeing': 'sidebar.wellbeing',
  '/settings': 'sidebar.settings',
  '/admin': 'common.admin',
};

const Topbar = () => {
  const { t } = useTranslation();
  const { language } = useAppLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const titleKey = ROUTE_TITLE_MAP[location.pathname] || 'sidebar.dashboard';

  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const today = new Date().toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between py-4 px-8 bg-bg-panel border-b border-border-default shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
      <h2 className="text-[24px] font-serif font-semibold text-text-primary">{t(titleKey)}</h2>

      <div className="flex items-center gap-6">
        <span className="font-mono text-text-muted text-[13px]">{today}</span>
        {location.pathname !== '/settings' && location.pathname !== '/answers' && (
          <button
            onClick={() => navigate('/answers')}
            className="bg-primary hover:bg-primary-hover text-white border-none py-2 px-4 rounded-md text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <PenLine size={16} />
            {t('roadmap.writeToday')}
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
