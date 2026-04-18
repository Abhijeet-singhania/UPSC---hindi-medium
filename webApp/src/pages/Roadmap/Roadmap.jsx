import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';

const Roadmap = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      {/* Roadmap Header Phase Progress */}
      <div>
         <div className="mb-6">
           <h2 className="text-[28px] font-serif font-semibold mb-1">{t('roadmap.title')}</h2>
           <p className="text-[#716F6C] text-[13px]">{t('roadmap.subtitle')}</p>
         </div>
         <div className="grid grid-cols-4 gap-4">
           <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-[#2B7A4B]">{t('roadmap.phase1')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-[#201E1C]">{t('roadmap.phase1Title')}</h4>
              <div className="mt-auto text-[13px] text-[#716F6C]">Jun - Aug 2024</div>
              <div className="h-[6px] bg-[#Eeece9] rounded-full mt-2 w-full"><div className="h-full rounded-full bg-[#2B7A4B]" style={{width: '100%'}}></div></div>
           </div>
           
           <div className="bg-[#fbefe9] border border-primary p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-primary">{t('roadmap.phase2')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-[#201E1C]">{t('roadmap.phase2Title')}</h4>
              <div className="mt-auto text-[13px] text-[#716F6C]">Sep 2024 - Jan 2025</div>
              <div className="h-[6px] bg-[#Eeece9] rounded-full mt-2 w-full"><div className="h-full rounded-full bg-primary" style={{width: '64%'}}></div></div>
              <div className="text-[11px] text-primary font-semibold mt-2 tracking-wide">→ Week 14 of 22</div>
           </div>

           <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-60">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-[#716F6C]">{t('roadmap.phase3')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-[#201E1C]">{t('roadmap.phase3Title')}</h4>
              <div className="mt-auto text-[13px] text-[#716F6C]">Feb - Apr 2025</div>
              <div className="h-[6px] bg-[#Eeece9] rounded-full mt-2 w-full"></div>
           </div>

           <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col min-h-[140px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-60">
              <span className="text-[10px] tracking-[1px] font-semibold uppercase mb-3 text-[#716F6C]">{t('roadmap.phase4')}</span>
              <h4 className="font-serif font-semibold text-[16px] text-[#201E1C]">{t('roadmap.phase4Title')}</h4>
              <div className="mt-auto text-[13px] text-[#716F6C]">May 2025</div>
              <div className="h-[6px] bg-[#Eeece9] rounded-full mt-2 w-full"></div>
           </div>
         </div>
      </div>

      {/* Week Schedule Table */}
      <div className="bg-white border border-[#Eeece9] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-6 pt-5">
          <div>
            <h3 className="font-serif text-[18px] font-semibold mb-1">{t('roadmap.week')} 14 — {t('roadmap.thisWeek')}</h3>
            <span className="text-[#716F6C] text-[13px]">GS3: Economy Deep Dive + IR Prelims Practice</span>
          </div>
          <span className="text-[#716F6C] text-[13px] flex items-center gap-1 cursor-pointer">{t('roadmap.daysDone')} <ChevronDown size={14}/></span>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-[#121110] text-white text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.day')}</th>
                <th className="bg-[#121110] text-white text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.morningSession')}</th>
                <th className="bg-[#121110] text-white text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.afternoonSession')}</th>
                <th className="bg-[#121110] text-white text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.eveningSession')}</th>
                <th className="bg-[#121110] text-white text-left text-[10px] tracking-[1px] uppercase py-3 px-6 font-semibold">{t('roadmap.status')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#Eeece9]">
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">{t('roadmap.mon')}</td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Monetary Policy & RBI</strong>
                  <div className="text-[11px] text-[#716F6C]">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">30 MCQs — Economy Prelims</strong>
                  <div className="text-[11px] text-[#716F6C]">Adaptive set</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-[#716F6C]">Daily routine</div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-[#Eeece9]">
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">{t('roadmap.tue')}</td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Fiscal Policy & Budget</strong>
                  <div className="text-[11px] text-[#716F6C]">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Answer Writing — GS3</strong>
                  <div className="text-[11px] text-[#716F6C]">Economy question</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-[#716F6C]"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-[#Eeece9]">
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">{t('roadmap.wed')}</td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">India's Balance of Payments</strong>
                  <div className="text-[11px] text-[#716F6C]">GS3 Economy</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">PSIR — Political Theory</strong>
                  <div className="text-[11px] text-[#716F6C]">Optional</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">CA + Flashcards</strong>
                  <div className="text-[11px] text-[#716F6C]"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#2B7A4B]">✓ {t('roadmap.done')}</span></td>
              </tr>
              <tr className="border-b border-[#Eeece9] bg-[#FDFBF8]">
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex items-center text-primary font-semibold">{t('roadmap.thu')} <ChevronRight size={14} className="ml-1" color="#D4613C" /></span></td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Monetary Policy & RBI Tools</strong>
                  <div className="text-[11px] text-[#716F6C]">GS3 Economy - cont.</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">30 MCQs — Mixed</strong>
                  <div className="text-[11px] text-[#716F6C]">Adaptive</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">CA + Answer Writing</strong>
                  <div className="text-[11px] text-[#716F6C]"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-tag-orange text-primary">{t('roadmap.today')}</span></td>
              </tr>
              <tr>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">{t('roadmap.fri')}</td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Weekly Revision — GS3</strong>
                  <div className="text-[11px] text-[#716F6C]">Mind maps + Notes</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Full Mock — 50 MCQs</strong>
                  <div className="text-[11px] text-[#716F6C]">Timed test</div>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#201E1C] align-top">
                  <strong className="block font-medium mb-1">Weekly CA Quiz</strong>
                  <div className="text-[11px] text-[#716F6C]"></div>
                </td>
                <td className="py-4 px-6 text-[13px] align-top"><span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-transparent border border-[#Eeece9] text-[#716F6C]">{t('roadmap.upcoming')}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center py-4 px-6 bg-[#FAFAFA] border-t border-[#Eeece9] text-[14px] font-medium text-[#201E1C]">
           <span>{t('roadmap.thisWeek')} 15 — {t('roadmap.nextWeek')}</span>
           <span className="text-[#716F6C] text-[13px] flex items-center gap-1 cursor-pointer">{t('roadmap.upcoming')} <ChevronDown size={14}/></span>
        </div>
      </div>

      {/* Syllabus Coverage Map */}
      <div className="bg-white border border-[#Eeece9] p-6 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-[18px] font-semibold">{t('roadmap.syllabusMap')}</h3>
          <span className="text-[#716F6C] text-[13px]">{t('roadmap.overall')}: 58% {t('roadmap.complete')}</span>
        </div>
        
        <div className="flex gap-8">
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-[#201E1C] pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper1')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Ancient History</span> <span className="font-medium text-[#201E1C]">✓ 100%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Medieval History</span> <span className="font-medium text-[#201E1C]">✓ 100%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Modern History</span> <span className="font-medium text-primary">90%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>World History</span> <span className="font-medium text-primary">60%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Indian Geography</span> <span className="font-medium text-primary">75%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>World Geography</span> <span className="font-medium text-primary">40%</span></li>
             </ul>
          </div>
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-[#201E1C] pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper2')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Constitution</span> <span className="font-medium text-[#2B7A4B]">96%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Polity & Governance</span> <span className="font-medium text-[#2B7A4B]">88%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Social Justice</span> <span className="font-medium text-primary">65%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>IR & Bilateral</span> <span className="font-medium text-primary">70%</span></li>
             </ul>
          </div>
          <div className="flex-1">
             <div className="text-[13px] font-semibold border-b-[2px] border-[#201E1C] pb-2 mb-4 uppercase tracking-wide">{t('roadmap.gsPaper3')}</div>
             <ul className="list-none">
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Indian Economy</span> <span className="font-medium text-primary">64%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Agriculture</span> <span className="font-medium text-primary">35%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Science & Tech</span> <span className="font-medium text-primary">42%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Environment</span> <span className="font-medium text-primary">58%</span></li>
               <li className="flex justify-between text-[13px] py-2 text-[#716F6C]"><span>Security</span> <span className="font-medium text-primary">30%</span></li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
