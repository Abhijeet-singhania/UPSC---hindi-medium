import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Zap } from 'lucide-react';

const PrelimsLab = () => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null);

  // Generate 30 tracker blocks (mocking a 30 question set)
  // First 3 green (correct), 1 red (wrong), 1 grey (skipped), rest empty
  const trackerBlocks = Array.from({ length: 30 }, (_, i) => {
    if (i < 3) return 'correct';
    if (i === 3) return 'wrong';
    if (i === 4) return 'skipped';
    if (i === 5) return 'current';
    return 'empty';
  });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="font-serif text-[28px] font-semibold text-text-primary mb-1">{t('prelimsLab.title')}</h2>
          <p className="text-text-muted text-[13px]">{t('prelimsLab.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-bg-panel border border-border-default py-2 px-4 rounded-md text-[13px] font-medium text-text-primary flex items-center cursor-pointer hover:bg-bg-panel-hover transition-colors">
            <FileText size={16} className="mr-2" /> {t('prelimsLab.btnFullMock')}
          </button>
          <button className="bg-primary hover:bg-primary-hover text-text-primary border-none py-2 px-4 rounded-md text-[13px] font-medium flex items-center cursor-pointer transition-colors">
            <Zap size={16} fill="white" className="mr-2" /> {t('prelimsLab.btnAdaptive')}
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Main Quiz Area */}
        <div className="flex-1">
          <div className="bg-bg-panel border border-border-default rounded-xl p-12 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <span className="text-text-muted text-[13px]">{t('prelimsLab.qCount')}</span>
                <span className="bg-[#f0f0f0] px-2 py-1 rounded text-[13px] border border-border-default text-text-muted">{t('prelimsLab.qTag')}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-[#fbefe9] text-primary">PYQ 2021</span>
            </div>

            {/* Question Text */}
            <p className="font-medium text-[15px] text-text-primary mb-4">{t('prelimsLab.qQuestion')}</p>
            <p className="mb-2 text-text-primary text-[15px]">{t('prelimsLab.qS1')}</p>
            <p className="mb-2 text-text-primary text-[15px]">{t('prelimsLab.qS2')}</p>
            <p className="mb-6 text-text-primary text-[15px]">{t('prelimsLab.qS3')}</p>
            <p className="mb-6 text-text-primary text-[15px] font-medium">{t('prelimsLab.qPrompt')}</p>

            {/* Options */}
            <div className="flex flex-col gap-4 mb-8">
              {['optA', 'optB', 'optC', 'optD'].map((optKey, idx) => {
                const char = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === optKey;
                return (
                  <div 
                    key={optKey} 
                    className={`flex items-center gap-4 p-4 px-6 border border-border-default rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary bg-[#FDF9F5]' : 'hover:bg-bg-panel-hover'}`}
                    onClick={() => setSelectedOption(optKey)}
                  >
                    <div className={`w-7 h-7 border border-border-default rounded-full flex items-center justify-center text-[12px] ${isSelected ? 'bg-primary text-text-primary border-primary' : 'text-text-muted'}`}>{char}</div>
                    <div className="text-[15px] text-text-primary">{t(`prelimsLab.${optKey}`)}</div>
                  </div>
                );
              })}
            </div>

            {/* Card Footer */}
            <div className="flex justify-between items-center pt-6 border-t border-border-default">
              <button className="bg-bg-panel border border-border-default text-text-primary py-2 px-4 rounded-md text-[13px] font-medium cursor-pointer hover:bg-bg-panel-hover transition-colors">{t('prelimsLab.btnPrev')}</button>
              <div className="flex gap-4">
                <button className="bg-bg-panel border border-border-default text-text-primary py-2 px-4 rounded-md text-[13px] font-medium cursor-pointer hover:bg-bg-panel-hover transition-colors">{t('prelimsLab.btnSkip')}</button>
                <button className="bg-primary hover:bg-primary-hover text-text-primary border-none py-2 px-4 rounded-md text-[13px] font-medium cursor-pointer transition-colors">{t('prelimsLab.btnNext')}</button>
              </div>
            </div>
          </div>

          {/* Tracker Row */}
          <div className="mt-4">
            <div className="flex gap-1 mb-2">
              {trackerBlocks.map((status, idx) => {
                const statusClasses = {
                  'correct': 'bg-[#3C8157]',
                  'wrong': 'bg-[#D34335]',
                  'skipped': 'bg-[#aaa]',
                  'current': 'border-2 border-primary bg-bg-panel',
                  'empty': 'bg-[#eee]'
                };
                return <div key={idx} className={`w-[14px] h-[14px] rounded-[2px] ${statusClasses[status]}`}></div>
              })}
            </div>
            <div className="text-xs text-text-muted">
              {t('prelimsLab.trackerInfo')}
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="w-[320px] shrink-0 flex flex-col">
          {/* Session Stats */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4">
            <h4 className="font-serif font-semibold text-[16px] text-text-primary mb-4">{t('prelimsLab.statsTitle')}</h4>
            <div className="flex gap-4 mb-6">
              <div className="bg-[#EBF5F0] p-4 rounded-lg flex flex-col justify-center flex-1 text-center">
                <span className="text-xl font-serif text-[#2A5A3D] font-semibold">3</span>
                <span className="text-xs text-[#2A5A3D] font-semibold">{t('prelimsLab.statsCorrect')}</span>
              </div>
              <div className="bg-[#FBEEED] p-4 rounded-lg flex flex-col justify-center flex-1 text-center">
                <span className="text-xl font-serif text-[#9C2E24] font-semibold">1</span>
                <span className="text-xs text-[#9C2E24] font-semibold">{t('prelimsLab.statsWrong')}</span>
              </div>
            </div>
            <div className="bg-[#f0f0f0] rounded p-2 text-xs text-center text-text-muted">
              {t('prelimsLab.statsAccuracy')}
            </div>
          </div>

          {/* Subject Accuracy */}
          <div className="bg-bg-panel border border-border-default rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4">
            <h4 className="font-serif font-semibold text-[16px] text-text-primary mb-6">{t('prelimsLab.subjAccuracy')}</h4>
            <div className="flex flex-col gap-5">
              {[
                { key: 'subjHistory', val: 84, color: '#3C8157' },
                { key: 'subjPolity', val: 78, color: '#3C8157' },
                { key: 'subjGeography', val: 71, color: '#D4613C' },
                { key: 'subjEconomy', val: 58, color: '#C0933C' },
                { key: 'subjEnvironment', val: 63, color: '#D4613C' },
                { key: 'subjSnT', val: 52, color: '#C0933C' },
              ].map(subj => (
                <div key={subj.key} className="flex items-center gap-4">
                  <div className="text-[13px] w-[100px] shrink-0 text-text-primary">{t(`prelimsLab.${subj.key}`)}</div>
                  <div className="h-1 bg-[#eee] rounded-full w-full flex-1">
                    <div className="h-full rounded-full" style={{ width: `${subj.val}%`, backgroundColor: subj.color }}></div>
                  </div>
                  <div className="text-xs text-text-muted w-8 shrink-0 text-right">{subj.val}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptive Insight */}
          <div className="bg-[#fbefe9] p-6 rounded-lg border border-[#EED4C3] text-[#9C4528]">
            <div className="text-[10px] font-semibold uppercase tracking-[1px] flex items-center mb-1"><Zap size={12} className="mr-1" /> {t('prelimsLab.insightTitle')}</div>
            <p className="text-sm mt-2 leading-relaxed">{t('prelimsLab.insightText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrelimsLab;
