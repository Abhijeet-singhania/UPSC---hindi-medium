import React from 'react';
import { motion } from 'framer-motion';
import { useAvatar } from '../../context/AvatarContext';

const STATE_CONFIG = {
  idle: {
    color: '#F59E0B', // amber-500
    glow: 'rgba(245, 158, 11, 0.4)',
    yFloat: [0, -10, 0],
    floatDuration: 4,
    scale: 1,
    eyeColor: '#FFFFFF',
    maneOpacity: [0.4, 0.5, 0.4],
  },
  thinking: {
    color: '#8B5CF6', // violet-500
    glow: 'rgba(139, 92, 246, 0.6)',
    yFloat: [-5, -10, -5],
    floatDuration: 2,
    scale: 0.95,
    eyeColor: '#C084FC', // glowing purple
    maneOpacity: [0.3, 0.8, 0.3], // pulsing mane
  },
  action: {
    color: '#EA580C', // orange-600
    glow: 'rgba(234, 88, 12, 0.6)',
    yFloat: [0, -5, 5, -5, 0],
    floatDuration: 0.5,
    scale: 1.1,
    eyeColor: '#FEF08A', // yellow aggressive
    maneOpacity: [0.6, 0.9, 0.6],
  },
  fun: {
    color: '#EC4899', // pink-500
    glow: 'rgba(236, 72, 153, 0.5)',
    yFloat: [0, -30, 0],
    floatDuration: 0.8,
    scale: 1.05,
    eyeColor: '#FFFFFF',
    maneOpacity: [0.5, 0.6, 0.5],
  },
  low: {
    color: '#64748B', // slate-500
    glow: 'rgba(100, 116, 139, 0.2)',
    yFloat: [15, 20, 15],
    floatDuration: 6,
    scale: 0.9,
    eyeColor: '#94A3B8', // dull eyes
    maneOpacity: [0.2, 0.3, 0.2],
  }
};

const BrandMascot = () => {
  const { avatarState, setAvatarState } = useAvatar();
  
  const config = STATE_CONFIG[avatarState] || STATE_CONFIG.idle;

  const handleClick = () => {
    if (avatarState !== 'fun') {
      setAvatarState('fun', 2000);
    }
  };

  return (
    <motion.div 
      className="fixed bottom-24 right-8 z-[150] cursor-pointer drop-shadow-2xl"
      onClick={handleClick}
      initial={false}
      animate={{
        y: config.yFloat,
        scale: config.scale,
      }}
      transition={{
        y: {
          duration: config.floatDuration,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: { duration: 0.4 }
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      title={`Mascot State: ${avatarState}`}
    >
      {/* Low-Poly Lion SVG */}
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        
        {/* Glow Filter */}
        <defs>
          <filter id="lionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <motion.g 
          filter="url(#lionGlow)"
          animate={{ color: config.color }}
          transition={{ duration: 0.5 }}
        >
          {/* Top head */}
          <polygon points="40,20 60,20 50,10" fill="currentColor" opacity="0.5" />
          
          {/* Left brow/forehead */}
          <polygon points="50,40 30,35 40,20 50,25" fill="currentColor" opacity="0.7" />
          {/* Right brow/forehead */}
          <polygon points="50,40 70,35 60,20 50,25" fill="currentColor" opacity="0.7" />
          
          {/* Nose bridge */}
          <polygon points="50,40 45,60 55,60" fill="currentColor" opacity="0.8" />
          {/* Nose tip */}
          <polygon points="45,60 55,60 50,68" fill="#1E293B" opacity="0.9" />
          
          {/* Left cheek */}
          <polygon points="50,40 30,35 25,55 45,60" fill="currentColor" opacity="0.6" />
          {/* Right cheek */}
          <polygon points="50,40 70,35 75,55 55,60" fill="currentColor" opacity="0.6" />
          
          {/* Chin */}
          <polygon points="45,60 55,60 50,80" fill="currentColor" opacity="0.5" />
          
          {/* Left Jaw */}
          <polygon points="45,60 20,70 50,80" fill="currentColor" opacity="0.3" />
          {/* Right Jaw */}
          <polygon points="55,60 80,70 50,80" fill="currentColor" opacity="0.3" />

          {/* Left Ear */}
          <polygon points="20,15 30,5 40,20" fill="currentColor" opacity="0.6" />
          {/* Right Ear */}
          <polygon points="80,15 70,5 60,20" fill="currentColor" opacity="0.6" />

          {/* Dynamic Mane Elements */}
          <motion.g
            animate={{ opacity: config.maneOpacity }}
            transition={{ duration: config.floatDuration / 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Left Mane */}
            <polygon points="40,20 20,15 30,35" fill="currentColor" />
            <polygon points="30,35 15,40 25,55" fill="currentColor" />
            <polygon points="25,55 20,70 45,60" fill="currentColor" />
            
            {/* Right Mane */}
            <polygon points="60,20 80,15 70,35" fill="currentColor" />
            <polygon points="70,35 85,40 75,55" fill="currentColor" />
            <polygon points="75,55 80,70 55,60" fill="currentColor" />
          </motion.g>

          {/* Eyes */}
          <motion.polygon 
            points="38,36 44,40 35,42" 
            animate={{ fill: config.eyeColor }} 
            transition={{ duration: 0.3 }}
          />
          <motion.polygon 
            points="62,36 56,40 65,42" 
            animate={{ fill: config.eyeColor }} 
            transition={{ duration: 0.3 }}
          />
        </motion.g>

      </svg>
    </motion.div>
  );
};

export default BrandMascot;
