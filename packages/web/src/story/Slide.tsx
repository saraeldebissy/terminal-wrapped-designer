import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { PALETTE, type ColorToken } from '../theme/palette';
import { BackgroundDecor } from '../components/BackgroundDecor';
import { TerminalChrome } from '../components/TerminalChrome';
import { SlideTintContext } from '../components/SlideTint';

export interface SlideProps {
  bg: ColorToken;
  /** Optional `$ command` shown in the terminal-window prompt line. */
  command?: string;
  children: ReactNode;
}

/**
 * Full-bleed slide: a palette background + decorative layer, with the slide's
 * content framed in a terminal window centered in the viewport.
 */
export function Slide({ bg, command, children }: SlideProps) {
  const { bg: background, text } = PALETTE[bg];
  return (
    <motion.section
      className="absolute inset-0 flex flex-col justify-center items-center px-5 md:px-10"
      style={{ backgroundColor: background, color: text }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <BackgroundDecor tint={text} />
      <div className="relative z-10 w-full flex justify-center">
        <TerminalChrome tint={text} command={command}>
          <SlideTintContext.Provider value={text}>{children}</SlideTintContext.Provider>
        </TerminalChrome>
      </div>
    </motion.section>
  );
}
