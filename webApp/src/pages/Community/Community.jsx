import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, MessageCircle } from 'lucide-react';

const Community = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-[28px] font-semibold text-[#201E1C] mb-1">{t('community.title')}</h2>
        <p className="text-[#716F6C] text-[13px]">{t('community.subtitle')}</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Main Feed Area */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-[#Eeece9] mb-6">
            <button 
              className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'feed' ? 'text-primary' : 'text-[#716F6C]'}`}
              onClick={() => setActiveTab('feed')}
            >
              {t('community.tabFeed')}
              {activeTab === 'feed' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
            </button>
            <button 
              className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'groups' ? 'text-primary' : 'text-[#716F6C]'}`}
              onClick={() => setActiveTab('groups')}
            >
              {t('community.tabGroups')}
              {activeTab === 'groups' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
            </button>
            <button 
              className={`bg-transparent border-none py-3 text-[14px] font-medium relative cursor-pointer ${activeTab === 'topper' ? 'text-primary' : 'text-[#716F6C]'}`}
              onClick={() => setActiveTab('topper')}
            >
              {t('community.tabTopper')}
              {activeTab === 'topper' && <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary"></span>}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <span className="border border-[#Eeece9] py-1.5 px-4 rounded-full text-[13px] text-[#201E1C] bg-white cursor-pointer hover:bg-[#f9f9f9] transition-colors">{t('community.filterAll')}</span>
            <span className="border border-[#121110] py-1.5 px-4 rounded-full text-[13px] text-white bg-[#121110] cursor-pointer">{t('community.filterGS3')}</span>
            <span className="border border-[#Eeece9] py-1.5 px-4 rounded-full text-[13px] text-[#201E1C] bg-white cursor-pointer hover:bg-[#f9f9f9] transition-colors">{t('community.filterPolity')}</span>
            <span className="border border-[#Eeece9] py-1.5 px-4 rounded-full text-[13px] text-[#201E1C] bg-white cursor-pointer hover:bg-[#f9f9f9] transition-colors">{t('community.filterReview')}</span>
          </div>

          {/* Post Lists */}
          <div className="flex flex-col gap-6">
            
            {/* Post 1 */}
            <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E2DFD8] text-[#201E1C] flex items-center justify-center text-[13px] font-semibold shrink-0">P</div>
                  <div>
                    <div className="font-medium text-[#201E1C] text-[14px]">{t('community.post1Author')}</div>
                    <div className="text-xs text-[#716F6C] flex items-center gap-2">
                       {t('community.post1Time')} <span className="w-1 h-1 rounded-full bg-[#716F6C] mx-1"></span> {t('community.post1Context')}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] py-0.5 px-2 rounded-[12px] border border-[#EED4C3] text-primary">{t('community.post1Badge')}</span>
              </div>
              <h4 className="text-[#201E1C] font-semibold text-[16px] mb-2">{t('community.post1Title')}</h4>
              <p className="text-sm text-[#201E1C] leading-relaxed mb-4">{t('community.post1Desc')}</p>
              
              <div className="flex justify-between items-center border-t border-[#f0f0f0] pt-4">
                <div className="flex items-center gap-4 text-sm text-[#716F6C]">
                  <div className="flex items-center gap-1 text-primary font-medium"><Flame size={14}/> 24</div>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#201E1C]"><MessageCircle size={14}/> {t('community.post1Replies')}</div>
                </div>
                <button className="bg-transparent border-none text-sm font-medium text-primary cursor-pointer hover:underline">{t('community.btnReply')}</button>
              </div>
            </div>

            {/* Post 2 */}
            <div className="bg-white border border-[#Eeece9] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#DDE8EC] text-[#201E1C] flex items-center justify-center text-[13px] font-semibold shrink-0">R</div>
                  <div>
                    <div className="font-medium text-[#201E1C] text-[14px]">{t('community.post2Author')}</div>
                    <div className="text-xs text-[#716F6C] flex items-center gap-2">
                       {t('community.post2Time')} <span className="w-1 h-1 rounded-full bg-[#716F6C] mx-1"></span> {t('community.post2Context')}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] py-0.5 px-2 rounded-[12px] border border-[#C0DECA] text-[#3C8157]">{t('community.post2Badge')}</span>
              </div>
              <h4 className="text-[#201E1C] font-semibold text-[16px] mb-2">{t('community.post2Title')}</h4>
              <p className="text-sm text-[#201E1C] leading-relaxed mb-4">{t('community.post2Desc')}</p>
              
              <div className="flex justify-between items-center border-t border-[#f0f0f0] pt-4">
                <div className="flex items-center gap-4 text-sm text-[#716F6C]">
                  <div className="flex items-center gap-1 text-primary font-medium"><Flame size={14}/> 67</div>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#201E1C]"><MessageCircle size={14}/> {t('community.post2Replies')}</div>
                </div>
                <button className="bg-transparent border-none text-sm font-medium text-primary cursor-pointer hover:underline">{t('community.btnReply')}</button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="w-[320px] shrink-0 flex flex-col">
          
          {/* Upcoming Live Sessions */}
          <div className="mb-6">
            <h4 className="font-serif font-semibold text-[16px] mb-4 text-[#201E1C]">{t('community.liveTitle')}</h4>
            
            <div className="bg-white border border-[#Eeece9] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4">
               <div className="text-[10px] font-semibold tracking-[1px] text-primary mb-2 uppercase">{t('community.live1Tag')}</div>
               <div className="font-bold text-[#201E1C] text-[14px]">{t('community.live1Title')}</div>
               <div className="text-xs text-[#716F6C] mt-1">{t('community.live1Sub')}</div>
            </div>

            <div className="bg-white border border-[#Eeece9] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
               <div className="text-[10px] font-semibold tracking-[1px] text-[#716F6C] mb-2 uppercase">{t('community.live2Tag')}</div>
               <div className="font-bold text-[#201E1C] text-[14px]">{t('community.live2Title')}</div>
               <div className="text-xs text-[#716F6C] mt-1">{t('community.live2Sub')}</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h4 className="font-serif font-semibold text-[16px] mb-4 text-[#201E1C]">{t('community.ldrTitle')}</h4>
            <div className="bg-white border border-[#Eeece9] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[#716F6C] text-xs w-6 shrink-0 font-medium">#1</span>
                <div className="w-7 h-7 rounded-full bg-[#fbefe9] text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">RK</div>
                <span className="font-medium flex-1 text-sm text-[#201E1C]">Rahul K.</span>
                <span className="text-xs text-primary font-bold">14 {t('community.ldrAns')}</span>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[#716F6C] text-xs w-6 shrink-0 font-medium">#2</span>
                <div className="w-7 h-7 rounded-full bg-[#E2DFD8] text-[#201E1C] flex items-center justify-center text-[11px] font-semibold shrink-0">PM</div>
                <span className="font-medium flex-1 text-sm text-[#201E1C]">Priya M.</span>
                <span className="text-xs text-[#716F6C]">11 {t('community.ldrAns')}</span>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#Eeece9]">
                <span className="text-[#716F6C] text-xs w-6 shrink-0 font-medium">#7</span>
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold shrink-0">AR</div>
                <span className="font-medium flex-1 text-sm text-[#201E1C]">{t('community.ldrYou')}</span>
                <span className="text-xs text-[#716F6C]">7 {t('community.ldrAns')}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Community;
