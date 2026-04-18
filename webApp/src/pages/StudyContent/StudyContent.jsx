import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, PinIcon, Zap } from 'lucide-react';

const StudyContent = () => {
  const { t } = useTranslation();
  
  // Simple state for accordion logic in sidebar
  const [expandedSection, setExpandedSection] = useState('gs3');

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-serif text-[28px] font-semibold text-[#201E1C] mb-1">{t('studyContent.title')}</h2>
        <p className="text-[#716F6C] text-[13px]">{t('studyContent.subtitle')}</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left Topics Nav */}
        <div className="w-[260px] shrink-0 sticky top-[100px]">
          <div className="flex flex-col gap-2">
             <div className="border-b border-[#Eeece9]">
                <button 
                  className="w-full bg-transparent border-none py-3 px-4 text-[14px] font-semibold text-[#201E1C] flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors" 
                  onClick={() => setExpandedSection(expandedSection === 'gs1' ? '' : 'gs1')}
                >
                  {t('studyContent.gsPaper1')} <span>▿</span>
                </button>
             </div>
             <div className="border-b border-[#Eeece9]">
                <button 
                  className="w-full bg-transparent border-none py-3 px-4 text-[14px] font-semibold text-[#201E1C] flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'gs2' ? '' : 'gs2')}
                >
                  {t('studyContent.gsPaper2')} <span>▿</span>
                </button>
             </div>
             
             <div className="border-b border-[#Eeece9]">
                <button 
                  className={`w-full bg-transparent border-none py-3 px-4 text-[14px] font-semibold text-[#201E1C] flex justify-between items-center cursor-pointer transition-colors ${expandedSection === 'gs3' ? 'bg-[#121110] text-white rounded-md hover:bg-[#121110]' : 'hover:bg-black/5'}`}
                  onClick={() => setExpandedSection(expandedSection === 'gs3' ? '' : 'gs3')}
                >
                  {t('studyContent.gsPaper3')} <span>▾</span>
                </button>
                {expandedSection === 'gs3' && (
                  <div className="py-3 pl-6">
                    <ul className="flex flex-col gap-3 list-none border-l-2 border-[#Eeece9] ml-2">
                      <li className="relative pl-4 text-[13px] text-[#716F6C] cursor-pointer leading-[1.4] hover:text-[#201E1C]"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-[#Eeece9]"></span> {t('studyContent.nav1')}</li>
                      <li className="relative pl-4 text-[13px] text-[#716F6C] cursor-pointer leading-[1.4] hover:text-[#201E1C]"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-[#Eeece9]"></span> {t('studyContent.nav2')}</li>
                      <li className="relative pl-4 text-[13px] text-[#201E1C] cursor-pointer leading-[1.4] hover:text-[#201E1C] font-semibold bg-[#fbefe9] py-1 rounded-r-md"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-primary"></span> {t('studyContent.nav3')}</li>
                      <li className="relative pl-4 text-[13px] text-[#716F6C] cursor-pointer leading-[1.4] hover:text-[#201E1C]"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-[#Eeece9]"></span> {t('studyContent.nav4')}</li>
                      <li className="relative pl-4 text-[13px] text-[#716F6C] cursor-pointer leading-[1.4] hover:text-[#201E1C]"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-[#Eeece9]"></span> {t('studyContent.nav5')}</li>
                      <li className="relative pl-4 text-[13px] text-[#716F6C] cursor-pointer leading-[1.4] hover:text-[#201E1C]"><span className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-[#Eeece9]"></span> {t('studyContent.nav6')}</li>
                    </ul>
                  </div>
                )}
             </div>

             <div className="border-b border-[#Eeece9]">
                <button 
                  className="w-full bg-transparent border-none py-3 px-4 text-[14px] font-semibold text-[#201E1C] flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'gs4' ? '' : 'gs4')}
                >
                  {t('studyContent.gsPaper4')} <span>▿</span>
                </button>
             </div>
             <div className="border-b border-[#Eeece9]">
                <button 
                  className="w-full bg-transparent border-none py-3 px-4 text-[14px] font-semibold text-[#201E1C] flex justify-between items-center cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === 'optional' ? '' : 'optional')}
                >
                  {t('studyContent.optional')} <span>▿</span>
                </button>
             </div>
          </div>
        </div>

        {/* Right Reader Area */}
        <div className="flex-1 p-[48px] bg-white border border-[#Eeece9] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
           <div className="flex justify-between items-center mb-6">
             <div className="text-[#716F6C] text-[13px]">
                GS3 &rsaquo; Economy &rsaquo; <strong className="text-[#201E1C] font-semibold">{t('studyContent.nav3')}</strong>
             </div>
             <div className="flex gap-2">
                <span className="px-2 py-1 rounded text-[10px] uppercase font-semibold tracking-wider bg-[#e6f3eb] text-[#2B7A4B]">✓ 2 PYQs</span>
                <span className="px-2 py-1 rounded text-[10px] uppercase font-semibold tracking-wider bg-[#f0f0f0] text-[#716F6C]">{t('studyContent.revMode')}</span>
             </div>
           </div>

           <div className="border-b border-[#Eeece9] pb-6 mb-8">
             <h1 className="text-[32px] font-serif font-semibold text-[#201E1C] mb-2">{t('studyContent.topicTitle')}</h1>
             <div className="flex justify-between items-center text-[13px] w-full">
               <div className="flex gap-2 items-center">
                 <span className="text-[#716F6C]">{t('studyContent.topicContext').split('|')[0]}</span>
                 <span className="px-2 py-1 rounded text-[10px] uppercase font-semibold tracking-wider bg-[#fbefe9] text-primary">{t('studyContent.topicContext').split('|')[1]}</span>
               </div>
               <span className="text-[#716F6C]">{t('studyContent.readTime')}</span>
             </div>
           </div>

           <div className="text-[15px] leading-[1.8] text-[#333]">
             <h3 className="mt-8 mb-4 text-[18px] font-serif font-semibold text-[#201E1C]">{t('studyContent.q1Title')}</h3>
             <p className="mb-5">{t('studyContent.q1Body1')}</p>
             <p className="mb-5">{t('studyContent.q1Body2')}</p>

             <div className="bg-[#fbefe9] rounded-md p-6 my-8">
                <div className="text-[10px] font-semibold text-primary uppercase tracking-[1px] mb-3 flex items-center"><PinIcon size={12} className="mr-2" /> {t('studyContent.pyq')}</div>
                <div className="italic text-[14px] text-[#201E1C] mb-3 leading-[1.6]">
                  {t('studyContent.pyqQuestion1')}
                </div>
                <div className="text-[10px] text-primary/80 tracking-[1px] uppercase">{t('studyContent.pyqRef1')}</div>
             </div>

             <h3 className="mt-8 mb-4 text-[18px] font-serif font-semibold text-[#201E1C]">{t('studyContent.q2Title')}</h3>
             <ul className="list-none mb-6">
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>{t('studyContent.bullet1')}</li>
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>{t('studyContent.bullet2')}</li>
             </ul>

             <h3 className="mt-8 mb-4 text-[18px] font-serif font-semibold text-[#201E1C]">{t('studyContent.q3Title')}</h3>
             <p className="mb-5">The Fiscal Responsibility and Budget Management (FRBM) Act, 2003 was India's landmark step toward rule-based fiscal management. It mandates that the government maintains fiscal deficit within specified limits and presents medium-term fiscal policy statements along with the Budget.</p>
             
             <div className="bg-[#fbefe9] rounded-md p-6 my-8">
                <div className="text-[10px] font-semibold text-primary uppercase tracking-[1px] mb-3 flex items-center"><PinIcon size={12} className="mr-2" /> {t('studyContent.pyq')}</div>
                <div className="italic text-[14px] text-[#201E1C] mb-3 leading-[1.6]">
                  {t('studyContent.pyqQuestion2')}
                </div>
                <div className="text-[10px] text-primary/80 tracking-[1px] uppercase">{t('studyContent.pyqRef2')}</div>
             </div>

             <p className="font-semibold text-[#201E1C] mt-6 mb-4">{t('studyContent.keyData')}</p>
             <ul className="list-none mb-6">
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>{t('studyContent.dataBull1')}</li>
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>{t('studyContent.dataBull2')}</li>
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>{t('studyContent.dataBull3')}</li>
               <li className="relative pl-6 mb-3"><span className="absolute left-0 top-2 w-[6px] h-[6px] rounded-full bg-primary"></span>Revenue Deficit: 2% of GDP — indicates fiscal quality concern</li>
             </ul>

           </div>
           
           {/* Action Buttons */}
           <div className="flex gap-4 pt-8 border-t border-[#Eeece9] mt-8">
             <button className="bg-primary hover:bg-primary-hover border-none text-white flex items-center gap-2 py-2 px-4 rounded-md text-[13px] font-medium transition-colors cursor-pointer"><PenLine size={16} /> {t('studyContent.btnWriteAns')}</button>
             <button className="bg-white border border-[#Eeece9] py-2 px-4 rounded-md text-[13px] font-medium text-[#201E1C] flex items-center gap-2 cursor-pointer hover:bg-[#f9f9f9] transition-colors">✧ {t('studyContent.btnMcq')}</button>
             <button className="bg-white border border-[#Eeece9] py-2 px-4 rounded-md text-[13px] font-medium text-[#201E1C] flex items-center gap-2 cursor-pointer hover:bg-[#f9f9f9] transition-colors"><Zap size={16} color="#D4613C" /> {t('studyContent.btnFlashcard')}</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudyContent;
