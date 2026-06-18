import React from 'react';

export default function EmptyState({ icon, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="text-text-muted mb-4 opacity-50">{icon}</div>
      )}
      {title && (
        <p className="text-text-secondary font-medium text-[15px] mb-1">{title}</p>
      )}
      {subtitle && (
        <p className="text-text-muted text-[13px] max-w-[280px]">{subtitle}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
