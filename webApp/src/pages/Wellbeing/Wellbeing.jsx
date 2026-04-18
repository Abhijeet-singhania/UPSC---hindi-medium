import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause } from 'lucide-react';

const Wellbeing = () => {
  const { t } = useTranslation();
  const [mood, setMood] = useState('good');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const setTimerSession = (minutes, breakMode) => {
    setIsActive(false);
    setIsBreak(breakMode);
    setTimeLeft(minutes * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getMoodAlertContent = () => {
    if (mood === 'burnt') return <div className="p-4 rounded font-medium text-[13px] bg-[#FBEEED] text-[#9C2E24]">Please take a break. Overstudying reduces net retention. </div>;
    if (mood === 'okay') return <div className="p-4 rounded font-medium text-[13px] bg-[#FDF9F5] text-[#9C6F12]">Pacing is key. Keep your sessions light today.</div>;
    if (mood === 'focused') return <div className="p-4 rounded font-medium text-[13px] bg-[#E6F3FB] text-[#1565C0]">Excellent state of mind. Tackle your hardest GS topics now!</div>;
    return <div className="p-4 rounded font-medium text-[13px] bg-[#EBF5F0] text-[#2B7A4B]">{t('wellbeing.moodAlert')}</div>;
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-[24px] font-semibold">{t('wellbeing.subtitle')}</h2>
        <p className="text-[#716F6C] text-[13px] mt-1">{t('wellbeing.desc')}</p>
      </div>

      <div className="flex gap-8 items-stretch mb-6">
        {/* Left Column */}
        <div className="flex-[1.25] flex flex-col gap-6">
          
          {/* Mood Tracker */}
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-[#201E1C] mb-1">{t('wellbeing.moodQ')}</h4>
            <p className="text-[11px] text-[#716F6C] mb-4">{t('wellbeing.moodSub')}</p>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
               <div 
                 className={`border py-6 px-4 rounded-lg flex flex-col items-center gap-3 cursor-pointer transition hover:bg-[#f9f9f9] ${mood === 'burnt' ? 'border-[#D34335] bg-[#FBEEED]' : 'border-[#Eeece9] bg-white'}`}
                 onClick={() => setMood('burnt')}
               >
                 <span className="text-[28px]">😩</span>
                 <span className={`text-[13px] ${mood === 'burnt' ? 'text-[#201E1C] font-medium' : 'text-[#716F6C]'}`}>{t('wellbeing.mood1')}</span>
               </div>
               <div 
                 className={`border py-6 px-4 rounded-lg flex flex-col items-center gap-3 cursor-pointer transition hover:bg-[#f9f9f9] ${mood === 'okay' ? 'border-[#C0933C] bg-[#FDF9F5]' : 'border-[#Eeece9] bg-white'}`}
                 onClick={() => setMood('okay')}
               >
                 <span className="text-[28px]">😐</span>
                 <span className={`text-[13px] ${mood === 'okay' ? 'text-[#201E1C] font-medium' : 'text-[#716F6C]'}`}>{t('wellbeing.mood2')}</span>
               </div>
               <div 
                 className={`border py-6 px-4 rounded-lg flex flex-col items-center gap-3 cursor-pointer transition hover:bg-[#f9f9f9] ${mood === 'good' ? 'border-[#D4613C] bg-[#fbefe9]' : 'border-[#Eeece9] bg-white'}`}
                 onClick={() => setMood('good')}
               >
                 <span className="text-[28px]">😊</span>
                 <span className={`text-[13px] ${mood === 'good' ? 'text-[#201E1C] font-medium' : 'text-[#716F6C]'}`}>{t('wellbeing.mood3')}</span>
               </div>
               <div 
                 className={`border py-6 px-4 rounded-lg flex flex-col items-center gap-3 cursor-pointer transition hover:bg-[#f9f9f9] ${mood === 'focused' ? 'border-[#3C8157] bg-[#EBF5F0]' : 'border-[#Eeece9] bg-white'}`}
                 onClick={() => setMood('focused')}
               >
                 <span className="text-[28px]">🔥</span>
                 <span className={`text-[13px] ${mood === 'focused' ? 'text-[#201E1C] font-medium' : 'text-[#716F6C]'}`}>{t('wellbeing.mood4')}</span>
               </div>
            </div>

            {getMoodAlertContent()}
          </div>

          {/* Pomodoro Timer */}
          <div className="bg-[#121110] text-white rounded-xl p-12 flex flex-col items-center justify-center">
            <div className="mb-6">
              <div className="text-[72px] tracking-[2px] leading-none text-center font-serif">{formatTime(timeLeft)}</div>
              <div className="text-[11px] text-[#A3A19E] uppercase tracking-[2px] mt-2 text-center">{isBreak ? 'BREAK SESSION' : t('wellbeing.focusTitle')}</div>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                className="bg-white/5 border border-white/10 text-[#A3A19E] px-6 py-3 rounded-md text-[13px] cursor-pointer transition hover:bg-white/15 hover:text-white"
                onClick={() => setTimerSession(25, false)}
              >
                {t('wellbeing.focus25')}
              </button>
              <button 
                className="bg-[#D4613C] text-white px-8 py-3 rounded-md text-[14px] font-medium flex items-center cursor-pointer hover:bg-[#e47551]"
                onClick={toggleTimer}
              >
                 {isActive ? <Pause size={16} fill="white" className="mr-2" /> : <Play size={16} fill="white" className="mr-2" />}
                 {isActive ? 'Pause' : t('wellbeing.focusStart')}
              </button>
              <button 
                className="bg-white/5 border border-white/10 text-[#A3A19E] px-6 py-3 rounded-md text-[13px] cursor-pointer transition hover:bg-white/15 hover:text-white"
                onClick={() => setTimerSession(5, true)}
              >
                {t('wellbeing.focusBreak')}
              </button>
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Reality Check */}
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-[#201E1C] mb-4">{t('wellbeing.realityTitle')}</h4>
            
            <div className="flex gap-4 mb-6">
              <div className="bg-[#f4f3ef] p-6 rounded-md text-center flex-1">
                <div className="text-[24px] font-serif font-semibold text-[#201E1C] mb-1">{t('wellbeing.realHrs')}</div>
                <div className="text-[11px] text-[#716F6C] mb-1">{t('wellbeing.realHrsText')}</div>
                <div className="text-[11px] text-[#2B7A4B]">{t('wellbeing.realHrsTarget')}</div>
              </div>
              <div className="bg-[#f4f3ef] p-6 rounded-md text-center flex-1">
                <div className="text-[24px] font-serif font-semibold text-[#201E1C] mb-1">{t('wellbeing.realDays')}</div>
                <div className="text-[11px] text-[#716F6C] mb-1">{t('wellbeing.realDaysText')}</div>
                <div className="text-[11px] text-[#2B7A4B]">{t('wellbeing.realDaysTarget')}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-[#716F6C]">{t('wellbeing.planAdherence')}</span>
                <span className="text-[11px] font-bold text-[#2B7A4B]">78%</span>
              </div>
              <div className="h-[4px] bg-[#eee] rounded-full w-full">
                <div className="h-full rounded-full bg-[#2B7A4B]" style={{width: '78%'}}></div>
              </div>
            </div>

            <div className="bg-[#fbefe9] p-6 rounded-lg border border-[#EED4C3] text-[#9C4528]">
              <div className="text-[10px] font-semibold uppercase tracking-[1px] flex items-center">{t('wellbeing.insightTitle')}</div>
              <p className="text-[13px] mt-2 leading-[1.6]">{t('wellbeing.insightText')}</p>
            </div>

          </div>

          {/* Slow Week */}
          <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-sm">
            <h4 className="font-serif font-semibold text-[#201E1C] mb-2">{t('wellbeing.slowTitle')}</h4>
            <p className="text-[11px] text-[#716F6C] leading-[1.6] mb-4">{t('wellbeing.slowDesc')}</p>
            <button className="w-full justify-center bg-white border border-[#Eeece9] py-2 px-4 rounded-md text-[13px] font-medium text-[#201E1C] flex items-center transition hover:bg-[#f9f9f9]">
              {t('wellbeing.slowBtn')}
            </button>
          </div>

        </div>
      </div>

      {/* Real Stories Grid */}
      <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-sm mt-2">
        <div className="flex justify-between items-end mb-6">
           <h3 className="font-serif font-semibold text-[#201E1C] text-[18px]">{t('wellbeing.storiesTitle')}</h3>
           <span className="text-[11px] text-[#716F6C]">{t('wellbeing.storiesSub')}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
           {/* Story 1 */}
           <div className="bg-[#f4f3ef] p-6 rounded-lg">
             <p className="italic text-[14px] text-[#201E1C] leading-[1.6] mb-6">{t('wellbeing.story1Text')}</p>
             <div className="text-[13px] font-semibold text-[#201E1C]">{t('wellbeing.story1Author')}</div>
             <div className="text-[11px] text-[#716F6C] mt-1">{t('wellbeing.story1Meta')}</div>
           </div>
           
           {/* Story 2 */}
           <div className="bg-[#f4f3ef] p-6 rounded-lg">
             <p className="italic text-[14px] text-[#201E1C] leading-[1.6] mb-6">{t('wellbeing.story2Text')}</p>
             <div className="text-[13px] font-semibold text-[#201E1C]">{t('wellbeing.story2Author')}</div>
             <div className="text-[11px] text-[#716F6C] mt-1">{t('wellbeing.story2Meta')}</div>
           </div>

           {/* Story 3 */}
           <div className="bg-[#f4f3ef] p-6 rounded-lg">
             <p className="italic text-[14px] text-[#201E1C] leading-[1.6] mb-6">{t('wellbeing.story3Text')}</p>
             <div className="text-[13px] font-semibold text-[#201E1C]">{t('wellbeing.story3Author')}</div>
             <div className="text-[11px] text-[#716F6C] mt-1">{t('wellbeing.story3Meta')}</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Wellbeing;
