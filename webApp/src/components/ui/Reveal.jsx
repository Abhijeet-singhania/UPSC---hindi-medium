import React from 'react';
import { motion } from 'framer-motion';

/**
 * Wraps children in a scroll-triggered fade-up animation.
 * delay: stagger offset in seconds (e.g. 0.1 * index)
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
