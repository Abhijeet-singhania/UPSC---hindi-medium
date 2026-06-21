import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError, mockLogin } from '../../store/slices/authSlice';
import LanguageToggle from '../../components/common/LanguageToggle';
import { getStoredLanguage } from '../../utils/language';

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [registerStep, setRegisterStep] = useState(1); // 1 or 2

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    examStage: 'prelims',
    optionalSubject: '',
    preferredLanguage: getStoredLanguage(),
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert(t('auth.passwordsMismatch') || 'Passwords do not match');
      return;
    }
    setRegisterStep(2);
  };

  const handleFinish = (e) => {
    if(e) e.preventDefault();
    if (mode === 'login') {
      dispatch(loginUser({ email: formData.email, password: formData.password }));
    } else {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        exam_stage: formData.examStage,
        optional_subject: formData.optionalSubject,
        preferred_language: formData.preferredLanguage,
      };
      dispatch(registerUser(payload));
    }
  };

  const handleMockLogin = () => {
    dispatch(mockLogin());
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const brandFeatures = [
    { label: 'AI-powered personalised study plan' },
    { label: 'Adaptive Prelims MCQ engine with PYQs' },
    { label: 'Live Silent Library — study with peers' },
    { label: 'Hindi & English content, both GS & Optional' },
    { label: 'Streak tracking, leaderboard & rewards' },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BFA532]/8 blur-[100px] pointer-events-none" />

      {/* Brand panel — left 45% */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-border-default relative z-10">
        <div>
          <div className="font-serif text-2xl text-text-primary font-semibold mb-16 tracking-tight">Drishti</div>
          <p className="text-[11px] tracking-[2.5px] text-primary uppercase font-medium mb-4">UPSC Hindi Medium</p>
          <h2 className="font-serif text-[40px] text-text-primary leading-[1.1] mb-6">
            The complete UPSC<br />prep platform.
          </h2>
          <p className="text-text-secondary text-[15px] leading-[1.7] mb-10 max-w-sm">
            Built for Hindi medium aspirants — every resource you need in one focused dashboard.
          </p>
          <ul className="flex flex-col gap-3">
            {brandFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-text-secondary">
                <span className="w-4 h-4 rounded-full border border-primary/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-[11px] text-text-muted">
          Trusted by aspirants across India
        </div>
      </div>

      {/* Form panel — right 55% */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 relative z-10">
        {/* Mobile brand header */}
        <div className="lg:hidden mb-8 text-center">
          <div className="font-serif text-2xl text-text-primary font-semibold mb-1">Drishti</div>
          <p className="text-text-muted text-[13px]">UPSC Hindi Medium prep platform</p>
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-8">
            <h2 className="font-serif text-[26px] font-semibold text-text-primary leading-tight">
              {mode === 'login' ? t('auth.login') : (registerStep === 1 ? t('auth.register') : t('auth.step2Title'))}
            </h2>
            {mode === 'register' && registerStep === 2 && (
              <p className="text-text-muted text-[14px] mt-1">{t('auth.step2Sub')}</p>
            )}
          </div>

        <div className="cc-panel rounded-2xl border border-border-default p-8 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          
          {mode === 'login' && (
            <motion.form key="login" initial="hidden" animate="visible" variants={itemVariants} className="space-y-6" onSubmit={handleFinish}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">{t('auth.languageLabel')}</label>
                <LanguageToggle
                  value={formData.preferredLanguage}
                  onChange={(lang) => setFormData(prev => ({ ...prev, preferredLanguage: lang }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.emailLabel')}</label>
                <div className="mt-1">
                  <input name="email" type="email" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.emailPlaceholder')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.passwordLabel')}</label>
                <div className="mt-1">
                  <input name="password" type="password" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.passwordPlaceholder')} />
                </div>
              </div>

              <div>
                <button type="submit" disabled={loading} className="flex w-full justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#1C1B18] transition-colors cursor-pointer disabled:opacity-50">
                  {loading ? t('auth.authorizing') : t('auth.login')}
                </button>
              </div>

              {import.meta.env.DEV && (
                <div>
                  <button type="button" onClick={handleMockLogin} className="flex w-full justify-center rounded-lg bg-bg-surface border border-border-muted py-2.5 px-4 text-sm font-semibold text-text-secondary shadow-sm hover:text-text-primary hover:border-border-strong focus:outline-none transition-colors cursor-pointer">
                    Mock Login (Dev only)
                  </button>
                </div>
              )}

              <div className="mt-6 text-center text-sm">
                <span className="text-text-secondary">{t('auth.noAccount')} </span>
                <button type="button" onClick={() => { setMode('register'); dispatch(clearError()); }} className="font-semibold text-primary hover:text-primary-hover cursor-pointer bg-transparent border-none">
                  {t('auth.signUp')}
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'register' && registerStep === 1 && (
            <motion.form key="register1" initial="hidden" animate="visible" variants={itemVariants} className="space-y-6" onSubmit={handleStep1Submit}>
              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.nameLabel')}</label>
                <div className="mt-1">
                  <input name="name" type="text" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.namePlaceholder')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.emailLabel')}</label>
                <div className="mt-1">
                  <input name="email" type="email" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.emailPlaceholder')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.passwordLabel')}</label>
                <div className="mt-1">
                  <input name="password" type="password" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.passwordPlaceholder')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.confirmPasswordLabel')}</label>
                <div className="mt-1">
                  <input name="confirmPassword" type="password" required onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.confirmPasswordPlaceholder')} />
                </div>
              </div>

              <div>
                <button type="submit" className="flex w-full justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer">
                  {t('auth.step1Btn')}
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-text-secondary">{t('auth.haveAccount')} </span>
                <button type="button" onClick={() => { setMode('login'); setRegisterStep(1); dispatch(clearError()); }} className="font-semibold text-primary hover:text-primary-hover cursor-pointer bg-transparent border-none">
                  {t('auth.signIn')}
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'register' && registerStep === 2 && (
            <motion.form key="register2" initial="hidden" animate="visible" variants={itemVariants} className="space-y-6" onSubmit={handleFinish}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">{t('auth.languageLabel')}</label>
                <p className="text-xs text-text-muted mb-2">{t('auth.languageSub')}</p>
                <LanguageToggle
                  value={formData.preferredLanguage}
                  onChange={(lang) => setFormData(prev => ({ ...prev, preferredLanguage: lang }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.bioLabel')}</label>
                <div className="mt-1">
                  <textarea name="bio" rows={3} onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.bioPlaceholder')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.optionalSubjectLabel')}</label>
                <div className="mt-1">
                  <input name="optionalSubject" type="text" onChange={handleChange} className="block w-full appearance-none rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary placeholder-[#716F6C] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors" placeholder={t('auth.optionalSubjectPlaceholder')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary">{t('auth.examStageLabel')}</label>
                <div className="mt-1">
                  <select name="examStage" value={formData.examStage} onChange={handleChange} className="block w-full rounded-md border border-border-muted bg-bg-surface px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors cursor-pointer appearance-none">
                    <option value="beginner">{t('auth.stageBeginner') || 'Beginner'}</option>
                    <option value="prelims">{t('auth.stagePrelims')}</option>
                    <option value="mains">{t('auth.stageMains')}</option>
                    <option value="interview">{t('auth.stageInterview')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={handleFinish} className="flex flex-1 justify-center rounded-lg bg-transparent border border-border-strong py-2.5 px-4 text-sm font-medium text-text-primary hover:bg-white/5 focus:outline-none transition-colors cursor-pointer">
                  {t('auth.skipFinish')}
                </button>
                <button type="submit" disabled={loading} className="flex flex-1 justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-text-primary shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50">
                  {loading ? t('auth.processing') : t('auth.saveFinish')}
                </button>
              </div>
            </motion.form>
          )}

        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
