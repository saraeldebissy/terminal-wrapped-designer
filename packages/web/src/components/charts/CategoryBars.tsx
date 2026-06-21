import { motion } from 'motion/react';
import { rgba } from '../../theme/color';
import type { Stats } from '../../api/types';

/**
 * Ranked horizontal bars for the top command categories. The #1 category is
 * drawn in the accent color; bars grow from zero width with a small stagger.
 * Each row shows the category name and its share of total commands.
 */
export function CategoryBars({
  categories,
  total,
  tint,
  accent,
}: {
  categories: Stats['categories'];
  total: number;
  tint: string;
  accent: string;
}) {
  const top = categories.slice(0, 5);
  const max = Math.max(1, ...top.map((c) => c.count));

  return (
    <ul className="w-full space-y-2.5">
      {top.map((c, i) => {
        const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
        const w = (c.count / max) * 100;
        return (
          <li key={c.slug ?? c.name} className="flex items-center gap-3">
            <span
              className="font-mono text-xs md:text-sm w-24 md:w-36 shrink-0 truncate"
              style={{ color: rgba(tint, 0.8) }}
            >
              {c.name}
            </span>
            <span
              className="relative flex-1 h-3 md:h-3.5 rounded-full overflow-hidden"
              style={{ backgroundColor: rgba(tint, 0.12) }}
            >
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: i === 0 ? accent : rgba(tint, 0.45) }}
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
              />
            </span>
            <span
              className="font-mono text-xs md:text-sm w-9 text-right tabular-nums"
              style={{ color: rgba(tint, 0.6) }}
            >
              {pct}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
