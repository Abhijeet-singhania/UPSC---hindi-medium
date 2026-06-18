import React from 'react';

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-white border-transparent',
  secondary: 'bg-transparent border-border-strong text-text-primary hover:bg-white/5',
  ghost: 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  danger: 'bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-[13px] rounded-md gap-1.5',
  md: 'px-4 py-2 text-[14px] rounded-lg gap-2',
  lg: 'px-6 py-3 text-[15px] rounded-lg gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center border font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
