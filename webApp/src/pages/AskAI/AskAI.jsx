import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Plus, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AskAI = () => {
  const { t } = useTranslation();
  
  // For the demo we hardcode the initial conversation
  const [messages, setMessages] = useState([
    { role: "ai", text: "Good morning. I'm trained on the UPSC syllabus, every NCERT (VI–XII), and 14,200 PYQs. Ask me a concept, a past question, or for a 3-minute revision on any topic. I cite sources every time.", cites: [] },
    { role: "user", text: "Explain the Cabinet Mission Plan of 1946. Why does PYQ-2023-014 trip 60% of aspirants?" },
    { role: "ai", text: "The Cabinet Mission (Mar–Jun 1946) was the British government's last attempt to transfer power without partition. Three members: Pethick-Lawrence, Cripps, A.V. Alexander.\n\nThree pillars of the proposal:\n1. A federal Union with three subjects only — defence, foreign affairs, communications.\n2. A three-tier grouping of provinces (A: Hindu-majority, B: Muslim-majority NW, C: Bengal+Assam).\n3. An interim government drawn from existing Central Assembly members; a single Constituent Assembly to draft the new Constitution.\n\nWhy PYQ-2023-014 trips aspirants: 60% pick option D (\"all three correct\"), confusing the Mission's acceptance of a single Constituent Assembly with a separate one for the League. Statement 2 in the question is the trap — the Mission did not 'reject' the idea so much as never propose it. The League pressed for a separate Assembly later.\n\nWant me to queue 5 related PYQs from 2014, 2017, 2019, 2022, and 2024 to drill the pattern?", cites: ["NCERT XII · Themes in Indian History III · Ch. 14", "Bipan Chandra · India's Struggle for Independence · pp. 472–478", "PYQ-2023-014 · PYQ-2014-031"] }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef();

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }, { role: "ai", text: t('askAI.mentorThinking'), thinking: true, cites: [] }]);
    setInput("");
  };

  const sessions = [
    { t: "Cabinet Mission · 1946", time: "now", live: true },
    { t: "Money Bill vs Finance Bill", time: "2h" },
    { t: "Monsoon ITCZ explanation", time: "yesterday" },
    { t: "Bretton Woods → BRICS", time: "2 days" },
    { t: "Ethics: utilitarianism cases", time: "3 days" },
    { t: "Mains essay outline · health", time: "1 wk" },
  ];

  const cites = [
    "NCERT XII · Themes Vol III · Ch. 14",
    "Bipan Chandra · India's Struggle pp. 472–478",
    "PYQ-2023-014 · Polity",
    "PYQ-2014-031 · Polity"
  ];

  const queuedPyqs = [
    { id: "Q-2014-031", t: "Constituent Assembly composition", a: "52%" },
    { id: "Q-2017-088", t: "Article 110 vs Money Bill", a: "38%" },
    { id: "Q-2019-007", t: "Mountbatten Plan distinctions", a: "61%" },
  ];

  const suggestions = [t('askAI.suggestions.quiz'), t('askAI.suggestions.cite'), t('askAI.suggestions.flashcard'), t('askAI.suggestions.pyq')];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6 px-8 pt-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] tracking-[2px] text-primary font-bold mb-2 uppercase">{t('askAI.mentorMode')}</div>
            <h1 className="text-3xl font-serif text-white mb-2">
              {t('askAI.titlePrefix')}<em className="text-primary italic not-italic">{t('askAI.titleEm')}</em>{t('askAI.titleSuffix')}
            </h1>
            <p className="text-sm text-[#A3A19E] max-w-2xl">{t('askAI.dek')}</p>
          </div>
          <div className="hidden md:flex bg-[#2B7A4B]/10 border border-[#2B7A4B]/30 text-[#2B7A4B] px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B7A4B] animate-pulse" />
            {t('askAI.speedChip')}
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 h-full">
          {/* Left Rail */}
          <aside className="bg-[#1C1B18] border border-[#2f2d2a] rounded-2xl hidden lg:flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#2f2d2a] flex justify-between items-center">
              <div className="text-[10px] tracking-widest text-[#A3A19E] font-bold">{t('askAI.sessions')}</div>
              <button className="text-[#A3A19E] hover:text-white transition cursor-pointer"><Plus size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#2f2d2a_transparent]">
              {sessions.map((s, i) => (
                <div key={i} className={`p-4 border-b border-[#2f2d2a] cursor-pointer transition ${i === 0 ? 'bg-[#292825]' : 'hover:bg-[#292825]/50'}`}>
                  <div className="text-[13px] text-[#EBEAE8] flex items-center gap-2">
                    {s.live && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                    <span className="truncate">{s.t}</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#716F6C] mt-1 tracking-wider">{s.time}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#2f2d2a] bg-[#11100F]">
              <div className="font-mono text-[10px] text-primary tracking-widest mb-1">{t('askAI.aiCredits')}</div>
              <div className="text-[11px] text-[#716F6C]">{t('askAI.proPlanInfo')}</div>
            </div>
          </aside>

          {/* Center Chat */}
          <div className="bg-[#1C1B18] border border-[#2f2d2a] rounded-2xl flex flex-col overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 [scrollbar-width:thin] [scrollbar-color:#2f2d2a_transparent]">
              {messages.map((m, i) => <Bubble key={i} m={m} t={t} />)}
              <div ref={endRef} />
            </div>

            <div className="p-4 bg-[#11100F] border-t border-[#2f2d2a]">
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((s, i) => (
                  <button key={i} className="text-[11px] text-[#A3A19E] bg-[#1C1B18] border border-[#2f2d2a] px-3 py-1.5 rounded-lg hover:text-white hover:border-[#716F6C] transition cursor-pointer">
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 items-center bg-[#1C1B18] border border-[#2f2d2a] rounded-xl p-2 px-4 focus-within:border-[#716F6C] transition">
                <Sparkles size={16} className="text-[#A3A19E]" />
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder={t('askAI.inputPlaceholder')}
                  className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#EBEAE8] placeholder:text-[#716F6C]"
                />
                <span className="hidden sm:inline font-mono text-[10px] text-[#716F6C] border border-[#2f2d2a] px-2 py-0.5 rounded">⌘ ↵</span>
                <button onClick={send} className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition ml-1 cursor-pointer">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Rail */}
          <aside className="hidden lg:flex flex-col gap-4 overflow-hidden">
            <div className="bg-[#1C1B18] border border-[#2f2d2a] rounded-2xl p-4">
              <div className="text-[10px] tracking-widest text-[#A3A19E] font-bold mb-3">{t('askAI.citedKicker')}</div>
              <ul className="flex flex-col gap-2">
                {cites.map((c, i) => (
                  <li key={i} className="px-3 py-2 border border-[#2f2d2a] rounded-lg bg-[#292825] flex justify-between items-center text-[11px] text-[#EBEAE8] cursor-pointer hover:border-[#A3A19E] transition">
                    <span className="truncate mr-2">{c}</span>
                    <ChevronRight size={12} className="text-[#A3A19E] shrink-0" />
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1C1B18] border border-[#2f2d2a] rounded-2xl p-4 flex-1">
              <div className="text-[10px] tracking-widest text-[#A3A19E] font-bold mb-3">{t('askAI.relatedPyqKicker')}</div>
              <div className="flex flex-col">
                {queuedPyqs.map((p, i) => (
                  <div key={p.id} className={`py-3 flex items-center justify-between gap-3 ${i !== 0 ? 'border-t border-[#2f2d2a]' : ''}`}>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-[#716F6C] tracking-widest mb-1">{p.id} · NAT'L {p.a}</div>
                      <div className="text-[12px] text-[#EBEAE8] truncate">{p.t}</div>
                    </div>
                    <button className="text-[10px] bg-[#292825] hover:bg-[#3A3935] border border-[#2f2d2a] px-3 py-1.5 rounded-lg text-white transition shrink-0 cursor-pointer">
                      {t('askAI.drillBtn')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mt-auto">
              <div className="text-[10px] tracking-widest text-primary/70 font-bold uppercase">{t('askAI.factKicker')}</div>
              <p className="text-[11px] text-primary/80 mt-2 leading-relaxed">
                {t('askAI.factText')}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ m, t }) => {
  if (m.role === "user") {
    return (
      <div className="self-end max-w-[90%] md:max-w-[80%] bg-[#292825] border border-[#3A3935] text-[#EBEAE8] px-5 py-3 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-sm">
        {m.text}
      </div>
    );
  }
  return (
    <div className="self-start max-w-[95%] md:max-w-[85%] flex gap-3 md:gap-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#BFA532] flex items-center justify-center text-white shrink-0 shadow-lg">
        <Sparkles size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] text-[#716F6C] tracking-[0.15em] mb-2 uppercase">
          {m.thinking ? t('askAI.mentorThinking') : t('askAI.mentorReply')}
        </div>
        <div className="bg-[#11100F] border border-[#2f2d2a] px-4 md:px-5 py-3 md:py-4 rounded-2xl rounded-tl-sm text-[13px] md:text-[14px] leading-relaxed text-[#EBEAE8] whitespace-pre-wrap shadow-sm">
          {m.text}
        </div>
        {m.cites && m.cites.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {m.cites.map((c, i) => (
              <span key={i} className="text-[10px] bg-[#292825] border border-[#3A3935] text-[#A3A19E] px-2 py-1 rounded-md cursor-pointer hover:text-white transition">
                ↳ {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AskAI;
