import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';

const CurrentAffairs = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('digest');

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Stats Card */}
      <div className="bg-bg-surface-dark text-text-primary rounded-xl py-8 px-12 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[2px] text-text-muted mb-3">{t('currentAffairs.heroDate')}</div>
          <h2 className="text-[28px] font-serif font-semibold mb-2">{t('currentAffairs.heroTitle')}</h2>
          <p className="text-[14px] text-text-secondary">{t('currentAffairs.heroSub')}</p>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-serif text-[#FDFBF8]">7</span>
            <span className="text-[10px] text-text-muted tracking-[1px] uppercase">{t('currentAffairs.statToday')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-serif text-[#FDFBF8]">142</span>
            <span className="text-[10px] text-text-muted tracking-[1px] uppercase">{t('currentAffairs.statMonth')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-serif text-[#FDFBF8]">4</span>
            <span className="text-[10px] text-text-muted tracking-[1px] uppercase">{t('currentAffairs.statTrackers')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border-default">
        <button 
          className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'digest' ? 'text-primary' : 'text-text-muted'}`}
          onClick={() => setActiveTab('digest')}
        >
          {t('currentAffairs.tabDigest')}
          {activeTab === 'digest' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
        <button 
          className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'trackers' ? 'text-primary' : 'text-text-muted'}`}
          onClick={() => setActiveTab('trackers')}
        >
          {t('currentAffairs.tabTrackers')}
          {activeTab === 'trackers' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
        <button 
          className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'quiz' ? 'text-primary' : 'text-text-muted'}`}
          onClick={() => setActiveTab('quiz')}
        >
          {t('currentAffairs.tabQuiz')}
          {activeTab === 'quiz' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
        <button 
          className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'archive' ? 'text-primary' : 'text-text-muted'}`}
          onClick={() => setActiveTab('archive')}
        >
          {t('currentAffairs.tabArchive')}
          {activeTab === 'archive' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
        </button>
      </div>

      {/* News List */}
      <div className="flex flex-col gap-4">
        {/* News Item 1 */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-[18px] font-semibold text-text-primary">{t('currentAffairs.news1Title')}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0 uppercase">GS3</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-text-primary mb-4">{t('currentAffairs.news1Desc')}</p>
          
          <div className="bg-primary/5 border-l-2 border-l-primary p-3 px-4 rounded mb-4">
            <div className="text-[10px] text-primary font-semibold tracking-[1px] uppercase mb-1 flex items-center gap-1">
              <Link2 size={12} /> {t('currentAffairs.connectDots')}
            </div>
            <div className="text-[13px] text-text-muted">
              <strong className="text-text-primary font-medium">{t('currentAffairs.linksTo')}</strong> {t('currentAffairs.news1Links')}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Monetary Policy</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">RBI</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Inflation</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">MPC</span>
             <span className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded font-medium">PYQ 2019</span>
          </div>
        </div>

        {/* News Item 2 */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-[18px] font-semibold text-text-primary">{t('currentAffairs.news2Title')}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 shrink-0 uppercase">GS2</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-text-primary mb-4">{t('currentAffairs.news2Desc')}</p>
          
          <div className="bg-primary/5 border-l-2 border-l-primary p-3 px-4 rounded mb-4">
            <div className="text-[10px] text-primary font-semibold tracking-[1px] uppercase mb-1 flex items-center gap-1">
              <Link2 size={12} /> {t('currentAffairs.connectDots')}
            </div>
            <div className="text-[13px] text-text-muted">
              <strong className="text-text-primary font-medium">{t('currentAffairs.linksTo')}</strong> {t('currentAffairs.news2Links')}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">India-Maldives</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Neighbourhood Policy</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">IOR</span>
             <span className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded font-medium">PYQ 2023</span>
          </div>
        </div>

        {/* News Item 3 */}
        <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-[18px] font-semibold text-text-primary">{t('currentAffairs.news3Title')}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shrink-0 uppercase">GS1+GS3</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-text-primary mb-4">{t('currentAffairs.news3Desc')}</p>
          
          <div className="bg-primary/5 border-l-2 border-l-primary p-3 px-4 rounded mb-4">
            <div className="text-[10px] text-primary font-semibold tracking-[1px] uppercase mb-1 flex items-center gap-1">
              <Link2 size={12} /> {t('currentAffairs.connectDots')}
            </div>
            <div className="text-[13px] text-text-muted">
              <strong className="text-text-primary font-medium">{t('currentAffairs.linksTo')}</strong> {t('currentAffairs.news3Links')}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Forest Rights Act</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Tribal Rights</span>
             <span className="text-[11px] bg-bg-surface border border-border-default text-text-muted px-2 py-1 rounded">Supreme Court</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentAffairs;
