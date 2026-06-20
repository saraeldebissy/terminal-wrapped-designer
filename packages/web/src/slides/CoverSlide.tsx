import { motion } from 'motion/react';
import type { SlideViewProps } from './types';
import { copy } from './copy';

function yearLabel(start?: string, end?: string): string {
  const d = end ?? start;
  return d ? new Date(d).getFullYear().toString() : '';
}

export function CoverSlide({ stats }: SlideViewProps) {
  return (
    <div>
      <motion.p className="font-mono text-lime text-sm md:text-base uppercase tracking-widest"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {copy.coverKicker} {yearLabel(stats.meta.dateRange.start, stats.meta.dateRange.end)}
      </motion.p>
      <motion.h1 className="mt-4 font-display font-extrabold text-5xl md:text-7xl leading-[0.95]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
        {copy.coverTitle}
      </motion.h1>
    </div>
  );
}
