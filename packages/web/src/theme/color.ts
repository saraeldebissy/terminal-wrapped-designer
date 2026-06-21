/**
 * Build an rgba() string from a #rrggbb hex and an alpha.
 *
 * Why this exists: Tailwind v3 does NOT generate opacity modifiers for
 * `currentColor` (e.g. `bg-current/10` renders as fully opaque). Every faint
 * tint that needs to track a slide's locked text color must be computed here
 * and applied via an inline style instead.
 */
export function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
