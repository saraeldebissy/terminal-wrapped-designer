import { motion } from 'motion/react';
import { rgba } from '../../theme/color';
import type { Stats } from '../../api/types';

/**
 * 24-bar histogram of activity-by-hour. The peak hour's bar is drawn in the
 * accent color; the rest are a faint tint. Bars grow in with a quick stagger.
 */
export function HourHistogram({
  data,
  tint,
  accent,
}: {
  data: Stats['activityByHour'];
  tint: string;
  accent: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const peakHour = data.reduce((a, b) => (b.count > a.count ? b : a), data[0]).hour;

  return (
    <div className="w-full">
      <div className="flex items-end gap-[2px] h-24 md:h-32 w-full">
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isPeak = d.hour === peakHour;
          return (
            <motion.div
              key={d.hour}
              className="flex-1 rounded-t-sm"
              style={{ backgroundColor: isPeak ? accent : rgba(tint, 0.28), minHeight: 2 }}
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.015, duration: 0.5, ease: 'easeOut' }}
            />
          );
        })}
      </div>
      <div
        className="mt-2 flex justify-between font-mono text-xs"
        style={{ color: rgba(tint, 0.5) }}
      >
        <span>12a</span>
        <span>12p</span>
        <span>11p</span>
      </div>
    </div>
  );
}
