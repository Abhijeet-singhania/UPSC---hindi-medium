import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Compass, Edit3, Activity, ArrowRight, Check, X, Target, BookOpen, Sparkles, Library, Swords, Trophy, Users, Zap } from 'lucide-react';
import LanguageToggle from '../../components/common/LanguageToggle';
import { getStoredLanguage } from '../../utils/language';

const useLiveNumber = (initial, variance, intervalMs) => {
  const [num, setNum] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => {
      setNum(prev => prev + Math.floor(Math.random() * (variance * 2 + 1)) - variance);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [variance, intervalMs]);
  return num;
};

const testimonials = [
  { quote: "I was struggling with consistency. The streak tracking and adaptive prelims lab completely changed my daily routine.", name: "Rahul K.", detail: "Cleared Prelims 2024" },
  { quote: "The peer review format in the community section helped me refine my Mains structure immensely. My GS3 score jumped 20 points.", name: "Priya M.", detail: "Mains 2023 Candidate" },
  { quote: "Ask AI gave me UPSC-specific answers — not generic. It cites the syllabus point, which was invaluable for GS2 governance prep.", name: "Suresh R.", detail: "IFoS 2024 Prelims Cleared" },
  { quote: "Silent Library helped me stay accountable. Seeing 3,000 people studying alongside me was incredibly motivating.", name: "Ananya T.", detail: "UPSC Aspirant · Delhi" },
  { quote: "The heatmap accountability changed everything. I stopped making excuses once I could see my own gaps in black and white.", name: "Deepak V.", detail: "Optional: Geography" },
  { quote: "The roadmap feature broke down GS1 into weekly chunks. For the first time, the syllabus didn't feel impossible.", name: "Meghna S.", detail: "Second attempt, Mains 2024" },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const handleStart = () => {
    navigate('/auth');
  };

  const active = useLiveNumber(3184, 30, 2200);
  const queueDuel = useLiveNumber(217, 8, 2800);
  const minutesToday = useLiveNumber(1438420, 800, 1800);

  const deepDiveCards = [
    { icon: <Compass size={40} className="mb-4" style={{ color: '#C4902A' }} />, title: t('welcome.featDetail1Title'), desc: t('welcome.featDetail1Sub') },
    { icon: <Edit3 size={40} className="mb-4" style={{ color: '#3B6CC4' }} />, title: t('welcome.featDetail2Title'), desc: t('welcome.featDetail2Sub') },
    { icon: <Activity size={40} className="mb-4" style={{ color: '#2D8A5E' }} />, title: t('welcome.featDetail3Title'), desc: t('welcome.featDetail3Sub') },
  ];

  // Parallax transforms based on scroll
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const bgBlob1Y = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const bgBlob2Y = useTransform(scrollYProgress, [0, 1], [0, -300]);

  const deepDiveTextY = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
  const deepDiveTextOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  
  const card1Y = useTransform(scrollYProgress, [0.2, 0.5], [150, -50]);
  const card2Y = useTransform(scrollYProgress, [0.2, 0.6], [200, -20]);
  const card3Y = useTransform(scrollYProgress, [0.2, 0.7], [250, 10]);

  const testSectionY = useTransform(scrollYProgress, [0.5, 0.8], [150, 0]);
  const ctaScale = useTransform(scrollYProgress, [0.7, 1], [0.8, 1]);

  return (
    <div ref={containerRef} className="bg-bg-base text-text-primary font-sans relative">
      
      {/* No blobs — the grid texture from index.css handles the atmosphere */}
      
      {/* Top Navbar */}
      <nav
        className={`fixed top-0 w-full px-8 py-4 flex justify-between items-center z-50 max-w-[1440px] left-1/2 -translate-x-1/2 transition-all duration-300`}
        style={navScrolled ? {
          background: 'rgba(8,9,13,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(196,144,42,0.12)',
        } : {
          background: 'linear-gradient(180deg, rgba(8,9,13,0.85) 0%, transparent 100%)',
        }}
      >
        <div className="flex flex-col leading-none">
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #C4902A 0%, #E8BC5A 60%, #C4902A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >Drishti</span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              opacity: 0.6,
              marginTop: '2px',
            }}
          >Civil Services</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle value={getStoredLanguage()} />
          <button
            onClick={handleStart}
            className="px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            style={{
              background: 'rgba(196,144,42,0.08)',
              border: '1px solid rgba(196,144,42,0.2)',
              color: '#C4902A',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {t('welcome.login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-8 relative z-10 max-w-[1200px] mx-auto overflow-hidden py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="pt-20">
            {/* Kicker / overline */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#C4902A',
              }}
            >
              <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#C4902A', opacity: 0.6 }} />
              UPSC Hindi Medium · AI-powered preparation
            </motion.div>

            {/* Display headline — Cormorant Garamond */}
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(56px, 8vw, 104px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 0.95,
                marginBottom: '28px',
              }}
            >
              {t('welcome.heroTitle').split(' ').map((word, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <span key={i}>
                    {isLast ? (
                      <span style={{
                        background: 'linear-gradient(135deg, #E8BC5A 0%, #C4902A 60%, #E8BC5A 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                    {!isLast && ' '}
                  </span>
                );
              })}
            </motion.h1>

            {/* 1px rule — editorial separator */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.5 }}
              style={{
                height: '1px',
                background: 'linear-gradient(90deg, rgba(196,144,42,0.4), transparent)',
                marginBottom: '24px',
                transformOrigin: 'left',
              }}
            />

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-10 max-w-md leading-relaxed"
              style={{ fontSize: '18px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('welcome.heroSub')}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 flex-wrap"
            >
              <button
                onClick={handleStart}
                className="group flex items-center gap-3 text-[15px] font-semibold px-8 py-4 rounded-xl transition-all cursor-pointer hover:opacity-90 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 24px rgba(196,144,42,0.35)',
                  border: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t('welcome.getStarted')}
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                Free forever · No credit card
              </span>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="h-[450px] lg:h-[500px] w-full">
            <HeroPanel active={active} queueDuel={queueDuel} minutesToday={minutesToday} t={t} />
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <div
          className="mb-4 flex items-center gap-3"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C4902A' }}
        >
          <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#C4902A', opacity: 0.6 }} />
          FEATURES
        </div>
        <h2
          className="mb-12 leading-tight max-w-3xl"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: 'var(--text-primary)',
          }}
        >
          Seven instruments, one disciplined dashboard.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {[
            { col: "lg:col-span-6", tone: "rust",   tag: "01 · PYQ VAULT",       title: "Past Year Questions, decoded.",                   body: "Every PYQ from 2011 onward — tagged by topic, scored by difficulty, with full step-by-step explanations and the option-elimination logic toppers actually use.", stat: "14,200 questions · 1,847 topics", icon: <Target size={20} /> },
            { col: "lg:col-span-6", tone: "indigo", tag: "02 · CURATED LESSONS",  title: "Lessons that read like essays, watch like cinema.", body: "Twelve-minute deep-dives. Hand-picked by educators who topped the same paper. No 4-hour video bloat.", stat: "320+ lessons · weekly drops", icon: <BookOpen size={20} /> },
            { col: "lg:col-span-4", tone: "moss",   tag: "03 · ASK AI",           title: "A mentor who's read every NCERT.",                 body: "Trained on the syllabus, fact-checked against PYQs. Ask anything. Cite always.", stat: "< 800ms response", icon: <Sparkles size={20} /> },
            { col: "lg:col-span-4", tone: "gold",   tag: "04 · SILENT LIBRARY",   title: "Never study alone.",                              body: "A live, anonymous reading room. See the focus session counter rise as the country wakes up.", stat: "3,184 active · 24/7", icon: <Library size={20} /> },
            { col: "lg:col-span-4", tone: "rust",   tag: "05 · 1V1 DUELS",        title: "Quiz duels in real time.",                        body: "60-second match. Same questions. Anonymous. Climb the national ladder.", stat: "217 in queue", icon: <Swords size={20} /> },
            { col: "lg:col-span-7", tone: "ink",    tag: "06 · RANKS & REWARDS",  title: "From Aspirant to Cabinet Secretary, 81 levels in between.", body: "Earn cosmetic themes, badges, and titles for the work you'd do anyway. Streaks matter. Mistake-logs matter more.", stat: "8 ranks · 240 badges", icon: <Trophy size={20} /> },
            { col: "lg:col-span-5", tone: "indigo", tag: "07 · COMMUNITY",        title: "An aspirant-only square.",                        body: "Anonymous if you want. Verified-aspirant only. Resources, vents, mistake-logs, study squads.", stat: "Verified-only · zero ads", icon: <Users size={20} /> },
          ].map((card, i) => (
            <motion.div
              key={card.tag}
              className={card.col}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: [0.4, 0, 0.2, 1] }}
            >
              <FeatureCard col="" {...card} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Deep Dive Section (Parallax) */}
      <section className="py-32 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <motion.div style={{ y: deepDiveTextY, opacity: deepDiveTextOpacity }} className="text-center mb-24 cursor-default">
          <h2
            className="mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >{t('welcome.deepDiveTitle')}</h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '40rem', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>{t('welcome.deepDiveSub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[card1Y, card2Y, card3Y].map((yTransform, idx) => (
            <motion.div
              key={idx}
              className="p-10 rounded-2xl h-[350px] flex flex-col items-center text-center justify-center cursor-default"
              style={{
                y: yTransform,
                background: 'var(--bg-surface)',
                border: '1px solid rgba(196,144,42,0.14)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {deepDiveCards[idx].icon}
              <h3
                className="mb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '24px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                }}
              >{deepDiveCards[idx].title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', lineHeight: 1.6 }}>{deepDiveCards[idx].desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PYQ Specimen Section */}
      <section className="py-32 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div
              className="mb-4 flex items-center gap-3"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C4902A' }}
            >
              <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#C4902A', opacity: 0.6 }} />
              {t('welcome.specimenKicker')}
            </div>
            <h2
              className="mb-6 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(30px, 4vw, 52px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              {t('welcome.specimenTitle')}
            </h2>
            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              {t('welcome.specimenSub')}
            </p>
            <ul className="flex flex-col gap-4">
              {[t('welcome.specimenPoint1'), t('welcome.specimenPoint2'), t('welcome.specimenPoint3'), t('welcome.specimenPoint4')].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                  <span className="w-5 h-5 rounded-full border border-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-primary" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <PYQSpecimen t={t} />
          </div>
        </div>
      </section>

      {/* Silent Library Section */}
      <section className="py-32 relative z-10 border-y" style={{ background: 'var(--bg-panel)', borderColor: 'rgba(196,144,42,0.12)' }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="mb-4 flex items-center gap-3"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C4902A' }}
              >
                <span style={{ display: 'inline-block', width: '20px', height: '1px', background: '#C4902A', opacity: 0.6 }} />
                {t('welcome.libKicker')}
              </div>
              <h2
                className="mb-6 leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(30px, 4vw, 56px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
                dangerouslySetInnerHTML={{ __html: t('welcome.libTitle') }}
              />
              <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-md">
                {t('welcome.libSub')}
              </p>
              <div className="grid grid-cols-2 gap-8">
                <DarkStat n={active.toLocaleString("en-IN")} label={t('welcome.libStat1')} live />
                <DarkStat n={(minutesToday / 1000).toFixed(0) + "K"} label={t('welcome.libStat2')} />
                <DarkStat n="6" label={t('welcome.libStat3')} />
                <DarkStat n="24/7" label={t('welcome.libStat4')} />
              </div>
            </div>
            <LibraryViz active={active} t={t} />
          </div>
        </div>
      </section>

      {/* Testimonials — auto-scroll marquee */}
      <section className="py-24 relative z-10 overflow-hidden cursor-default" style={{ background: 'var(--bg-surface-dark)' }}>
        <div className="text-center mb-12 px-8">
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C4902A',
              marginBottom: '12px',
            }}
          >What aspirants say</p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >{t('welcome.testimonialTitle')}</h2>
        </div>
        {/* Marquee track — duplicated for seamless loop */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg-base to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#181715] to-transparent z-10 pointer-events-none" />
          <div
            className="flex gap-5"
            style={{
              width: 'max-content',
              animation: 'marquee-left 40s linear infinite',
            }}
          >
            {[...testimonials, ...testimonials].map((item, i) => (
              <div
                key={i}
                className="w-[300px] shrink-0 rounded-xl p-6"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(196,144,42,0.12)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  className="leading-none mb-3"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '40px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #E8BC5A, #C4902A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: 0.7,
                  }}
                >"</div>
                <p
                  className="mb-5 italic"
                  style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {item.quote}
                </p>
                <div className="pt-4" style={{ borderTop: '1px solid rgba(196,144,42,0.1)' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{item.name}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'var(--text-muted)' }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .flex[style*="marquee-left"] { animation: none; }
          }
        `}</style>
      </section>

      {/* Footer CTA Section */}
      <section className="min-h-[80vh] py-32 flex flex-col items-center justify-center relative z-10 overflow-hidden cursor-default px-8">
        <motion.div
          style={{
            scale: ctaScale,
            background: 'linear-gradient(135deg, #C4902A 0%, #8B6010 100%)',
            boxShadow: '0 20px 60px rgba(196,144,42,0.3)',
          }}
          className="relative z-10 w-full max-w-[1000px] rounded-2xl p-8 lg:p-14 overflow-hidden"
        >
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 30%, rgba(255,255,255,0.12), transparent 60%)' }} />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="mb-4"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                {t('welcome.ctaKicker')}
              </div>
              <h2
                className="mb-6 leading-tight"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: '#fff',
                }}
                dangerouslySetInnerHTML={{ __html: t('welcome.ctaTitle2') }}
              />
              <p className="mb-8 max-w-md" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', fontFamily: "'DM Sans', sans-serif" }}>
                {t('welcome.ctaSub2')}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition shadow-lg cursor-pointer hover:opacity-90"
                  style={{
                    background: 'var(--bg-panel)',
                    color: '#C4902A',
                    fontFamily: "'DM Sans', sans-serif",
                    border: 'none',
                  }}
                >
                  {t('welcome.beginFree')} <ArrowRight size={16} />
                </button>
                <button
                  onClick={handleStart}
                  className="px-8 py-4 rounded-xl text-base font-semibold transition cursor-pointer hover:bg-white/15"
                  style={{
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'transparent',
                  }}
                >
                  {t('welcome.seePro')}
                </button>
              </div>
            </div>
            <div
              className="rounded-xl p-6 font-mono text-sm"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
              }}
            >
              <div className="flex justify-between mb-4 text-xs" style={{ opacity: 0.7 }}>
                <span>{t('welcome.cdLabel1')}</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> {t('welcome.cdLabel2')}</span>
              </div>
              <div
                className="leading-none mb-6"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(48px, 7vw, 80px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                }}
              >
                184<span className="opacity-60" style={{ fontSize: '0.35em', fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle' }}>d</span>{' '}
                06<span className="opacity-60" style={{ fontSize: '0.35em', fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle' }}>h</span>
              </div>
              <div className="flex flex-col gap-3">
                <Row k={t('welcome.cdAspirants')} v="11,84,210" />
                <Row k={t('welcome.cdSeats')} v="1,056" />
                <Row k={t('welcome.cdRatio')} v="0.089%" />
                <Row k={t('welcome.cdPrep')} v="0 min — start →" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
};

/* --- Sub Components --- */

const HeroPanel = ({ active, queueDuel, minutesToday, t }) => (
  <div
    className="rounded-xl p-6 font-mono text-xs flex flex-col gap-4 relative overflow-hidden h-full"
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(196,144,42,0.16)',
      boxShadow: 'var(--shadow-card)',
    }}
  >
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-2 text-text-secondary text-[10px] tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t('welcome.liveMissionControl')}
      </span>
      <span className="text-text-secondary/50 text-[10px]">{t('welcome.version')}</span>
    </div>

    <div className="border-t border-border-default pt-4">
      <div className="text-text-secondary text-[10px] tracking-widest mb-2 uppercase">{t('welcome.silentLibraryRooms')}</div>
      <div className="text-5xl lg:text-6xl text-text-primary font-serif">{active.toLocaleString("en-IN")}</div>
      <div className="text-[11px] text-text-secondary mt-2">{t('welcome.aspirantsDeepWork', { minutes: (minutesToday / 1000).toFixed(0) })}</div>
    </div>

    <div className="border-t border-border-default pt-3 grid grid-cols-2 gap-4">
      <div>
        <div className="text-text-secondary text-[10px] tracking-widest uppercase">{t('welcome.duelQueue')}</div>
        <div className="text-2xl text-primary mt-1 font-serif">{queueDuel}</div>
      </div>
      <div>
        <div className="text-text-secondary text-[10px] tracking-widest uppercase">{t('welcome.nationalTop')}</div>
        <div className="text-2xl text-text-primary mt-1 font-serif">9,842</div>
      </div>
    </div>

    <div className="border-t border-border-default pt-3">
      <div className="text-text-secondary text-[10px] tracking-widest mb-2 uppercase">{t('welcome.nextDrops')}</div>
      <div className="flex flex-col gap-2 text-[11px]">
        <DropRow t="06:00" l={t('welcome.dailyPyq')} tag="POLITY" />
        <DropRow t="08:30" l={t('welcome.editorial')} tag="LESSON" />
        <DropRow t="20:00" l={t('welcome.tournament')} tag="DUEL" hot />
        <DropRow t="22:00" l={t('welcome.mockTest')} tag="MOCK" />
      </div>
    </div>

    <div className="mt-auto border-t border-border-default pt-3 flex justify-between text-text-secondary text-[10px] uppercase">
      <span>{t('welcome.uplinkStable')}</span>
      <span>{t('welcome.synced')} · {new Date().toLocaleTimeString("en-IN", { hour12: false })}</span>
    </div>
  </div>
);

const DropRow = ({ t, l, tag, hot }) => (
  <div className="flex items-center gap-2 pb-1 border-b border-dashed border-border-default">
    <span className="text-text-secondary w-10">{t}</span>
    <span className="flex-1 text-text-primary truncate">{l}</span>
    <span className={`text-[9px] px-2 py-[2px] rounded-full tracking-widest border ${hot ? "border-primary text-primary" : "border-border-default text-text-secondary"}`}>{tag}</span>
  </div>
);

const PYQSpecimen = ({ t }) => {
  const [chosen, setChosen] = useState(null);
  const correct = "B";
  const options = [
    { k: "A", t: t('welcome.qOptA') },
    { k: "B", t: t('welcome.qOptB') },
    { k: "C", t: t('welcome.qOptC') },
    { k: "D", t: t('welcome.qOptD') }
  ];

  return (
    <div className="border border-border-default rounded-2xl overflow-hidden bg-bg-surface-dark shadow-2xl">
      <div className="bg-bg-panel text-text-primary px-5 py-3 flex justify-between font-mono text-[11px] tracking-widest border-b border-border-default">
        <span>{t('welcome.qHeader')}</span>
        <span className="hidden md:inline">{t('welcome.qDifficulty')}</span>
      </div>
      <div className="p-8">
        <p className="font-serif text-xl md:text-2xl leading-relaxed text-text-primary m-0">
          {t('welcome.qText')}
        </p>
        <ol className="mt-5 pl-5 text-text-secondary text-sm md:text-base leading-relaxed flex flex-col gap-2 list-none">
          <li>{t('welcome.qS1')}</li>
          <li>{t('welcome.qS2')}</li>
          <li>{t('welcome.qS3')}</li>
        </ol>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((o) => {
            const isChosen = chosen === o.k;
            const isCorrect = chosen && o.k === correct;
            const isWrong = isChosen && o.k !== correct;
            return (
              <button key={o.k} onClick={() => setChosen(o.k)} className={`text-left px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 text-sm transition-all border ${
                isCorrect ? "bg-[#2B7A4B]/20 border-[#2B7A4B] text-text-primary" : 
                isWrong ? "bg-red-500/20 border-red-500 text-text-primary" : 
                "bg-bg-panel border-border-default text-text-secondary hover:border-[#A3A19E]"
              }`}>
                <span className="font-mono w-6 h-6 border border-current rounded flex items-center justify-center text-[11px] shrink-0">{o.k}</span>
                <span className="flex-1">{o.t}</span>
                {isCorrect && <Check size={16} className="text-[#2B7A4B] shrink-0" />}
                {isWrong && <X size={16} className="text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {chosen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-4 bg-bg-panel rounded-xl border border-border-default text-sm text-text-secondary leading-relaxed">
            <div className={`text-xs tracking-widest uppercase mb-2 ${chosen === correct ? "text-[#2B7A4B]" : "text-red-500"}`}>
              {chosen === correct ? t('welcome.qCorrect') : t('welcome.qIncorrect')}
            </div>
            <strong>Why B:</strong> {t('welcome.qWhyB')}
          </motion.div>
        )}

        <div className="mt-6 flex flex-col md:flex-row justify-between md:items-center font-mono text-[11px] text-text-muted pt-4 border-t border-dashed border-border-default gap-2">
          <span>{t('welcome.qFooterLeft')}</span>
          <span className="flex flex-col md:flex-row gap-1 md:gap-3">
            <span>{t('welcome.qFooterRight1')}</span>
            <span>{t('welcome.qFooterRight2')}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const LibraryViz = ({ active, t }) => {
  const dots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 220; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        d: Math.random() * 2 + 1,
        a: Math.random() * 0.8 + 0.2,
        delay: Math.random() * 4
      });
    }
    return arr;
  }, []);
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden p-5 flex-1 w-full max-w-md mx-auto"
      style={{ background: 'var(--bg-surface)', border: '1px solid rgba(196,144,42,0.14)', boxShadow: 'var(--shadow-card)' }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="46" stroke="rgba(196,144,42,0.15)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="34" stroke="rgba(196,144,42,0.15)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="22" stroke="rgba(196,144,42,0.15)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="10" stroke="rgba(196,144,42,0.25)" fill="none" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.d * 0.18} fill="#C4902A" opacity={d.a * 0.7}>
            <animate attributeName="opacity" values={`${d.a};${d.a * 0.3};${d.a}`} dur="3s" repeatCount="indefinite" begin={`${d.delay}s`} />
          </circle>
        ))}
      </svg>
      <div className="absolute top-5 left-5 font-mono text-[10px] text-text-secondary tracking-widest uppercase">
        {t('welcome.libVizMap')}
      </div>
      <div className="absolute bottom-5 left-5 right-5 font-mono text-[10px] text-text-secondary flex justify-between uppercase">
        <span>{t('welcome.libVizTime')}</span>
        <span className="hidden sm:inline">{t('welcome.libVizActive', { active: active.toLocaleString("en-IN") })}</span>
        <span>{t('welcome.libVizRooms')}</span>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-text-primary font-mono text-[10px] tracking-widest uppercase">
        <div className="text-4xl text-primary font-serif leading-none">{active.toLocaleString("en-IN")}</div>
        <div className="mt-2 opacity-60">{t('welcome.libVizStudying')}</div>
      </div>
    </div>
  );
};

const DarkStat = ({ n, label, live }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      {live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #E8BC5A 0%, #C4902A 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {n}
      </span>
    </div>
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginTop: '4px',
      }}
    >{label}</div>
  </div>
);

const FeatureCard = ({ col, tag, title, body, stat, icon, tone }) => {
  const toneMap = {
    rust:   { accentColor: '#C4902A', accentAlpha: 'rgba(196,144,42,', iconBg: 'rgba(196,144,42,0.1)'  },
    indigo: { accentColor: '#3B6CC4', accentAlpha: 'rgba(59,108,196,',  iconBg: 'rgba(59,108,196,0.1)'  },
    moss:   { accentColor: '#2D8A5E', accentAlpha: 'rgba(45,138,94,',   iconBg: 'rgba(45,138,94,0.1)'   },
    gold:   { accentColor: '#C4902A', accentAlpha: 'rgba(196,144,42,',  iconBg: 'rgba(196,144,42,0.08)' },
    ink:    { accentColor: '#9B4ECA', accentAlpha: 'rgba(155,78,202,',  iconBg: 'rgba(155,78,202,0.1)'  },
  };
  const tc = toneMap[tone] || toneMap.rust;

  return (
    <div
      className="rounded-2xl flex flex-col gap-4 min-h-[200px] p-6 lg:p-8 cursor-default"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${tc.accentAlpha}0.15)`,
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = `${tc.accentAlpha}0.28)`;
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = `${tc.accentAlpha}0.15)`;
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: tc.accentColor,
          }}
        >{tag}</span>
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: tc.iconBg, color: tc.accentColor }}
        >
          {icon}
        </span>
      </div>
      <h3
        className="leading-tight"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '22px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >{title}</h3>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >{body}</p>
      <div
        className="mt-auto pt-4"
        style={{
          borderTop: `1px solid ${tc.accentAlpha}0.12)`,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {stat}
      </div>
    </div>
  );
};

const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-dashed border-border-default pb-1 text-xs">
    <span className="text-text-secondary">{k}</span>
    <span className="text-text-primary">{v}</span>
  </div>
);

export default Welcome;
