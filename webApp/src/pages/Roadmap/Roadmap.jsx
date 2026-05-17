import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

const Roadmap = () => {
  const { t } = useTranslation();
  const [showNextWeek, setShowNextWeek] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Roadmap Header Phase Progress */}
      <div>
         <div className="mb-6">
           <h2 className="text-[28px] font-serif font-semibold mb-1">{t('roadmap.title')}</h2>
           <p className="text-text-muted text-[13px]">{t('roadmap.subtitle')}</p>
         </div>
         <div className="grid grid-cols-4 gap-4">
           <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-[#2B7A4B]">{t('roadmap.phase1')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-text-primary">{t('roadmap.phase1Title')}</h4>
              <div className="mt-auto text-[13px] text-text-muted">Jun - Aug 2025</div>
              <div className="h-[6px] bg-border-default rounded-full mt-2 w-full"><div className="h-full rounded-full bg-[#2B7A4B]" style={{width: '100%'}}></div></div>
           </div>
           
           <div className="bg-[#fbefe9] border border-primary p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-primary">{t('roadmap.phase2')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-text-primary">{t('roadmap.phase2Title')}</h4>
              <div className="mt-auto text-[13px] text-text-muted">Sep 2025 - Jan 2026</div>
              <div className="h-[6px] bg-border-default rounded-full mt-2 w-full"><div className="h-full rounded-full bg-primary" style={{width: '64%'}}></div></div>
              <div className="text-[11px] text-primary font-semibold mt-2 tracking-wide">→ Week 14 of 22</div>
           </div>

           <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-60">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-text-muted">{t('roadmap.phase3')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-text-primary">{t('roadmap.phase3Title')}</h4>
              <div className="mt-auto text-[13px] text-text-muted">Feb - Apr 2026</div>
              <div className="h-[6px] bg-border-default rounded-full mt-2 w-full"></div>
           </div>

           <div className="bg-bg-panel border border-border-default p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-60">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-text-muted">{t('roadmap.phase4')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-text-primary">{t('roadmap.phase4Title')}</h4>
              <div className="mt-auto text-[13px] text-text-muted">May 2026</div>
              <div className="h-[6px] bg-border-default rounded-full mt-2 w-full"></div>
           </div>
         </div>
      </div>

      {/* Week Schedule Table */}
      <div className="bg-bg-panel border border-border-default rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-6 pt-5">
          <div>
            <h3 className="font-serif text-[18px] font-semibold mb-1">{t('roadmap.week')} 14 — {t('roadmap.thisWeek')}</h3>
            <span className="text-text-muted text-[13px]">GS3: Economy Deep Dive + IR Prelims Practice</span>
          </div>
          <span className="text-text-muted text-[13px] flex items-center gap-1">3/5 {t('roadmap.daysDone')}</span>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-surface-dark text-text-primary text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.day')}</th>
                <th className="bg-bg-surface-dark text-text-primary text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.morningSession')}</th>
                <th className="bg-bg-surface-dark text-text-primary text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.afternoonSession')}</th>
                <th className="bg-bg-surface-dark text-text-primary text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.eveningSession')}</th>
                <th className="bg-bg-surface-dark text-text-primary text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.status')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-default">
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">{t('roadmap.mon')}</td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Monetary Policy & RBI</strong>
                  <div className="text-[11px] text-text-muted">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">30 MCQs — Economy Prelims</strong>
                  <div className="text-[11px] text-text-muted">Adaptive set</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-text-muted">Daily routine</div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-border-default">
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">{t('roadmap.tue')}</td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Fiscal Policy & Budget</strong>
                  <div className="text-[11px] text-text-muted">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Answer Writing — GS3</strong>
                  <div className="text-[11px] text-text-muted">Economy question</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-text-muted"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-border-default">
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">{t('roadmap.wed')}</td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">India's Balance of Payments</strong>
                  <div className="text-[11px] text-text-muted">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">PSIR — Political Theory</strong>
                  <div className="text-[11px] text-text-muted">Optional</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-text-muted"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-border-default bg-bg-base">
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex items-center text-primary font-semibold">{t('roadmap.thu')} <ChevronRight size={14} className="ml-1" color="#D4613C" /></span></td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Monetary Policy & RBI Tools</strong>
                  <div className="text-[11px] text-text-muted">GS3 Economy - cont.</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">30 MCQs — Mixed</strong>
                  <div className="text-[11px] text-text-muted">Adaptive</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">CA + Answer Writing</strong>
                  <div className="text-[11px] text-text-muted"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-tag-orange text-primary">{t('roadmap.today')}</span></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">{t('roadmap.fri')}</td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Weekly Revision — GS3</strong>
                  <div className="text-[11px] text-text-muted">Mind maps + Notes</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Full Mock — 50 MCQs</strong>
                  <div className="text-[11px] text-text-muted">Timed test</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-text-primary align-top">
                  <strong className="block font-medium mb-1">Weekly CA Quiz</strong>
                  <div className="text-[11px] text-text-muted"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent border border-border-default text-text-muted">{t('roadmap.upcoming')}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          onClick={() => setShowNextWeek(v => !v)}
          className="w-full flex justify-between items-center py-4 px-6 bg-bg-panel-hover border-t border-border-default text-[14px] font-medium text-text-primary hover:bg-bg-surface transition cursor-pointer"
        >
          <span>{t('roadmap.week')} 15 — {t('roadmap.nextWeek')}</span>
          <span className="text-text-muted text-[13px] flex items-center gap-1">
            {t('roadmap.upcoming')} {showNextWeek ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </span>
        </button>
        {showNextWeek && (
          <div className="px-6 pb-4 border-t border-border-default">
            <table className="w-full border-collapse mt-3">
              <tbody>
                <tr className="border-b border-border-default">
                  <td className="py-3 px-2 text-[13px] text-text-primary w-16">{t('roadmap.mon')}</td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">Trade Policy &amp; WTO</strong><div className="text-[11px] text-text-muted">GS3 Economy</div></td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">30 MCQs — Economy</strong><div className="text-[11px] text-text-muted">Adaptive set</div></td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">CA + Flashcards</strong></td>
                  <td className="py-3 px-2"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent border border-border-default text-text-muted">{t('roadmap.upcoming')}</span></td>
                </tr>
                <tr className="border-b border-border-default">
                  <td className="py-3 px-2 text-[13px] text-text-primary">{t('roadmap.tue')}</td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">Infrastructure &amp; PPP</strong><div className="text-[11px] text-text-muted">GS3 Economy</div></td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">Answer Writing — GS3</strong></td>
                  <td className="py-3 px-2 text-[13px] text-text-primary"><strong className="block font-medium">CA + Flashcards</strong></td>
                  <td className="py-3 px-2"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent border border-border-default text-text-muted">{t('roadmap.upcoming')}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Syllabus Coverage Map */}
      <div className="bg-bg-panel border border-border-default p-6 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-[18px] font-semibold">{t('roadmap.syllabusMap')}</h3>
          <span className="text-text-muted text-[13px]">{t('roadmap.overall')}: 58% {t('roadmap.complete')}</span>
        </div>
        
        <div className="flex gap-8">
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-text-primary pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper1')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Ancient History</span> <span className="font-medium text-text-primary">✓ 100%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Medieval History</span> <span className="font-medium text-text-primary">✓ 100%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Modern History</span> <span className="font-medium text-primary">90%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>World History</span> <span className="font-medium text-primary">60%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Indian Geography</span> <span className="font-medium text-primary">75%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>World Geography</span> <span className="font-medium text-primary">40%</span></li>
             </ul>
          </div>
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-text-primary pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper2')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Constitution</span> <span className="font-medium text-[#2B7A4B]">96%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Polity & Governance</span> <span className="font-medium text-[#2B7A4B]">88%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Social Justice</span> <span className="font-medium text-primary">65%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>IR & Bilateral</span> <span className="font-medium text-primary">70%</span></li>
             </ul>
          </div>
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-text-primary pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper3')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Indian Economy</span> <span className="font-medium text-primary">64%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Agriculture</span> <span className="font-medium text-primary">35%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Science & Tech</span> <span className="font-medium text-primary">42%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Environment</span> <span className="font-medium text-primary">58%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-text-muted"><span>Security</span> <span className="font-medium text-primary">30%</span></li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
