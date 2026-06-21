import { motion } from 'motion/react';
import { rgba } from '../theme/color';

/**
 * The decorative layer that sits behind every slide's content.
 *
 * Three stacked effects, all subtle and all keyed off the slide's locked
 * text color so they read on both light (lime) and dark (ink) backgrounds:
 *   1. Soft gradient orbs (accent colors) for depth.
 *   2. Drifting oversized monospace glyphs — the "terminal confetti".
 *   3. A fine grain overlay so flat fills stop looking flat.
 *
 * Positions are hand-placed (not random) so the composition is art-directed
 * and stable across renders. Motion is automatically stilled for users who
 * prefer reduced motion via the app-level <MotionConfig reducedMotion="user">.
 */

// char, top%, left%, font-size (rem), drift distance (px), duration (s), delay (s)
const GLYPHS: Array<[string, number, number, number, number, number, number]> = [
  ['$', 12, 8, 9, 18, 14, 0],
  ['>', 70, 14, 7, -14, 16, 1.5],
  ['_', 30, 82, 8, 12, 13, 0.8],
  ['{', 82, 74, 10, -16, 18, 2.2],
  ['}', 18, 64, 6, 14, 15, 0.4],
  ['/', 54, 46, 5, -10, 12, 1.1],
  [';', 88, 34, 5, 10, 17, 2.8],
  ['~', 6, 40, 6, -12, 14, 0.6],
  ['#', 44, 90, 7, 12, 19, 1.9],
  ['*', 60, 70, 5, -8, 13, 3.1],
];

// color, top%, left%, size(px) — large, heavily blurred accent blooms
const ORBS: Array<[string, number, number, number]> = [
  ['#FFD23F', -10, -8, 460], // yellow, top-left
  ['#FF4B2B', 65, 78, 520], // coral, bottom-right
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function BackgroundDecor({ tint }: { tint: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      {ORBS.map(([color, top, left, size], i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: size,
            height: size,
            background: `radial-gradient(circle, ${rgba(color, 0.5)} 0%, ${rgba(color, 0)} 70%)`,
            filter: 'blur(40px)',
            mixBlendMode: 'screen',
          }}
          animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
          transition={{ duration: 22 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Drifting glyphs */}
      {GLYPHS.map(([char, top, left, size, drift, dur, delay], i) => (
        <motion.span
          key={`glyph-${i}`}
          className="absolute font-mono font-bold select-none"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            fontSize: `${size}rem`,
            lineHeight: 1,
            color: rgba(tint, 0.06),
          }}
          animate={{ y: [0, drift, 0] }}
          transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          {char}
        </motion.span>
      ))}

      {/* Grain */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: 'overlay' }}
      />
    </div>
  );
}
