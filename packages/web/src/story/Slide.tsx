import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { PALETTE, type ColorToken } from '../theme/palette';

export interface SlideProps {
  bg: ColorToken;
  children: ReactNode;
}

/** Full-bleed slide: fills the viewport with a palette background and locked text color. */
export function Slide({ bg, children }: SlideProps) {
  const { bg: background, text } = PALETTE[bg];
  return (
    <motion.section
      className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24"
      style={{ backgroundColor: background, color: text }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </motion.section>
  );
}
