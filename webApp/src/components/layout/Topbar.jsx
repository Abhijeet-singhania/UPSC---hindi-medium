import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Topbar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Simple hardcoded mapping for page titles based on routes
  let titleKey = 'sidebar.dashboard';
  if (location.pathname === '/roadmap') titleKey = 'sidebar.myRoadmap';
  if (location.pathname === '/content') titleKey = 'sidebar.studyContent';
  if (location.pathname === '/affairs') titleKey = 'sidebar.currentAffairs';
  if (location.pathname === '/prelims') titleKey = 'sidebar.prelimsLab';
  if (location.pathname === '/past-year') titleKey = 'sidebar.pastYearProblems';
  if (location.pathname === '/community') titleKey = 'sidebar.community';
  if (location.pathname === '/wellbeing') titleKey = 'sidebar.wellbeing';
  
  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between py-4 px-8 bg-white border-b border-[#Eeece9] shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
      <h2 className="text-[24px] font-serif font-semibold text-[#201E1C]">{t(titleKey)}</h2>
      
      <div className="flex items-center gap-6">
        <span className="font-mono text-[#716F6C] text-[13px]">Thu, 16 Apr, 2026</span>
        <button className="bg-primary hover:bg-primary-hover text-white border-none py-2 px-4 rounded-md text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer">
          <PenLine size={16} />
          {t('roadmap.writeToday')}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
