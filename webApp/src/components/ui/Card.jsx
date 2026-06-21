import React from 'react';

/**
 * Document-aesthetic card.
 * - Flat navy surface, gold-tinted border — no glassmorphism
 * - accentColor: optional GS-tagged left column rule
 *   'primary' | 'gs1' | 'gs2' | 'gs3' | 'gs4'
 * - hover: subtle lift + border brightens
 * - glow: saffron glow ring for featured cards
 */

const accentColorMap = {
  primary: '#C4902A',
  gs1:     '#C4902A',
  gs2:     '#3B6CC4',
  gs3:     '#2D8A5E',
  gs4:     '#9B4ECA',
};

export default function Card({
  accentColor,
  hover = false,
  glow = false,
  className = '',
  children,
  ...props
}) {
  const accentBorder = accentColor
    ? `border-l-2`
    : '';

  const accentStyle = accentColor
    ? { borderLeftColor: accentColorMap[accentColor] || '#C4902A', paddingLeft: '16px' }
    : {};

  const glowStyle = glow
    ? { boxShadow: '0 0 60px rgba(196,144,42,0.15), 0 0 0 1px rgba(196,144,42,0.2)' }
    : {};

  return (
    <div
      className={`cc-panel ${hover ? 'cc-panel-hover' : ''} ${accentBorder} ${className}`}
      style={{ ...accentStyle, ...glowStyle }}
      {...props}
    >
      {children}
    </div>
  );
}
