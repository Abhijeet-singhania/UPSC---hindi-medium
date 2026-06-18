import React from 'react';

const colorMap = {
  primary: 'bg-primary',
  green: 'bg-[#2B7A4B]',
  gold: 'bg-[#BFA532]',
  blue: 'bg-[#1CB0F6]',
  purple: 'bg-[#CE82FF]',
};

export default function ProgressBar({ value = 0, max = 100, color = 'primary', className = '' }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={`h-1 bg-border-default rounded-full w-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color] ?? colorMap.primary}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
