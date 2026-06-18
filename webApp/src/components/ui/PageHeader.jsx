import React from 'react';

export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className="font-serif text-[28px] font-semibold text-text-primary leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-text-muted text-[13px] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
