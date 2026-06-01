import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { User, Sliders, Globe, Palette, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { fetchProfile } from '../../store/slices/authSlice';
import LanguageToggle from '../../components/common/LanguageToggle';
import { applyLanguage, normalizeLanguage } from '../../utils/language';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    bio: user?.bio || '',
    optionalSubject: user?.optional_subject || '',
    examStage: user?.exam_stage || 'beginner',
  });

  const { execute: updateProfile, isLoading: saving } = useApi(
    `${API_BASE}/api/v1/users/me`
  );

  // Sync form when user profile loads (e.g. after fetchProfile resolves post-login)
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        bio: user.bio || '',
        optionalSubject: user.optional_subject || '',
        examStage: user.exam_stage || 'beginner',
      });
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError('');
    try {
      await updateProfile({
        method: 'PUT',
        body: {
          name: formData.fullName,
          bio: formData.bio,
          optional_subject: formData.optionalSubject,
          exam_stage: formData.examStage,
        },
      });
      setSaveSuccess(true);
      dispatch(fetchProfile());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    }
  };

  const handleLanguageChange = async (lang) => {
    const code = normalizeLanguage(lang);
    applyLanguage(code);
    setSaveError('');
    try {
      await updateProfile({
        method: 'PUT',
        body: { preferred_language: code },
      });
      dispatch(fetchProfile());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save language.');
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: <User size={18} /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Sliders size={18} /> }
  ];

  return (
    <div className="max-w-[1000px] mx-auto w-full p-2 md:p-6 flex flex-col gap-8">
      <div className="mb-4">
        <h1 className="text-3xl font-serif text-text-primary mb-2">{t('settings.title')}</h1>
        <p className="text-text-secondary">{t('common.manageAccount')}</p>
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
            <form onSubmit={handleSave} className="bg-bg-panel border border-border-default rounded-2xl shadow-sm overflow-hidden">
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
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-bg-surface-dark border border-border-muted rounded-lg px-4 py-2.5 text-text-muted cursor-not-allowed opacity-70"
                  />
                  <p className="text-[11px] text-text-muted">{t('common.emailCannotChange')}</p>
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
                      <option value="beginner">Beginner</option>
                      <option value="prelims">Prelims</option>
                      <option value="mains">Mains</option>
                      <option value="interview">Interview</option>
                    </select>
                  </div>
                </div>

                {saveError && (
                  <p className="text-red-500 text-[13px]">{saveError}</p>
                )}

                {saveSuccess && (
                  <div className="flex items-center gap-2 text-[#2B7A4B] text-[13px]">
                    <CheckCircle2 size={16} /> {t('common.profileSaved')}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? t('common.saving') : t('settings.saveChanges')}
                  </button>
                </div>

              </div>
            </form>
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
                  <LanguageToggle
                    value={user?.preferred_language || i18n.language}
                    onChange={handleLanguageChange}
                  />
                  {saveSuccess && (
                    <p className="text-[#2B7A4B] text-[13px] mt-4">{t('common.languageSaved')}</p>
                  )}
                  {saveError && (
                    <p className="text-red-500 text-[13px] mt-4">{saveError}</p>
                  )}
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
