import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { User, Sliders, Globe, Palette, Save } from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile');

  // Local state for UI only (no functionality as per user request)
  const [formData, setFormData] = useState({
    fullName: user?.name || 'Arjun Sharma',
    email: user?.email || 'arjun@example.com',
    bio: user?.bio || 'Preparing for UPSC CSE 2026. Targeting IAS. History enthusiast.',
    optionalSubject: user?.optional_subject || 'PSIR',
    examStage: user?.exam_stage || 'Mains'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: <User size={18} /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Sliders size={18} /> }
  ];

  return (
    <div className="max-w-[1000px] mx-auto w-full p-2 md:p-6 flex flex-col gap-8">
      <div className="mb-4">
        <h1 className="text-3xl font-serif text-text-primary mb-2">{t('settings.title')}</h1>
        <p className="text-text-secondary">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Settings Sidebar */}
        <div className="flex flex-col gap-2 w-full md:w-[240px] shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-primary text-text-primary shadow-sm' 
                  : 'text-text-secondary hover:bg-bg-panel-hover hover:text-text-primary'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-white' : 'text-text-muted'}>
                {tab.icon}
              </div>
              <span className={activeTab === tab.id ? 'text-white font-medium' : ''}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-bg-panel border border-border-default rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-default">
                <h2 className="text-xl font-serif text-text-primary font-medium">{t('settings.profile')}</h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-primary">{t('settings.fullName')}</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-primary">{t('settings.email')}</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="w-full bg-bg-surface-dark border border-border-muted rounded-lg px-4 py-2.5 text-text-muted cursor-not-allowed opacity-70"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-primary">{t('settings.bio')}</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition resize-y"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-primary">{t('settings.optionalSubject')}</label>
                    <input 
                      type="text" 
                      name="optionalSubject"
                      value={formData.optionalSubject}
                      onChange={handleChange}
                      className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-primary">{t('settings.examStage')}</label>
                    <select 
                      name="examStage"
                      value={formData.examStage}
                      onChange={handleChange}
                      className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Prelims">Prelims</option>
                      <option value="Mains">Mains</option>
                      <option value="Interview">Interview</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm opacity-90">
                    <Save size={16} />
                    {t('settings.saveChanges')}
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-6">
              
              {/* Language Preferences */}
              <div className="bg-bg-panel border border-border-default rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-default flex items-center gap-3">
                  <Globe className="text-primary" size={20} />
                  <h2 className="text-xl font-serif text-text-primary font-medium">{t('settings.language')}</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-text-secondary mb-6">{t('settings.languageSub')}</p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleLanguageChange('en')}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                        i18n.language === 'en' 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                          : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-muted hover:bg-bg-panel-hover'
                      }`}
                    >
                      <span className="font-medium text-base">{t('settings.english')}</span>
                      {i18n.language === 'en' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                    <button 
                      onClick={() => handleLanguageChange('hi')}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                        i18n.language === 'hi' 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                          : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-muted hover:bg-bg-panel-hover'
                      }`}
                    >
                      <span className="font-medium text-base">{t('settings.hindi')}</span>
                      {i18n.language === 'hi' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Preferences */}
              <div className="bg-bg-panel border border-border-default rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-default flex items-center gap-3">
                  <Palette className="text-primary" size={20} />
                  <h2 className="text-xl font-serif text-text-primary font-medium">{t('settings.theme')}</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-text-secondary mb-6">{t('settings.themeSub')}</p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => theme !== 'light' && toggleTheme()}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                        theme === 'light' 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                          : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-muted hover:bg-bg-panel-hover'
                      }`}
                    >
                      <span className="font-medium text-base">{t('settings.lightMode')}</span>
                      {theme === 'light' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                    <button 
                      onClick={() => theme !== 'dark' && toggleTheme()}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                          : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-muted hover:bg-bg-panel-hover'
                      }`}
                    >
                      <span className="font-medium text-base">{t('settings.darkMode')}</span>
                      {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
