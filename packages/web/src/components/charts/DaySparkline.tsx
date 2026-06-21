import { motion } from 'motion/react';
import { rgba } from '../../theme/color';
import type { Stats } from '../../api/types';

/**
 * A sparkline of activity-by-day with a filled area under the line and a dot
 * marking the busiest day. The line draws itself in left-to-right.
 *
 * preserveAspectRatio="none" stretches the 100×32 viewBox to fill width, so
 * strokes use vectorEffect="non-scaling-stroke" to stay an even weight.
 */
export function DaySparkline({
  data,
  tint,
  accent,
}: {
  data: Stats['activityByDay'];
  tint: string;
  accent: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const W = 100;
  const H = 32;

  const pts = data.map((d, i) => {
    const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
    const y = H - (d.count / max) * (H - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;

  const maxI = data.reduce((bi, d, i, arr) => (d.count > arr[bi].count ? i : bi), 0);
  const [mx, my] = pts[maxI];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-20 md:h-24 overflow-visible"
    >
      <polygon points={area} fill={rgba(accent, 0.16)} />
      <motion.polyline
        points={line}
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <circle
        cx={mx}
        cy={my}
        r={2.6}
        fill={accent}
        stroke={tint}
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
