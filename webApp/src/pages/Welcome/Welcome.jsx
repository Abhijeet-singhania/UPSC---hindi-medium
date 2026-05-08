import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Compass, Edit3, Activity, ArrowRight, Check, X, Target, BookOpen, Sparkles, Library, Swords, Trophy, Users } from 'lucide-react';

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

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const { isAuthenticated } = useSelector((state) => state.auth);

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
    { icon: <Compass size={40} className="text-[#BFA532] mb-4" />, title: t('welcome.featDetail1Title'), desc: t('welcome.featDetail1Sub') },
    { icon: <Edit3 size={40} className="text-primary mb-4" />, title: t('welcome.featDetail2Title'), desc: t('welcome.featDetail2Sub') },
    { icon: <Activity size={40} className="text-[#2B7A4B] mb-4" />, title: t('welcome.featDetail3Title'), desc: t('welcome.featDetail3Sub') },
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
      
      {/* Background aesthetic blobs/gradients (Parallaxed) */}
      <motion.div style={{ y: bgBlob1Y }} className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0" />
      <motion.div style={{ y: bgBlob2Y }} className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BFA532]/10 blur-[100px] pointer-events-none z-0" />
      
      {/* Top Navbar items */}
      <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-50 max-w-[1440px] left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#11100F] to-transparent">
        <div className="font-serif text-2xl text-text-primary font-semibold">Drishti</div>
        <div>
           <button onClick={handleStart} className="bg-white/5 border border-white/10 text-text-primary px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition cursor-pointer">
             {t('welcome.login')}
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-8 relative z-10 max-w-[1200px] mx-auto overflow-hidden py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="pt-20">
            <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="text-[12px] tracking-[3px] text-primary uppercase font-bold mb-4">
               PREMIUM PREPARATION
            </motion.div>
            <motion.h1 initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.1}} className="text-5xl lg:text-7xl font-serif text-text-primary mb-6 leading-[1.1]">
              {t('welcome.heroTitle')}
            </motion.h1>
            <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="text-lg text-text-secondary mb-10 max-w-md leading-relaxed">
              {t('welcome.heroSub')}
            </motion.p>
            <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.3}}>
              <button onClick={handleStart} className="group flex items-center gap-3 bg-primary text-text-primary text-base font-semibold px-8 py-4 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all cursor-pointer">
                 {t('welcome.getStarted')}
                 <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="h-[450px] lg:h-[500px] w-full">
            <HeroPanel active={active} queueDuel={queueDuel} minutesToday={minutesToday} t={t} />
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <div className="text-[12px] tracking-[3px] text-primary uppercase font-bold mb-4">
          FEATURES
        </div>
        <h2 className="text-4xl lg:text-5xl font-serif text-text-primary mb-12 leading-tight max-w-3xl">
          Seven instruments, one clean dashboard.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <FeatureCard col="lg:col-span-6" tone="rust" tag="01 · PYQ VAULT" title="Past Year Questions, decoded." body="Every PYQ from 2011 onward — tagged by topic, scored by difficulty, with full step-by-step explanations and the option-elimination logic toppers actually use." stat="14,200 questions · 1,847 topics" icon={<Target size={20} />} />
          <FeatureCard col="lg:col-span-6" tone="indigo" tag="02 · CURATED LESSONS" title="Lessons that read like essays, watch like cinema." body="Twelve-minute deep-dives. Hand-picked by educators who topped the same paper. No 4-hour video bloat." stat="320+ lessons · weekly drops" icon={<BookOpen size={20} />} />
          <FeatureCard col="lg:col-span-4" tone="moss" tag="03 · ASK AI" title="A mentor who's read every NCERT." body="Trained on the syllabus, fact-checked against PYQs. Ask anything. Cite always." stat="< 800ms response" icon={<Sparkles size={20} />} />
          <FeatureCard col="lg:col-span-4" tone="gold" tag="04 · SILENT LIBRARY" title="Never study alone." body="A live, anonymous reading room. See the focus session counter rise as the country wakes up." stat="3,184 active · 24/7" icon={<Library size={20} />} />
          <FeatureCard col="lg:col-span-4" tone="rust" tag="05 · 1V1 DUELS" title="Quiz duels in real time." body="60-second match. Same questions. Anonymous. Climb the national ladder." stat="217 in queue" icon={<Swords size={20} />} />
          <FeatureCard col="lg:col-span-7" tone="ink" tag="06 · RANKS & REWARDS" title="From Aspirant to Cabinet Secretary, 81 levels in between." body="Earn cosmetic themes, badges, and titles for the work you'd do anyway. Streaks matter. Mistake-logs matter more." stat="8 ranks · 240 badges" icon={<Trophy size={20} />} />
          <FeatureCard col="lg:col-span-5" tone="indigo" tag="07 · COMMUNITY" title="An aspirant-only square." body="Anonymous if you want. Verified-aspirant only. Resources, vents, mistake-logs, study squads." stat="Verified-only · zero ads" icon={<Users size={20} />} />
        </div>
      </section>

      {/* Deep Dive Section (Parallax) */}
      <section className="py-32 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <motion.div style={{ y: deepDiveTextY, opacity: deepDiveTextOpacity }} className="text-center mb-24 cursor-default">
          <h2 className="text-4xl lg:text-6xl font-serif text-text-primary mb-4">{t('welcome.deepDiveTitle')}</h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">{t('welcome.deepDiveSub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div style={{ y: card1Y }} className="bg-bg-surface-dark border border-border-default p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[0].icon}
            <h3 className="text-2xl font-serif text-text-primary mb-3">{deepDiveCards[0].title}</h3>
            <p className="text-text-secondary">{deepDiveCards[0].desc}</p>
          </motion.div>
          <motion.div style={{ y: card2Y }} className="bg-bg-surface-dark border border-border-default p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[1].icon}
            <h3 className="text-2xl font-serif text-text-primary mb-3">{deepDiveCards[1].title}</h3>
            <p className="text-text-secondary">{deepDiveCards[1].desc}</p>
          </motion.div>
          <motion.div style={{ y: card3Y }} className="bg-bg-surface-dark border border-border-default p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[2].icon}
            <h3 className="text-2xl font-serif text-text-primary mb-3">{deepDiveCards[2].title}</h3>
            <p className="text-text-secondary">{deepDiveCards[2].desc}</p>
          </motion.div>
        </div>
      </section>

      {/* PYQ Specimen Section */}
      <section className="py-32 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="text-[12px] tracking-[3px] text-primary uppercase font-bold mb-4">
              {t('welcome.specimenKicker')}
            </div>
            <h2 className="text-4xl lg:text-5xl font-serif text-text-primary mb-6 leading-tight">
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
      <section className="py-32 relative z-10 bg-bg-surface-dark border-y border-border-default">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[12px] tracking-[3px] text-text-secondary uppercase font-bold mb-4">
                {t('welcome.libKicker')}
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif text-text-primary mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('welcome.libTitle') }} />
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

      {/* Testimonials Section Parallaxed */}
      <section className="py-32 px-8 relative z-10 bg-gradient-to-b from-transparent to-[#181715] flex flex-col gap-12 justify-center cursor-default">
        <motion.div style={{ y: testSectionY }} className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif text-text-primary">{t('welcome.testimonialTitle')}</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="bg-bg-surface p-8 rounded-2xl md:w-1/3 relative border border-border-muted">
              <div className="text-4xl text-primary font-serif absolute top-4 left-4 opacity-50">"</div>
              <p className="text-text-primary relative z-10 italic mt-4">"I was struggling with consistency. The streak tracking and adaptive prelims lab completely changed my daily routine."</p>
              <div className="mt-6 border-t border-border-muted pt-4">
                <p className="font-semibold text-text-primary">Rahul K.</p>
                <p className="text-xs text-text-secondary">Cleared Prelims 2024</p>
              </div>
            </div>
            <div className="bg-bg-panel p-8 rounded-2xl md:w-1/3 relative border border-border-default mt-8 md:mt-16 shadow-2xl">
              <div className="text-4xl text-[#BFA532] font-serif absolute top-4 left-4 opacity-50">"</div>
              <p className="text-text-secondary relative z-10 italic mt-4">"The peer review format in the community section helped me refine my Mains structure immensely. My GS3 score jumped 20 points."</p>
              <div className="mt-6 border-t border-border-default pt-4">
                <p className="font-semibold text-text-primary">Priya M.</p>
                <p className="text-xs text-text-secondary">Mains 2023 Candidate</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer CTA Section Parallaxed */}
      <section className="min-h-[80vh] py-32 flex flex-col items-center justify-center relative z-10 bg-bg-base overflow-hidden cursor-default px-8">
        <motion.div style={{ scale: ctaScale }} className="relative z-10 w-full max-w-[1000px] bg-primary rounded-3xl p-8 lg:p-14 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[12px] tracking-[3px] text-text-primary/70 uppercase font-bold mb-4">
                {t('welcome.ctaKicker')}
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif text-text-primary mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('welcome.ctaTitle2') }} />
              <p className="text-text-primary/80 text-lg mb-8 max-w-md">
                {t('welcome.ctaSub2')}
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={handleStart} className="bg-bg-panel text-primary px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-100 transition shadow-lg cursor-pointer flex items-center gap-2">
                  {t('welcome.beginFree')} <ArrowRight size={16} />
                </button>
                <button onClick={handleStart} className="border border-white/40 text-text-primary px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/10 transition cursor-pointer">
                  {t('welcome.seePro')}
                </button>
              </div>
            </div>
            <div className="bg-black/20 border border-white/20 rounded-2xl p-6 font-mono text-sm text-text-primary shadow-inner">
              <div className="flex justify-between mb-4 opacity-70 text-xs">
                <span>{t('welcome.cdLabel1')}</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t('welcome.cdLabel2')}</span>
              </div>
              <div className="text-5xl lg:text-7xl font-serif leading-none mb-6">184<span className="text-xl lg:text-2xl opacity-60 font-sans">d</span> 06<span className="text-xl lg:text-2xl opacity-60 font-sans">h</span></div>
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
  <div className="bg-bg-panel/80 backdrop-blur-md border border-border-default rounded-2xl p-6 font-mono text-xs flex flex-col gap-4 relative overflow-hidden shadow-2xl h-full">
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
    <div className="relative aspect-square bg-primary/5 border border-primary/20 rounded-3xl overflow-hidden p-5 flex-1 w-full max-w-md mx-auto">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r="46" stroke="rgba(212, 97, 60, 0.2)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="34" stroke="rgba(212, 97, 60, 0.2)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="22" stroke="rgba(212, 97, 60, 0.2)" strokeDasharray="0.5 1.5" fill="none" />
        <circle cx="50" cy="50" r="10" stroke="rgba(212, 97, 60, 0.3)" fill="none" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.d * 0.18} fill="var(--color-primary, #D4613C)" opacity={d.a}>
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
    <div className="font-mono text-2xl md:text-3xl font-medium text-text-primary flex items-center">
      {live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />}
      {n}
    </div>
    <div className="text-[11px] text-text-secondary mt-1 font-mono tracking-widest uppercase">{label}</div>
  </div>
);

const FeatureCard = ({ col, tag, title, body, stat, icon, tone }) => {
  const toneMap = {
    rust: { bg: "bg-bg-surface-dark", accent: "text-primary", border: "border-border-default", dotBg: "bg-bg-surface" },
    indigo: { bg: "bg-bg-surface-dark", accent: "text-indigo-400", border: "border-border-default", dotBg: "bg-bg-surface" },
    moss: { bg: "bg-bg-surface-dark", accent: "text-[#2B7A4B]", border: "border-border-default", dotBg: "bg-bg-surface" },
    gold: { bg: "bg-bg-surface-dark", accent: "text-[#BFA532]", border: "border-border-default", dotBg: "bg-bg-surface" },
    ink: { bg: "bg-gradient-to-br from-[#2a2926] to-[#1f1e1b]", accent: "text-primary", border: "border-border-muted", dotBg: "bg-white/10" }
  };
  const t = toneMap[tone] || toneMap.rust;
  
  return (
    <div className={`${col} ${t.bg} border ${t.border} p-6 lg:p-8 rounded-3xl flex flex-col gap-4 text-text-primary min-h-[200px] shadow-lg hover:border-white/20 transition-all cursor-default`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] tracking-[2px] uppercase font-bold ${t.accent}`}>{tag}</span>
        <span className={`w-10 h-10 rounded-xl ${t.dotBg} flex items-center justify-center ${t.accent}`}>
          {icon}
        </span>
      </div>
      <h3 className="text-2xl font-serif text-text-primary leading-tight">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
      <div className={`mt-auto pt-4 border-t border-dashed border-border-default font-mono text-[11px] text-text-muted tracking-widest uppercase`}>
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
