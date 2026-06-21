import { motion } from 'motion/react';

/**
 * A blinking block cursor — the small terminal tell that makes static text
 * feel alive. Decorative only, hidden from the accessibility tree.
 */
export function Cursor({ className = '' }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-block ${className}`}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear', times: [0, 0.5, 0.5, 1] }}
    >
      ▮
    </motion.span>
  );
}
