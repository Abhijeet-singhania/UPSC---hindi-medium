import React, { useEffect, useState, useRef } from 'react';
import './CustomCursor.css';

const renderSvg = (type) => {
  switch (type) {
    case 'target':
      return (
        <svg className="cursor-svg pulsing" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'energy':
      return (
        <svg className="cursor-svg flame-pulse" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case 'read':
      return (
        <svg className="cursor-svg page-turn" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          <path class="page-flip" d="M12 7c1 0 2 1 3 3v8" />
        </svg>
      );
    case 'write':
      return (
        <svg className="cursor-svg pen-write" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path className="pen-tip" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case 'library':
      return (
        <svg className="cursor-svg headphone-sound" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          <path className="sound-wave1" d="M10 14v-3" strokeWidth="1.5" />
          <path className="sound-wave2" d="M12 16v-7" strokeWidth="1.5" />
          <path className="sound-wave3" d="M14 15v-5" strokeWidth="1.5" />
        </svg>
      );
    case 'rank':
      return (
        <svg className="cursor-svg crown-shine" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <path d="M5 20h14" />
        </svg>
      );
    case 'theme':
      return (
        <svg className="cursor-svg sun-spin" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case 'link':
    default:
      return (
        <svg className="cursor-svg arrow-go" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      );
  }
};

const CustomCursor = () => {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [cursorType, setCursorType] = useState('');

  const cursorRef = useRef(null);

  // Detect mobile/touch devices to disable custom cursor
  useEffect(() => {
    const touchQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(touchQuery.matches);
    
    const handleTouchChange = (e) => setIsTouchDevice(e.matches);
    touchQuery.addEventListener('change', handleTouchChange);
    
    return () => touchQuery.removeEventListener('change', handleTouchChange);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = (e) => {
      const { clientX: x, clientY: y } = e;
      if (!visible) setVisible(true);

      // Translate wrapper div via CSS transform (GPU accelerated, no reflow)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
      }
    };

    const handleMouseDown = () => setActive(true);
    const handleMouseUp = () => setActive(false);
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      // Find closest element requiring unique cursor interactions
      const interactiveEl = target.closest('[data-cursor-type]') || 
                            target.closest('a') || 
                            target.closest('button') || 
                            target.closest('.neumorphic-card') || 
                            target.closest('.neumorphic-btn') || 
                            target.closest('[role="button"]') ||
                            target.classList.contains('cursor-zoom');

      if (interactiveEl) {
        setHovered(true);
        let type = interactiveEl.getAttribute('data-cursor-type');
        if (!type) {
          // Provide clean visual fallbacks based on context
          if (interactiveEl.tagName === 'A' || interactiveEl.closest('a')) {
            type = 'link';
          } else if (interactiveEl.tagName === 'BUTTON' || interactiveEl.closest('button') || interactiveEl.classList.contains('neumorphic-btn')) {
            type = 'link';
          } else {
            type = 'link';
          }
        }
        setCursorType(type);
      } else {
        setHovered(false);
        setCursorType('');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [visible, isTouchDevice]);

  if (isTouchDevice || !visible) return null;

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${active ? 'active' : ''} ${hovered ? 'hovered' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {hovered && cursorType ? (
        <div className="custom-cursor-svg-container">
          {renderSvg(cursorType)}
        </div>
      ) : (
        <div className="custom-cursor-dot" />
      )}
    </div>
  );
};

export default CustomCursor;
