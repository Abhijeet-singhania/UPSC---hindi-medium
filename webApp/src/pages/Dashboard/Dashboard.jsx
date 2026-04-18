import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle } from 'lucide-react';

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting Card */}
      <div className="bg-gradient-to-br from-[#181715] to-[#2B2A27] rounded-2xl py-8 px-12 flex justify-between items-center text-white">
        <div>
          <div className="text-[11px] tracking-[2px] mb-2 text-[#A3A19E]">GOOD MORNING</div>
          <h1 className="text-[32px] font-serif mb-2">{t('dashboard.greeting')}</h1>
          <p className="text-[#A3A19E] text-[14px] mb-6">{t('dashboard.greetingSub')}</p>
          <div className="flex gap-4">
            <button className="bg-primary hover:bg-primary-hover text-white flex items-center justify-center py-2 px-4 rounded-md text-[13px] font-medium transition-colors border-none cursor-pointer">{t('dashboard.todaysPlanBtn')}</button>
            <button className="bg-transparent border border-[#716F6C] text-white py-2 px-4 rounded-md text-[13px] cursor-pointer hover:bg-white/5 transition-colors">{t('dashboard.todaysCABtn')}</button>
          </div>
        </div>
        <div className="text-right border-l border-[#2f2d2a] pl-8">
          <h2 className="text-[48px] text-[#EFE4D6] leading-none font-serif">147</h2>
          <p className="font-sans text-[10px] tracking-[1px] text-[#A3A19E] mt-1">{t('dashboard.daysToPrelims')}</p>
          <span className="text-[12px] text-[#716F6C]">25 May 2025</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-[#716F6C] uppercase tracking-[1px] mb-2">{t('dashboard.readinessScore')}</div>
          <div className="text-[32px] font-serif text-[#201E1C]">67</div>
          <div className="text-[12px] text-[#716F6C] mb-4">{t('dashboard.ptsThisWeek')}</div>
          <div className="h-1 bg-[#Eeece9] rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-primary" style={{ width: '67%' }}></div>
          </div>
        </div>
        
        <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-[#716F6C] uppercase tracking-[1px] mb-2">{t('dashboard.answersWritten')}</div>
          <div className="text-[32px] font-serif text-[#201E1C]">84</div>
          <div className="text-[12px] text-[#716F6C] mb-4">{t('dashboard.avgScore')}</div>
          <div className="h-1 bg-[#Eeece9] rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-[#2B7A4B]" style={{ width: '56%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-[#716F6C] uppercase tracking-[1px] mb-2">{t('dashboard.prelimsAccuracy')}</div>
          <div className="text-[32px] font-serif text-[#201E1C]">71%</div>
          <div className="text-[12px] text-[#716F6C] mb-4">{t('dashboard.questionsSolved')}</div>
          <div className="h-1 bg-[#Eeece9] rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-[#BFA532]" style={{ width: '71%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-[#Eeece9] p-5 rounded-xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] text-[#716F6C] uppercase tracking-[1px] mb-2">{t('dashboard.syllabusCoverage')}</div>
          <div className="text-[32px] font-serif text-[#201E1C]">58%</div>
          <div className="text-[12px] text-[#716F6C] mb-4">{t('dashboard.gsOptional')}</div>
          <div className="h-1 bg-[#Eeece9] rounded-full w-full mt-auto">
            <div className="h-full rounded-full bg-[#201E1C]" style={{ width: '58%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          {/* Today's Plan */}
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.todaysPlan')}</h3>
                <span className="text-[#716F6C] text-[13px]">{t('dashboard.tasksCompleted')}</span>
              </div>
              <button className="bg-transparent border-none text-[#716F6C] text-[13px] cursor-pointer hover:text-[#201E1C] transition-colors">{t('dashboard.fullPlan')} →</button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <CheckCircle2 color="#2B7A4B" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-[#201E1C] mb-1">Revolt of 1857 — Causes & Significance</div>
                  <div className="text-[12px] text-[#716F6C]">NCERT Ch. 11 · PYQ linked · <span className="bg-[#f0f0f0] py-[2px] px-[6px] rounded text-[10px]">90 min</span></div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <CheckCircle2 color="#2B7A4B" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-[#201E1C] mb-1">Today's Digest — 7 items</div>
                  <div className="text-[12px] text-[#716F6C]">Current Affairs</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Circle color="#A3A19E" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-[#201E1C] mb-1">Monetary Policy & RBI Tools</div>
                  <div className="text-[12px] text-[#716F6C]">NCERT + Mrunal · PYQ 2019, 2022 · <span className="bg-[#f0f0f0] py-[2px] px-[6px] rounded text-[10px]">90 min</span></div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Circle color="#A3A19E" size={20} className="shrink-0" />
                <div>
                  <div className="text-[14px] font-medium text-[#201E1C] mb-1">Write 1 GS3 Economy answer</div>
                  <div className="text-[12px] text-[#716F6C]">Today's prompt ready · <span className="bg-[#f0f0f0] py-[2px] px-[6px] rounded text-[10px]">30 min</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.studyActivity')}</h3>
              <span className="text-[#716F6C] text-[13px]">{t('dashboard.last8Weeks')}</span>
            </div>
            <div className="flex flex-col gap-1 w-full max-w-[max-content]">
               {/* 7 rows x 8 cols mock */}
               {Array.from({length: 7}).map((_, rIdx) => (
                  <div className="flex gap-1 items-center" key={rIdx}>
                    <span className="text-[10px] text-[#716F6C] w-6">{rIdx % 2 === 0 ? ['Mon','Wed','Fri','Sun'][rIdx/2] : ''}</span>
                    {Array.from({length: 8}).map((_, cIdx) => {
                      const level = Math.floor(Math.random() * 5) + 1;
                      const bgMap = {1: 'bg-[#fbefe9]', 2: 'bg-[#efa98d]', 3: 'bg-primary', 4: 'bg-[#a84728]', 5: 'bg-[#6d2c16]'};
                      return <div key={cIdx} className={`w-4 h-4 rounded-[3px] ${bgMap[level]}`}></div>
                    })}
                  </div>
               ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-[12px] text-[#716F6C]">
              {t('dashboard.less')} 
              <div className="w-4 h-4 rounded-[3px] bg-[#fbefe9]"></div>
              <div className="w-4 h-4 rounded-[3px] bg-[#efa98d]"></div>
              <div className="w-4 h-4 rounded-[3px] bg-primary"></div>
              <div className="w-4 h-4 rounded-[3px] bg-[#a84728]"></div>
              <div className="w-4 h-4 rounded-[3px] bg-[#6d2c16]"></div>
              {t('dashboard.more')}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* CA Digest */}
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-[18px] font-semibold">{t('dashboard.todaysCADigest')}</h3>
              <span className="text-[#716F6C] text-[13px]">{t('dashboard.newItems')}</span>
            </div>
            
            <div className="flex flex-col gap-3">
               <div className="border border-[#Eeece9] border-l-[4px] border-l-primary p-3 px-4 rounded-md bg-[#FAFAFA]">
                  <div className="text-[10px] font-semibold text-primary mb-1 uppercase tracking-wider">GS2 - IR</div>
                  <div className="text-[14px] font-semibold text-[#201E1C] mb-1">India-Maldives diplomatic reset</div>
                  <div className="text-[12px] text-[#716F6C]">Connects: India's neighbourhood policy · SAARC</div>
               </div>
               <div className="border border-[#Eeece9] border-l-[4px] border-l-[#2B7A4B] p-3 px-4 rounded-md bg-[#FAFAFA]">
                  <div className="text-[10px] font-semibold text-[#2B7A4B] mb-1 uppercase tracking-wider">GS3 - ECONOMY</div>
                  <div className="text-[14px] font-semibold text-[#201E1C] mb-1">RBI holds repo rate at 6.5%</div>
                  <div className="text-[12px] text-[#716F6C]">Connects: Monetary Policy · Inflation targeting</div>
               </div>
               <div className="border border-[#Eeece9] border-l-[4px] border-l-[#BFA532] p-3 px-4 rounded-md bg-[#FAFAFA]">
                  <div className="text-[10px] font-semibold text-[#BFA532] mb-1 uppercase tracking-wider">GS3 - ENVIRONMENT</div>
                  <div className="text-[14px] font-semibold text-[#201E1C] mb-1">COP29 outcome — India's stance</div>
                  <div className="text-[12px] text-[#716F6C]">Connects: Climate Finance · UNFCCC</div>
               </div>
            </div>
            <button className="w-full py-[10px] border border-[#Eeece9] bg-white rounded-md text-[13px] font-medium text-[#201E1C] mt-auto cursor-pointer hover:bg-[#f9f9f9] transition-colors">{t('dashboard.viewAll')}</button>
          </div>

          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-serif text-[18px] font-semibold mb-1">{t('dashboard.readinessBreakdown')}</h3>
                <span className="text-[#716F6C] text-[13px]">{t('dashboard.subjectWiseMap')}</span>
              </div>
              <div className="w-[60px] h-[60px] rounded-full border-[4px] border-primary flex items-center justify-center text-center font-serif text-[20px] text-[#201E1C] shrink-0">
                 <span>67<br/><span className="block text-[8px] font-sans text-[#716F6C] font-semibold tracking-wider uppercase mt-[2px]">SCORE</span></span>
              </div>
            </div>
            <div>
               <div className="flex items-center gap-3 mb-3 text-[13px]">
                 <span className="w-[180px] shrink-0 text-[#716F6C]">GS1 - History, Geography</span>
                 <div className="flex-1 h-[6px] bg-[#Eeece9] rounded-full"><div className="h-full rounded-full bg-[#2B7A4B]" style={{width:'78%'}}></div></div>
                 <span className="w-[30px] font-medium text-right">78%</span>
               </div>
               <div className="flex items-center gap-3 mb-3 text-[13px]">
                 <span className="w-[180px] shrink-0 text-[#716F6C]">GS2 - Polity & Governance</span>
                 <div className="flex-1 h-[6px] bg-[#Eeece9] rounded-full"><div className="h-full rounded-full bg-[#2B7A4B]" style={{width:'82%'}}></div></div>
                 <span className="w-[30px] font-medium text-right">82%</span>
               </div>
               <div className="flex items-center gap-3 text-[13px]">
                 <span className="w-[180px] shrink-0 text-[#716F6C]">GS3 - Economy, Science</span>
                 <div className="flex-1 h-[6px] bg-[#Eeece9] rounded-full"><div className="h-full rounded-full bg-primary" style={{width:'45%'}}></div></div>
                 <span className="w-[30px] font-medium text-right">45%</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
