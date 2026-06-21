import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Loader2, Check, Lock, BookOpen, Star, Target, Crosshair, Zap, Shield, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const AIDailyPlanPanel = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/v1/ai/daily-plan`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan) {
          setPlan(data.plan);
          setStage(data.exam_stage || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return null;
  if (loading) return (
    <div className="cc-panel border border-primary/20 rounded-xl p-5 flex items-center gap-3 text-text-muted bg-primary/5">
      <Loader2 size={16} className="animate-spin text-primary" />
      <span className="text-[13px] font-mono uppercase tracking-widest text-primary/80">Calculating daily directives...</span>
    </div>
  );
  if (!plan) return null;

  return (
    <div className="cc-panel p-6 border-l-4 border-l-primary bg-gradient-to-r from-bg-surface-dark to-bg-base relative overflow-hidden">
      {/* Sci-fi background grid effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-primary fill-primary/20" />
            <h3 className="font-mono text-[16px] font-bold text-text-primary tracking-widest uppercase">Daily Directives</h3>
          </div>
          <p className="text-[12px] font-mono text-text-muted uppercase tracking-wider">AI-Optimized Protocol • Stage: {stage}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {plan.map((block, i) => (
          <button
            key={i}
            onClick={() => block.route && navigate(block.route)}
            className="group relative flex flex-col items-start p-4 text-left cursor-pointer border border-border-default bg-bg-base/80 hover:border-primary/50 transition-all rounded-lg overflow-hidden"
          >
            {/* Hover scanline effect */}
            <div className="absolute inset-0 bg-primary/10 -translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
            
            <div className="flex items-center gap-2 mb-3 w-full">
              <div className="text-[10px] font-mono text-primary/80 border border-primary/30 px-1.5 py-0.5 bg-primary/5 rounded shadow-[0_0_8px_rgba(212,97,60,0.15)]">
                {block.time}
              </div>
              {block.subject && (
                <div className="text-[10px] font-mono text-text-muted uppercase truncate flex-1 text-right">
                  {block.subject}
                </div>
              )}
            </div>
            <div className="text-[13px] font-bold text-text-primary group-hover:text-primary transition-colors z-10 leading-snug">
              {block.activity}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// SVG Circuit Connector
const CircuitConnector = ({ isCompleted, isNextActive }) => {
  const strokeColor = isCompleted ? '#2B7A4B' : isNextActive ? '#D4613C' : '#333';
  const glow = isNextActive ? 'drop-shadow(0 0 4px rgba(212,97,60,0.6))' : isCompleted ? 'drop-shadow(0 0 4px rgba(43,122,75,0.6))' : 'none';
  
  return (
    <div className="absolute top-[80px] w-[2px] h-[60px] -z-10 flex items-center justify-center">
      <div className="h-full w-full relative" style={{ filter: glow }}>
        <div className={`absolute inset-0 ${isCompleted ? 'bg-[#2B7A4B]' : isNextActive ? 'bg-primary' : 'bg-border-default'}`} />
        {/* Animated energy pulse if active */}
        {isNextActive && (
          <div className="absolute top-0 left-[-1px] w-[4px] h-1/3 bg-white rounded-full animate-[slideDown_1.5s_infinite]" />
        )}
      </div>
    </div>
  );
};

// Quest Node Component
const QuestNode = ({ node, index, isLast, nextNodeStatus, onClick, isActiveGlobal }) => {
  const isCompleted = node.status === 'completed';
  const isActive = node.status === 'active';
  const isLocked = node.status === 'locked';
  const isSelected = isActiveGlobal && node.id === isActiveGlobal.id;
  const isLeft = index % 2 === 0;

  // Gaming hexagon shape
  const hexClipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <div className="relative flex items-center justify-center w-full">
      
      {/* Left Label (Visible if isLeft is true) */}
      <div className={`w-[180px] text-right pr-6 ${!isLeft ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className={`text-[12px] font-mono tracking-widest uppercase mb-1 ${isActive ? 'text-primary font-bold drop-shadow-[0_0_5px_rgba(212,97,60,0.5)]' : isCompleted ? 'text-[#4ade80]' : 'text-text-primary'}`}>
          {node.title}
        </div>
        <div className="text-[11px] text-text-muted italic">{node.subtitle}</div>
      </div>

      {/* Center Node Button wrapper for sizing and glow */}
      <div className={`relative w-[70px] h-[80px] shrink-0 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 z-10 ${isSelected ? 'scale-110' : ''}`}
           onClick={() => onClick(node)}>
        
        {/* Background Hexagon (Border) */}
        <div 
          className={`absolute inset-0 transition-colors duration-500
            ${isCompleted ? 'bg-[#2B7A4B]' : ''}
            ${isActive ? 'bg-primary' : ''}
            ${isLocked ? 'bg-border-default' : ''}
          `}
          style={{ clipPath: hexClipPath, filter: isActive ? 'drop-shadow(0 0 10px rgba(212,97,60,0.8))' : isCompleted ? 'drop-shadow(0 0 8px rgba(43,122,75,0.6))' : 'none' }}
        ></div>

        {/* Inner Hexagon (Fill) */}
        <div 
          className={`absolute inset-[3px] flex items-center justify-center transition-colors duration-500
            ${isCompleted ? 'bg-[#143d25]' : ''}
            ${isActive ? 'bg-[#3d1910]' : ''}
            ${isLocked ? 'bg-bg-surface-dark' : ''}
          `}
          style={{ clipPath: hexClipPath }}
        >
          {isCompleted && <Check size={26} strokeWidth={3} className="text-[#4ade80]" />}
          {isActive && <Crosshair size={26} strokeWidth={2} className="text-primary animate-spin-slow" />}
          {isLocked && <Lock size={20} className="text-text-muted opacity-50" />}
        </div>
        
        {/* Selection Reticle */}
        {isSelected && (
           <div className="absolute -inset-3 border border-primary/40 rounded-full animate-spin-slow pointer-events-none" style={{ borderStyle: 'dashed', animationDuration: '8s' }}></div>
        )}

        {/* Crown/Star for capstones */}
        {node.isCapstone && (
          <div className="absolute -top-4 -right-3 z-20">
             <Star size={20} fill={isCompleted ? "#FFD700" : isActive ? "#D4613C" : "transparent"} color={isCompleted ? "#FFD700" : isActive ? "#D4613C" : "#555"} 
                   className={isActive ? 'drop-shadow-[0_0_8px_rgba(212,97,60,0.8)] animate-pulse' : isCompleted ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : ''} />
          </div>
        )}
      </div>

      {/* Right Label (Visible if isLeft is false) */}
      <div className={`w-[180px] text-left pl-6 ${isLeft ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className={`text-[12px] font-mono tracking-widest uppercase mb-1 ${isActive ? 'text-primary font-bold drop-shadow-[0_0_5px_rgba(212,97,60,0.5)]' : isCompleted ? 'text-[#4ade80]' : 'text-text-primary'}`}>
          {node.title}
        </div>
        <div className="text-[11px] text-text-muted italic">{node.subtitle}</div>
      </div>

      {/* Connecting Path */}
      {!isLast && (
        <CircuitConnector isCompleted={isCompleted} isNextActive={nextNodeStatus === 'active'} />
      )}
    </div>
  );
};

// Quest Detail Panel - Gaming UI
const QuestDetail = ({ node }) => {
  if (!node) return null;
  const isLocked = node.status === 'locked';
  const isCompleted = node.status === 'completed';
  const isActive = node.status === 'active';

  return (
    <div className="cc-panel border border-border-default bg-bg-surface-dark overflow-hidden sticky top-6 shadow-2xl">
      {/* Header Bar */}
      <div className={`px-5 py-3 flex items-center justify-between border-b
        ${isCompleted ? 'bg-[#143d25] border-[#2B7A4B]' : ''}
        ${isActive ? 'bg-[#3d1910] border-primary' : ''}
        ${isLocked ? 'bg-bg-panel border-border-default' : ''}
      `}>
        <div className="flex items-center gap-2">
           <Shield size={16} className={isCompleted ? 'text-[#4ade80]' : isActive ? 'text-primary' : 'text-text-muted'} />
           <span className={`font-mono text-[11px] font-bold tracking-widest uppercase ${isCompleted ? 'text-[#4ade80]' : isActive ? 'text-primary' : 'text-text-muted'}`}>
             Mission Briefing
           </span>
        </div>
        <div className={`font-mono text-[10px] tracking-wider px-2 py-0.5 border rounded-sm uppercase
          ${isCompleted ? 'border-[#4ade80] text-[#4ade80]' : ''}
          ${isActive ? 'border-primary text-primary animate-pulse' : ''}
          ${isLocked ? 'border-text-muted text-text-muted' : ''}
        `}>
          {node.status}
        </div>
      </div>

      <div className="p-6 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        
        <h3 className="font-mono text-[22px] font-bold text-text-primary mb-1 uppercase tracking-tight relative z-10">{node.title}</h3>
        <div className="text-[12px] text-text-muted font-mono uppercase tracking-widest mb-5 relative z-10 border-b border-border-default pb-3">
          Sector: {node.subtitle}
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed mb-6 font-sans relative z-10 bg-bg-base/50 p-3 border border-border-default rounded">
          {node.description || "Analyze intelligence data and complete strategic objectives to advance to the next sector. Failure is not an option."}
        </p>

        {!isLocked && node.tasks && (
          <div className="space-y-4 relative z-10">
            <h4 className="text-[12px] font-mono font-bold uppercase tracking-widest text-text-primary mb-3 flex items-center gap-2">
              <Target size={14} className="text-primary"/> Objectives
            </h4>
            
            <div className="flex flex-col gap-2">
              {node.tasks.map((task, i) => (
                <div key={i} className={`flex items-center gap-3 p-2.5 border rounded bg-bg-panel transition-colors
                  ${task.done ? 'border-[#2B7A4B]/30' : 'border-border-default hover:border-text-muted/50'}
                `}>
                  <div className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 border-2
                    ${task.done ? 'border-[#2B7A4B] bg-[#2B7A4B]/20 text-[#4ade80]' : 'border-border-muted text-transparent'}
                  `}>
                    {task.done && <Check size={14} strokeWidth={4} />}
                  </div>
                  
                  <div className={`text-[13px] flex-1 font-medium font-sans ${task.done ? 'text-text-muted line-through decoration-text-muted/50' : 'text-text-primary'}`}>
                    {task.title}
                  </div>
                  
                  {task.xp && (
                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border
                      ${task.done ? 'border-[#2B7A4B]/50 text-[#4ade80] bg-[#2B7A4B]/10' : 'border-primary/30 text-primary bg-primary/10'}
                    `}>
                      +{task.xp} XP
                    </div>
                  )}
                </div>
              ))}
            </div>

            {node.status === 'active' && (
              <button className="w-full mt-6 bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-white font-mono font-bold tracking-widest uppercase text-[12px] py-3 transition-all flex items-center justify-center gap-2 group relative overflow-hidden">
                <span className="relative z-10">Engage Protocol</span>
                <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full z-0"></div>
              </button>
            )}
          </div>
        )}

        {isLocked && (
          <div className="flex flex-col items-center justify-center py-10 text-center relative z-10 bg-bg-base/30 border border-border-default border-dashed rounded mt-4">
            <Lock size={36} className="text-border-muted mb-4" />
            <div className="text-[12px] font-mono font-bold tracking-widest uppercase text-text-muted mb-1">Access Denied</div>
            <p className="text-[11px] text-text-secondary font-mono">Insufficient clearance level. Complete prior sectors to unlock.</p>
          </div>
        )}
      </div>
    </div>
  );
};


const Roadmap = () => {
  const { t } = useTranslation();
  const [activeNode, setActiveNode] = useState(null);

  // Mock data for the quest tree
  const questNodes = [
    { id: 1, title: 'Phase 1: Foundation', subtitle: 'NCERTs & Basics', status: 'completed', isCapstone: true, description: 'You have mastered the foundational subjects. Base intelligence gathered.' },
    { id: 2, title: 'Ancient History', subtitle: 'Indus to Gupta', status: 'completed', tasks: [{title: 'Analyze Chapters 1-4', done: true, xp: 50}, {title: 'Execute Topic Quiz', done: true, xp: 100}] },
    { id: 3, title: 'Medieval History', subtitle: 'Delhi Sultanate', status: 'completed', tasks: [{title: 'Analyze Chapters 5-8', done: true, xp: 50}, {title: 'Execute Topic Quiz', done: true, xp: 100}] },
    { id: 4, title: 'Modern History', subtitle: 'Freedom Struggle', status: 'active', tasks: [{title: 'Revolt of 1857 Databanks', done: true, xp: 50}, {title: 'INC Formation Timeline', done: false, xp: 60}, {title: 'Gandhi Era Part 1', done: false, xp: 80}] },
    { id: 5, title: 'Indian Economy', subtitle: 'Macroeconomics', status: 'locked', tasks: [{title: 'Monetary Policy & RBI', done: false, xp: 100}, {title: 'Fiscal Policy & Budget', done: false, xp: 100}, {title: 'Simulation: 30 MCQs', done: false, xp: 150}] },
    { id: 6, title: 'Phase 2: Core', subtitle: 'Advanced GS', status: 'locked', isCapstone: true, description: 'The core of the UPSC syllabus. Deep dive into Mains specific topics.' },
    { id: 7, title: 'Polity', subtitle: 'Constitution', status: 'locked' },
    { id: 8, title: 'Geography', subtitle: 'India & World', status: 'locked' },
  ];

  // Set initial active node
  useEffect(() => {
    if (!activeNode) {
      const active = questNodes.find(n => n.status === 'active') || questNodes[0];
      setActiveNode(active);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Global CSS for animations */}
      <style>{`
        @keyframes slideDown {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>

      <AIDailyPlanPanel />

      <div>
        <PageHeader title={t('roadmap.title')} subtitle="Navigate the tactical skill tree." />
        
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          
          {/* Left: Visual Quest Map - Gaming grid background */}
          <div className="flex-1 w-full cc-panel border border-border-default bg-bg-base overflow-hidden flex justify-center py-20 relative rounded-xl">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center' }}></div>
            
            {/* Central energy line subtle glow */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>

            <div className="flex flex-col gap-[60px] items-center relative z-10 w-full">
              {questNodes.map((node, idx) => (
                <QuestNode 
                  key={node.id} 
                  node={node} 
                  index={idx} 
                  isLast={idx === questNodes.length - 1} 
                  nextNodeStatus={idx < questNodes.length - 1 ? questNodes[idx+1].status : null}
                  onClick={setActiveNode}
                  isActiveGlobal={activeNode}
                />
              ))}
            </div>
          </div>

          {/* Right: Quest Details Panel */}
          <div className="w-full lg:w-[380px] shrink-0">
             <QuestDetail node={activeNode} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Roadmap;
