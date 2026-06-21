import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { rgba } from '../../theme/color';
import type { Stats } from '../../api/types';

/**
 * A sparkline of activity-by-day with a filled area and a dot on the busiest
 * day. Drawn in REAL pixel coordinates (measured via ResizeObserver) so the
 * scale is uniform — the dot stays a true circle and the curve stays crisp,
 * which a stretched `preserveAspectRatio="none"` viewBox cannot do.
 *
 * The line is a smooth Catmull-Rom → cubic-bezier path rather than an angular
 * polyline.
 */

/** Build a smooth cubic-bezier path through points using Catmull-Rom tangents. */
function smoothLine(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export function DaySparkline({
  data,
  tint,
  accent,
}: {
  data: Stats['activityByDay'];
  tint: string;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 0);
    if (typeof ResizeObserver === 'undefined') return; // jsdom / older envs
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 96;
  const padY = 10;
  const padX = 6;

  return (
    <div ref={ref} className="w-full">
      {data.length > 0 && w > 0 && (() => {
        const max = Math.max(1, ...data.map((d) => d.count));
        const n = data.length;
        const innerW = Math.max(1, w - padX * 2);
        const innerH = H - padY * 2;
        const pts = data.map((d, i) => {
          const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
          const y = padY + (1 - d.count / max) * innerH;
          return [x, y] as const;
        });
        const line = smoothLine(pts);
        const area = `${line} L ${pts[pts.length - 1][0].toFixed(2)},${H} L ${pts[0][0].toFixed(2)},${H} Z`;
        const maxI = data.reduce((bi, d, i, arr) => (d.count > arr[bi].count ? i : bi), 0);
        const [mx, my] = pts[maxI];

        return (
          <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="block overflow-visible">
            <path d={area} fill={rgba(accent, 0.16)} stroke="none" />
            <motion.path
              d={line}
              fill="none"
              stroke={accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            <circle cx={mx} cy={my} r={6} fill={rgba(accent, 0.25)} />
            <circle cx={mx} cy={my} r={3.5} fill={accent} stroke={tint} strokeWidth={1.5} />
          </svg>
        );
      })()}
    </div>
  );
}
