import React, { useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Newspaper, FlaskConical, Users, ArrowRight, Compass, Edit3, Activity } from 'lucide-react';

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

  const featureCards = [
    { icon: <LayoutDashboard size={28} className="text-primary mb-4" />, title: t('welcome.featDashboard'), desc: t('welcome.featDashboardSub') },
    { icon: <Newspaper size={28} className="text-[#2B7A4B] mb-4" />, title: t('welcome.featCA'), desc: t('welcome.featCASub') },
    { icon: <FlaskConical size={28} className="text-[#BFA532] mb-4" />, title: t('welcome.featPrelims'), desc: t('welcome.featPrelimsSub') },
    { icon: <Users size={28} className="text-[#D4613C] mb-4" />, title: t('welcome.featCommunity'), desc: t('welcome.featCommunitySub') }
  ];

  const deepDiveCards = [
    { icon: <Compass size={40} className="text-[#BFA532] mb-4" />, title: t('welcome.featDetail1Title'), desc: t('welcome.featDetail1Sub') },
    { icon: <Edit3 size={40} className="text-primary mb-4" />, title: t('welcome.featDetail2Title'), desc: t('welcome.featDetail2Sub') },
    { icon: <Activity size={40} className="text-[#2B7A4B] mb-4" />, title: t('welcome.featDetail3Title'), desc: t('welcome.featDetail3Sub') },
  ];

  // Parallax transforms based on scroll
  // Hero section parallax
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  // Background blobs parallax
  const bgBlob1Y = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const bgBlob2Y = useTransform(scrollYProgress, [0, 1], [0, -300]);

  // Deep dive sections parallax
  const deepDiveTextY = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
  const deepDiveTextOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  
  const card1Y = useTransform(scrollYProgress, [0.2, 0.5], [150, -50]);
  const card2Y = useTransform(scrollYProgress, [0.2, 0.6], [200, -20]);
  const card3Y = useTransform(scrollYProgress, [0.2, 0.7], [250, 10]);

  // Testimonials Parallax
  const testSectionY = useTransform(scrollYProgress, [0.5, 0.8], [150, 0]);
  
  // CTA Parallax
  const ctaScale = useTransform(scrollYProgress, [0.7, 1], [0.8, 1]);

  return (
    <div ref={containerRef} className="bg-[#11100F] text-[#EBEAE8] font-sans relative">
      
      {/* Background aesthetic blobs/gradients (Parallaxed) */}
      <motion.div style={{ y: bgBlob1Y }} className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0" />
      <motion.div style={{ y: bgBlob2Y }} className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BFA532]/10 blur-[100px] pointer-events-none z-0" />
      
      {/* Top Navbar items */}
      <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-50 max-w-[1440px] left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#11100F] to-transparent">
        <div className="font-serif text-2xl text-white font-semibold">Drishti</div>
        <div>
           <button onClick={handleStart} className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition cursor-pointer">
             {t('welcome.login')}
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-8 relative z-10 max-w-[1200px] mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="pt-20">
            <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="text-[12px] tracking-[3px] text-primary uppercase font-bold mb-4">
               PREMIUM PREPARATION
            </motion.div>
            <motion.h1 initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.1}} className="text-5xl lg:text-7xl font-serif text-white mb-6 leading-[1.1]">
              {t('welcome.heroTitle')}
            </motion.h1>
            <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="text-lg text-[#A3A19E] mb-10 max-w-md leading-relaxed">
              {t('welcome.heroSub')}
            </motion.p>
            <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.3}}>
              <button onClick={handleStart} className="group flex items-center gap-3 bg-primary text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all cursor-pointer">
                 {t('welcome.getStarted')}
                 <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="grid grid-cols-2 gap-4">
            {featureCards.map((card, idx) => (
               <motion.div key={idx} initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4 + (idx * 0.1)}} className="bg-[#1C1B18]/80 backdrop-blur-md border border-[#2f2d2a] p-8 rounded-2xl flex flex-col justify-center">
                  {card.icon}
                  <h3 className="text-white font-medium text-lg mb-2">{card.title}</h3>
                  <p className="text-[#716F6C] text-sm">{card.desc}</p>
               </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Deep Dive Section (Parallax) */}
      <section className="min-h-screen py-32 px-8 relative z-10 max-w-[1200px] mx-auto flex flex-col justify-center">
        <motion.div style={{ y: deepDiveTextY, opacity: deepDiveTextOpacity }} className="text-center mb-24 cursor-default">
          <h2 className="text-4xl lg:text-6xl font-serif text-white mb-4">{t('welcome.deepDiveTitle')}</h2>
          <p className="text-xl text-[#A3A19E] max-w-2xl mx-auto">{t('welcome.deepDiveSub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div style={{ y: card1Y }} className="bg-[#181715] border border-[#2f2d2a] p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[0].icon}
            <h3 className="text-2xl font-serif text-white mb-3">{deepDiveCards[0].title}</h3>
            <p className="text-[#A3A19E]">{deepDiveCards[0].desc}</p>
          </motion.div>
          <motion.div style={{ y: card2Y }} className="bg-[#181715] border border-[#2f2d2a] p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[1].icon}
            <h3 className="text-2xl font-serif text-white mb-3">{deepDiveCards[1].title}</h3>
            <p className="text-[#A3A19E]">{deepDiveCards[1].desc}</p>
          </motion.div>
          <motion.div style={{ y: card3Y }} className="bg-[#181715] border border-[#2f2d2a] p-10 rounded-3xl h-[350px] shadow-2xl flex flex-col items-center text-center justify-center cursor-default">
            {deepDiveCards[2].icon}
            <h3 className="text-2xl font-serif text-white mb-3">{deepDiveCards[2].title}</h3>
            <p className="text-[#A3A19E]">{deepDiveCards[2].desc}</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section Parallaxed */}
      <section className="min-h-screen py-32 px-8 relative z-10 bg-gradient-to-b from-transparent to-[#181715] flex flex-col gap-12 justify-center cursor-default">
        <motion.div style={{ y: testSectionY }} className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-serif text-white">{t('welcome.testimonialTitle')}</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="bg-[#2B2A27] p-8 rounded-2xl md:w-1/3 relative border border-[#3A3935]">
              <div className="text-4xl text-primary font-serif absolute top-4 left-4 opacity-50">"</div>
              <p className="text-[#EBEAE8] relative z-10 italic mt-4">"I was struggling with consistency. The streak tracking and adaptive prelims lab completely changed my daily routine."</p>
              <div className="mt-6 border-t border-[#3A3935] pt-4">
                <p className="font-semibold text-white">Rahul K.</p>
                <p className="text-xs text-[#A3A19E]">Cleared Prelims 2024</p>
              </div>
            </div>
            <div className="bg-[#1C1B18] p-8 rounded-2xl md:w-1/3 relative border border-[#2f2d2a] mt-8 md:mt-16 shadow-2xl">
              <div className="text-4xl text-[#BFA532] font-serif absolute top-4 left-4 opacity-50">"</div>
              <p className="text-[#A3A19E] relative z-10 italic mt-4">"The peer review format in the community section helped me refine my Mains structure immensely. My GS3 score jumped 20 points."</p>
              <div className="mt-6 border-t border-[#2f2d2a] pt-4">
                <p className="font-semibold text-white">Priya M.</p>
                <p className="text-xs text-[#A3A19E]">Mains 2023 Candidate</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer CTA Section Parallaxed */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center relative z-10 bg-[#181715] overflow-hidden cursor-default">
        <motion.div style={{ scale: ctaScale }} className="relative z-10 text-center px-8 border border-[#2f2d2a] py-20 rounded-3xl bg-[#11100F] shadow-2xl max-w-[800px] w-full">
           <h2 className="text-4xl lg:text-5xl font-serif text-white mb-4">{t('welcome.ctaTitle')}</h2>
           <p className="text-[#A3A19E] mb-8 max-w-md mx-auto">{t('welcome.ctaSub')}</p>
           <button onClick={handleStart} className="bg-white text-[#11100F] hover:bg-gray-200 text-base font-semibold px-10 py-4 rounded-xl shadow-lg transition-all cursor-pointer">
              {t('welcome.getStarted')}
           </button>
        </motion.div>
        <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none" />
      </section>

    </div>
  );
};

export default Welcome;
