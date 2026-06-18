import React from 'react';
import ProgressBar from './ProgressBar';
import Card from './Card';

export default function StatCard({
  label,
  value,
  sub,
  loading = false,
  progressValue,
  progressMax = 100,
  progressColor = 'primary',
  accentColor,
  className = '',
}) {
  return (
    <Card accentColor={accentColor} className={`p-5 flex flex-col ${className}`}>
      <div className="text-[10px] text-text-muted uppercase tracking-[1.5px] mb-2">{label}</div>
      <div className="text-[32px] font-serif text-text-primary leading-none mb-1">
        {loading ? (
          <span className="inline-block w-8 h-6 bg-border-default rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      {sub && <div className="text-[12px] text-text-muted mb-4">{sub}</div>}
      {progressValue !== undefined && (
        <ProgressBar
          value={progressValue}
          max={progressMax}
          color={progressColor}
          className="mt-auto"
        />
      )}
    </Card>
  );
}
