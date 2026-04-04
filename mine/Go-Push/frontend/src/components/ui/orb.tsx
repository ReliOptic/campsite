'use client';

import { motion } from 'framer-motion';
import { colors } from '@/config/theme';

interface OrbProps {
  label: string;
  color: string;
  glowColor: string;
  selected: boolean;
  onClick: () => void;
}

export function Orb({ label, color, glowColor, selected, onClick }: OrbProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-3 group"
      whileTap={{ scale: 0.92 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full relative cursor-pointer"
        style={{ background: color }}
        animate={{
          scale: selected ? [1, 1.08, 1] : 1,
          boxShadow: selected
            ? `0 0 40px 12px ${glowColor}`
            : `0 0 20px 4px ${glowColor}`,
        }}
        transition={{
          scale: {
            duration: 3,
            repeat: selected ? Infinity : 0,
            ease: 'easeInOut',
          },
          boxShadow: { duration: 0.3 },
        }}
      />
      <span
        className="text-xs tracking-[0.2em] uppercase transition-opacity duration-300"
        style={{
          color: selected ? colors.text.primary : colors.text.secondary,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}
