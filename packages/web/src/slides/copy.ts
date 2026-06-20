/** Number with thousands separators. */
export const fmt = (n: number): string => n.toLocaleString('en-US');

/** Hour 0-23 -> 12-hour label like "2AM". */
export function hourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${period}`;
}

/** Whole-number percentage of total. */
export function topCategoryPct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * The voice. Three rotated registers: flat fact, dry aside, single word.
 * All slide copy lives here so tone is tunable in one place.
 */
export const copy = {
  coverTitle: 'You and your shell had a year',
  coverKicker: 'Terminal, Wrapped',
  volumeKicker: 'This year you ran',
  volumeAside: (distinct: number) => `${distinct} different tools. No notes.`,
  typeKicker: 'Turns out you’re a',
  typeVerdict: (name: string, pct: number) => `${pct}% ${name.toLowerCase()} creature`,
  peakKicker: 'Your terminal runs hottest at',
  peakAside: 'We’re not judging. (We are.)',
  busiestKicker: 'Your most unhinged day',
  busiestAside: (count: number) => `${fmt(count)} commands. Something was on fire.`,
  flagKicker: 'Your most-reached-for flag',
  flagAside: 'A person who likes to see everything.',
  countdownKicker: 'Your top commands. Drumroll.',
  countdownPayoff: (count: number) => `${fmt(count)} times. We should talk about your branching strategy.`,
  secretsKicker: 'We found',
  secretsVerdict: (n: number) => `${n} credential${n === 1 ? '' : 's'} sitting in plaintext.`,
  secretsAside: 'Bold.',
  receiptTitle: 'That’s your year in the terminal',
} as const;
