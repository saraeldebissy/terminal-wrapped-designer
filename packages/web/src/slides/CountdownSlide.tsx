import { motion } from 'motion/react';
import type { SlideViewProps } from './types';
import { copy, fmt } from './copy';

export function CountdownSlide({ stats }: SlideViewProps) {
  const top = stats.topCommands.slice(0, 5);
  const hero = top[0];
  // Render ranks 5..2 small, then #1 big as the payoff.
  const rest = top.slice(1).reverse(); // ranks 5,4,3,2
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.countdownKicker}</p>
      <ul className="mt-4 space-y-1">
        {rest.map((c) => {
          const rank = top.indexOf(c) + 1;
          return (
            <li key={c.name} className="flex items-baseline gap-3 text-white/70">
              <span className="font-display font-bold w-6">{rank}</span>
              <span className="font-mono">{c.name}</span>
              <span className="font-mono text-sm ml-auto">{fmt(c.count)}</span>
            </li>
          );
        })}
      </ul>
      <motion.div className="mt-6 flex items-baseline gap-4"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
        <span className="font-display font-extrabold text-lime">1</span>
        <span className="font-mono font-bold text-lime leading-none"
              style={{ fontSize: 'clamp(3rem, 14vw, 9rem)' }}>{hero.name}</span>
      </motion.div>
      <p className="mt-3 font-display font-bold text-lg md:text-2xl">{copy.countdownPayoff(hero.count)}</p>
    </div>
  );
}
