import React, { useState, useEffect } from 'react';

/**
 * Sticky table of contents for reading pages.
 * items: [{ id: string, label: string, level?: 1|2 }]
 * Highlights the active section as user scrolls.
 */
export default function TableOfContents({ items = [], className = '' }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (!items.length) return;
    const observers = [];
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: '-20% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className={`sticky top-[80px] ${className}`}>
      <p className="text-[10px] font-medium tracking-[1.5px] uppercase text-text-muted mb-3">
        On this page
      </p>
      <ul className="flex flex-col gap-0.5 border-l border-border-default">
        {items.map(({ id, label, level = 1 }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={e => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`block py-1 transition-colors duration-150 text-[13px] leading-snug
                ${level === 2 ? 'pl-6' : 'pl-4'}
                ${activeId === id
                  ? 'text-primary border-l-2 border-primary -ml-px pl-[15px]'
                  : 'text-text-muted hover:text-text-secondary'
                }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
