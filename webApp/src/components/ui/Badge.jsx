import React from 'react';

const variants = {
  default: 'bg-white/8 text-text-secondary border-border-default',
  primary: 'bg-primary/10 text-primary border-primary/20',
  gs1: 'bg-[#2B7A4B]/10 text-[#2B7A4B] border-[#2B7A4B]/20',
  gs2: 'bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/20',
  gs3: 'bg-[#BFA532]/10 text-[#BFA532] border-[#BFA532]/20',
  gs4: 'bg-[#CE82FF]/10 text-[#CE82FF] border-[#CE82FF]/20',
  green: 'bg-[#2B7A4B]/10 text-[#2B7A4B] border-[#2B7A4B]/20',
  gold: 'bg-[#BFA532]/10 text-[#BFA532] border-[#BFA532]/20',
  ai: 'bg-primary/10 text-primary border-primary/20',
};

export default function Badge({ variant = 'default', icon, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full ${variants[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
