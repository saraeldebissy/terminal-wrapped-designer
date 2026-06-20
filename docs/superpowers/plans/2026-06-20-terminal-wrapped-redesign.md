# Terminal Wrapped — Wrapped-Story Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scrolling dashboard in `packages/web` with a full-bleed, tap-through Spotify-Wrapped-style story, using the Wrapped editorial palette, Plus Jakarta Sans + JetBrains Mono, and a deadpan voice — ending in a shareable receipt card.

**Architecture:** A data-agnostic `<Story>` engine renders an ordered list of slides produced by a pure, unit-tested `buildSlideManifest(stats)` function (which skips slides whose data is absent). Each slide is a small presentational component fed `Stats`; copy lives in one `copy.ts` module. The receipt slide exports to PNG.

**Tech Stack:** React 19, TypeScript (strict), Vite 7, Tailwind 3, `motion/react` (Framer Motion, already installed), Vitest + Testing Library (added here), `html-to-image` (added here), `@fontsource/*`.

**Working directory for all paths:** `packages/web/` unless stated otherwise. Run all commands from `packages/web/`.

---

## File Structure

**New:**
- `src/theme/palette.ts` — color tokens (bg + text per background, accents)
- `src/test/setup.ts` — Testing Library matchers
- `src/test/fixtures.ts` — sample `Stats` objects for tests
- `src/slides/types.ts` — `SlideId`, `SlideEntry`, `SlideViewProps`
- `src/slides/manifest.ts` + `manifest.test.ts` — slide ordering + skip logic
- `src/slides/copy.ts` + `copy.test.ts` — stats → display strings (the voice)
- `src/slides/registry.tsx` — `SlideId` → component map
- `src/slides/{Cover,Volume,Type,PeakHour,BusiestDay,Flag,Countdown,Secrets,Receipt}Slide.tsx`
- `src/story/Slide.tsx` — full-bleed wrapper
- `src/story/ProgressBars.tsx` — Wrapped-style progress indicator
- `src/story/useStoryNavigation.ts` + `useStoryNavigation.test.ts` — index state + nav
- `src/story/Story.tsx` — the engine
- `src/lib/useCountUp.ts` — number count-up hook (reduced-motion aware)
- `src/lib/exportImage.ts` — PNG export wrapper
- `vitest.config.ts` — test config

**Modified:**
- `package.json` — deps + `test` script
- `tailwind.config.cjs` — palette + font tokens
- `src/styles/globals.css` — base bg/font
- `src/main.tsx` — font imports
- `index.html` — title/lang (minor)
- `src/App.tsx` — rewritten to render `<Story>`

**Deleted (retired dashboard):**
- `src/components/layout/{LayoutShell,Nav,Section}.tsx`
- `src/components/charts/{TopCommandsBarChart,HourlyPatternBarChart,CategoryBarChart,ActivityHeatmap,ParameterStatsChart}.tsx`
- `src/components/summary/{HeroSummary,HighlightsSection,SecretsSection}.tsx`
- `src/components/cards/MetricCard.tsx`
- `src/components/motion/{AnimatedSection,ConfettiBurst,StaggeredList}.tsx`
- `src/components/cards/CommandPill.tsx` (re-created inside slides only if needed; not reused)

---

## Task 1: Tooling — test runner, deps, fonts

**Files:**
- Modify: `packages/web/package.json`
- Create: `packages/web/vitest.config.ts`, `packages/web/src/test/setup.ts`

- [ ] **Step 1: Install dependencies**

Run (from repo root):
```bash
pnpm --filter terminal-wrapped-web add html-to-image @fontsource/plus-jakarta-sans @fontsource/jetbrains-mono
pnpm --filter terminal-wrapped-web add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: both complete, `package.json` dependencies updated.

- [ ] **Step 2: Add the test script**

In `packages/web/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create the Vitest config**

Create `packages/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create the test setup file**

Create `packages/web/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Verify the runner works**

Create a throwaway `packages/web/src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```
Run: `pnpm --filter terminal-wrapped-web test`
Expected: 1 passing test. Then delete `src/test/smoke.test.ts`.

- [ ] **Step 6: Commit**
```bash
git add packages/web/package.json packages/web/vitest.config.ts packages/web/src/test/setup.ts pnpm-lock.yaml
git commit -m "chore(web): add vitest + testing-library, html-to-image, fonts"
```

---

## Task 2: Palette tokens + Tailwind + fonts

**Files:**
- Create: `packages/web/src/theme/palette.ts`
- Modify: `packages/web/tailwind.config.cjs`, `packages/web/src/styles/globals.css`, `packages/web/src/main.tsx`

- [ ] **Step 1: Create the palette module**

Create `packages/web/src/theme/palette.ts`:
```ts
/** Wrapped editorial palette. Each background pairs with a locked AA-contrast text color. */
export const PALETTE = {
  lime:    { bg: '#C9F23C', text: '#0A0A0A' },
  magenta: { bg: '#FF2E93', text: '#FFFFFF' },
  blue:    { bg: '#2D6DF6', text: '#FFFFFF' },
  violet:  { bg: '#8B5CF6', text: '#FFFFFF' },
  ink:     { bg: '#0A0A0A', text: '#FFFFFF' },
} as const;

export type ColorToken = keyof typeof PALETTE;

/** Accent colors — used for badges, type highlights, decorative marks. Never slide backgrounds. */
export const ACCENT = {
  lime: '#C9F23C',
  yellow: '#FFD23F',
  coral: '#FF4B2B',
  white: '#FFFFFF',
} as const;
```

- [ ] **Step 2: Update Tailwind tokens**

Replace `packages/web/tailwind.config.cjs` entirely:
```js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: '#C9F23C',
        magenta: '#FF2E93',
        blue: '#2D6DF6',
        violet: '#8B5CF6',
        ink: '#0A0A0A',
        yellow: '#FFD23F',
        coral: '#FF4B2B'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 3: Import fonts and set base styles**

Replace `packages/web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/tailwind.css'
import './styles/globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Replace `packages/web/src/styles/globals.css`:
```css
html, body, #root {
  height: 100%;
}
body {
  @apply bg-ink text-white font-display;
  margin: 0;
  overflow: hidden;
}
```

- [ ] **Step 4: Verify build still compiles**

Run: `pnpm --filter terminal-wrapped-web build`
Expected: build succeeds (the old `App.tsx` still references `primary` via components; if the build fails on missing `primary` color, that is expected and resolved in Task 21 — for now confirm Tailwind config + fonts parse by running `pnpm --filter terminal-wrapped-web exec tsc -b` which should pass). If `build` fails only due to removed `primary` class usage, proceed; Task 21 removes those files.

- [ ] **Step 5: Commit**
```bash
git add packages/web/src/theme/palette.ts packages/web/tailwind.config.cjs packages/web/src/main.tsx packages/web/src/styles/globals.css
git commit -m "feat(web): wrapped palette tokens + Plus Jakarta Sans / JetBrains Mono"
```

---

## Task 3: Test fixtures

**Files:**
- Create: `packages/web/src/test/fixtures.ts`

- [ ] **Step 1: Create fixtures**

Create `packages/web/src/test/fixtures.ts`:
```ts
import type { Stats } from '../api/types';

/** Full stats with every section populated. */
export const fullStats: Stats = {
  meta: {
    generatedAt: '2026-06-20T00:00:00Z',
    version: '0.1.0',
    totalCommands: 1000,
    distinctCommands: 35,
    dateRange: { start: '2026-01-01T00:00:00Z', end: '2026-06-20T00:00:00Z' },
    filters: {},
  },
  topCommands: [
    { name: 'git', count: 630, fullExamples: ['git status'], percentile: 1 },
    { name: 'claude', count: 75, fullExamples: ['claude'], percentile: 0.8 },
    { name: 'pnpm', count: 75, fullExamples: ['pnpm install'], percentile: 0.8 },
    { name: 'cd', count: 65, fullExamples: ['cd ..'], percentile: 0.7 },
    { name: 'ls', count: 22, fullExamples: ['ls -la'], percentile: 0.5 },
  ],
  topFullCommands: [{ command: 'git status', count: 200 }],
  categories: [
    { name: 'Version Control', slug: 'git', count: 620, exampleCommands: ['git status'] },
    { name: 'Navigation', slug: 'nav', count: 200, exampleCommands: ['cd'] },
  ],
  activityByDay: [
    { date: '2026-06-13', count: 40 },
    { date: '2026-06-14', count: 183 },
  ],
  activityByHour: [
    { hour: 2, count: 120 },
    { hour: 14, count: 60 },
  ],
  topDirectories: [{ path: '~/builds', count: 400 }],
  parameters: {
    topFlags: [{ flag: '-la', count: 90, commands: ['ls'] }],
    commandFlagCombos: [{ command: 'ls', flags: ['-la'], count: 90 }],
  },
  secrets: {
    potentialSecrets: [
      { type: 'GitHub Token', redactedCommand: 'export GH_TOKEN=ghp_****', originalCommand: 'export GH_TOKEN=ghp_realtoken' },
    ],
    totalSecretsFound: 3,
    secretTypes: [{ type: 'GitHub Token', count: 3 }],
  },
  quirky: { sudoCount: 42, aliasLikeCount: 18, destructiveCount: 4 },
  highlights: [
    { id: 'night-owl', title: 'Night Owl', description: 'Most active at **2AM**', iconKey: 'moon' },
  ],
};

/** Minimal stats: no timestamps, no secrets, no flags, no categories. */
export const minimalStats: Stats = {
  meta: {
    generatedAt: '2026-06-20T00:00:00Z',
    version: '0.1.0',
    totalCommands: 50,
    distinctCommands: 8,
    dateRange: {},
    filters: {},
  },
  topCommands: [{ name: 'ls', count: 20, fullExamples: ['ls'], percentile: 1 }],
  topFullCommands: [],
  categories: [],
  activityByDay: [],
  activityByHour: [{ hour: 0, count: 0 }],
  topDirectories: [],
  parameters: { topFlags: [], commandFlagCombos: [] },
  secrets: { potentialSecrets: [], totalSecretsFound: 0, secretTypes: [] },
  quirky: { sudoCount: 0, aliasLikeCount: 0, destructiveCount: 0 },
  highlights: [],
};
```

- [ ] **Step 2: Commit**
```bash
git add packages/web/src/test/fixtures.ts
git commit -m "test(web): add Stats fixtures (full + minimal)"
```

---

## Task 4: Slide types + `buildSlideManifest` (TDD)

**Files:**
- Create: `packages/web/src/slides/types.ts`, `packages/web/src/slides/manifest.ts`, `packages/web/src/slides/manifest.test.ts`

- [ ] **Step 1: Define slide types**

Create `packages/web/src/slides/types.ts`:
```ts
import type { ColorToken } from '../theme/palette';
import type { Stats } from '../api/types';

export type SlideId =
  | 'cover' | 'volume' | 'type' | 'peakHour'
  | 'busiestDay' | 'flag' | 'countdown' | 'secrets' | 'receipt';

export interface SlideEntry {
  id: SlideId;
  bg: ColorToken;
}

export interface SlideViewProps {
  stats: Stats;
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/web/src/slides/manifest.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildSlideManifest } from './manifest';
import { fullStats, minimalStats } from '../test/fixtures';

describe('buildSlideManifest', () => {
  it('includes all slides for full stats, in order', () => {
    const ids = buildSlideManifest(fullStats).map((s) => s.id);
    expect(ids).toEqual([
      'cover', 'volume', 'type', 'peakHour',
      'busiestDay', 'flag', 'countdown', 'secrets', 'receipt',
    ]);
  });

  it('always starts with cover and ends with receipt', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids[0]).toBe('cover');
    expect(ids[ids.length - 1]).toBe('receipt');
  });

  it('skips time slides when there is no timestamp data', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('peakHour');
    expect(ids).not.toContain('busiestDay');
  });

  it('skips secrets when none were found', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('secrets');
  });

  it('skips type and flag slides when those sections are empty', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('type');
    expect(ids).not.toContain('flag');
  });

  it('assigns a known palette token to every slide', () => {
    const valid = ['lime', 'magenta', 'blue', 'violet', 'ink'];
    for (const s of buildSlideManifest(fullStats)) {
      expect(valid).toContain(s.bg);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: FAIL — `buildSlideManifest` not exported / module not found.

- [ ] **Step 4: Implement `buildSlideManifest`**

Create `packages/web/src/slides/manifest.ts`:
```ts
import type { Stats } from '../api/types';
import type { SlideEntry } from './types';

/**
 * Build the ordered list of slides that have data to show.
 * This is the single source of truth for slide order and absent-data skipping,
 * so the Story engine never has to guess and progress bars never have holes.
 */
export function buildSlideManifest(stats: Stats): SlideEntry[] {
  const entries: SlideEntry[] = [];

  entries.push({ id: 'cover', bg: 'ink' });
  entries.push({ id: 'volume', bg: 'magenta' });

  if (stats.categories.length > 0) {
    entries.push({ id: 'type', bg: 'lime' });
  }
  if (stats.activityByHour.some((h) => h.count > 0)) {
    entries.push({ id: 'peakHour', bg: 'blue' });
  }
  if (stats.activityByDay.length > 0) {
    entries.push({ id: 'busiestDay', bg: 'violet' });
  }
  if (stats.parameters.topFlags.length > 0) {
    entries.push({ id: 'flag', bg: 'ink' });
  }
  if (stats.topCommands.length > 0) {
    entries.push({ id: 'countdown', bg: 'blue' });
  }
  if (stats.secrets.totalSecretsFound > 0) {
    entries.push({ id: 'secrets', bg: 'ink' });
  }

  entries.push({ id: 'receipt', bg: 'ink' });
  return entries;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: all `buildSlideManifest` tests PASS.

- [ ] **Step 6: Commit**
```bash
git add packages/web/src/slides/types.ts packages/web/src/slides/manifest.ts packages/web/src/slides/manifest.test.ts
git commit -m "feat(web): slide manifest with absent-data skipping (TDD)"
```

---

## Task 5: Copy module — the voice (TDD)

**Files:**
- Create: `packages/web/src/slides/copy.ts`, `packages/web/src/slides/copy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/web/src/slides/copy.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { fmt, hourLabel, topCategoryPct, copy } from './copy';

describe('copy helpers', () => {
  it('formats numbers with thousands separators', () => {
    expect(fmt(1000)).toBe('1,000');
    expect(fmt(42)).toBe('42');
  });

  it('formats hours as 12-hour labels', () => {
    expect(hourLabel(0)).toBe('12AM');
    expect(hourLabel(2)).toBe('2AM');
    expect(hourLabel(14)).toBe('2PM');
    expect(hourLabel(23)).toBe('11PM');
  });

  it('computes the top category percentage of total', () => {
    expect(topCategoryPct(620, 1000)).toBe(62);
  });

  it('exposes a deadpan cover title', () => {
    expect(copy.coverTitle).toMatch(/shell/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: FAIL — `./copy` not found.

- [ ] **Step 3: Implement the copy module**

Create `packages/web/src/slides/copy.ts`:
```ts
/** Number with thousands separators. */
export const fmt = (n: number): string => n.toLocaleString('en-US');

/** Hour 0-23 → 12-hour label like "2AM". */
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: copy tests PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/web/src/slides/copy.ts packages/web/src/slides/copy.test.ts
git commit -m "feat(web): copy module — deadpan voice in one place (TDD)"
```

---

## Task 6: `useStoryNavigation` hook (TDD)

**Files:**
- Create: `packages/web/src/story/useStoryNavigation.ts`, `packages/web/src/story/useStoryNavigation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/web/src/story/useStoryNavigation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryNavigation } from './useStoryNavigation';

describe('useStoryNavigation', () => {
  it('starts at index 0', () => {
    const { result } = renderHook(() => useStoryNavigation(5));
    expect(result.current.index).toBe(0);
  });

  it('advances with next() and clamps at the last slide', () => {
    const { result } = renderHook(() => useStoryNavigation(3));
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => { result.current.next(); result.current.next(); result.current.next(); });
    expect(result.current.index).toBe(2);
  });

  it('goes back with prev() and clamps at 0', () => {
    const { result } = renderHook(() => useStoryNavigation(3));
    act(() => result.current.next());
    act(() => { result.current.prev(); result.current.prev(); });
    expect(result.current.index).toBe(0);
  });

  it('reports isFirst and isLast', () => {
    const { result } = renderHook(() => useStoryNavigation(2));
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
    act(() => result.current.next());
    expect(result.current.isLast).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: FAIL — `./useStoryNavigation` not found.

- [ ] **Step 3: Implement the hook**

Create `packages/web/src/story/useStoryNavigation.ts`:
```ts
import { useCallback, useState } from 'react';

export interface StoryNavigation {
  index: number;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function useStoryNavigation(count: number): StoryNavigation {
  const [index, setIndex] = useState(0);
  const clamp = useCallback((i: number) => Math.max(0, Math.min(count - 1, i)), [count]);
  const next = useCallback(() => setIndex((i) => clamp(i + 1)), [clamp]);
  const prev = useCallback(() => setIndex((i) => clamp(i - 1)), [clamp]);
  const goTo = useCallback((i: number) => setIndex(clamp(i)), [clamp]);
  return { index, next, prev, goTo, isFirst: index === 0, isLast: index === count - 1 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: navigation tests PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/web/src/story/useStoryNavigation.ts packages/web/src/story/useStoryNavigation.test.ts
git commit -m "feat(web): useStoryNavigation hook with clamping (TDD)"
```

---

## Task 7: `useCountUp` + `exportImage` lib helpers

**Files:**
- Create: `packages/web/src/lib/useCountUp.ts`, `packages/web/src/lib/exportImage.ts`

- [ ] **Step 1: Create the count-up hook**

Create `packages/web/src/lib/useCountUp.ts`:
```ts
import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 to `target` over `durationMs`.
 * Respects prefers-reduced-motion by snapping to the target immediately.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || durationMs <= 0) {
      setValue(target);
      return;
    }
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, durationMs]);

  return value;
}
```

- [ ] **Step 2: Create the image-export helper**

Create `packages/web/src/lib/exportImage.ts`:
```ts
import { toPng } from 'html-to-image';

/** Render a DOM node to a PNG and trigger a download. */
export async function downloadNodeAsPng(node: HTMLElement, filename = 'terminal-wrapped.png'): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm --filter terminal-wrapped-web exec tsc -b`
Expected: no type errors.

- [ ] **Step 4: Commit**
```bash
git add packages/web/src/lib/useCountUp.ts packages/web/src/lib/exportImage.ts
git commit -m "feat(web): useCountUp + PNG export helpers"
```

---

## Task 8: `<Slide>` wrapper + `<ProgressBars>`

**Files:**
- Create: `packages/web/src/story/Slide.tsx`, `packages/web/src/story/ProgressBars.tsx`

- [ ] **Step 1: Create the Slide wrapper**

Create `packages/web/src/story/Slide.tsx`:
```tsx
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { PALETTE, type ColorToken } from '../theme/palette';

export interface SlideProps {
  bg: ColorToken;
  children: ReactNode;
}

/** Full-bleed slide: fills the viewport with a palette background and locked text color. */
export function Slide({ bg, children }: SlideProps) {
  const { bg: background, text } = PALETTE[bg];
  return (
    <motion.section
      className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24"
      style={{ backgroundColor: background, color: text }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Create ProgressBars**

Create `packages/web/src/story/ProgressBars.tsx`:
```tsx
export interface ProgressBarsProps {
  count: number;
  index: number;
}

/** Wrapped-style position indicator across the top. Filled = seen, current = highlighted. */
export function ProgressBars({ count, index }: ProgressBarsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex gap-1.5" role="progressbar"
         aria-valuemin={1} aria-valuemax={count} aria-valuenow={index + 1}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-1 flex-1 rounded-full bg-current/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-current transition-all duration-300"
            style={{ width: i <= index ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm --filter terminal-wrapped-web exec tsc -b`
Expected: no type errors.

- [ ] **Step 4: Commit**
```bash
git add packages/web/src/story/Slide.tsx packages/web/src/story/ProgressBars.tsx
git commit -m "feat(web): full-bleed Slide wrapper + progress bars"
```

---

## Tasks 9–17: Slide components

Each slide is a small presentational component receiving `SlideViewProps` (`{ stats }`). Each task: create the component, add a smoke test asserting key text renders, type-check, commit. Run smoke tests with `pnpm --filter terminal-wrapped-web test`.

### Task 9: CoverSlide

**Files:** Create `packages/web/src/slides/CoverSlide.tsx`, `packages/web/src/slides/CoverSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/CoverSlide.tsx`:
```tsx
import { motion } from 'motion/react';
import type { SlideViewProps } from './types';
import { copy } from './copy';

function yearLabel(start?: string, end?: string): string {
  const d = end ?? start;
  return d ? new Date(d).getFullYear().toString() : '';
}

export function CoverSlide({ stats }: SlideViewProps) {
  return (
    <div>
      <motion.p className="font-mono text-lime text-sm md:text-base uppercase tracking-widest"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {copy.coverKicker} {yearLabel(stats.meta.dateRange.start, stats.meta.dateRange.end)}
      </motion.p>
      <motion.h1 className="mt-4 font-display font-extrabold text-5xl md:text-7xl leading-[0.95]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
        {copy.coverTitle}
      </motion.h1>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/CoverSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverSlide } from './CoverSlide';
import { fullStats } from '../test/fixtures';

describe('CoverSlide', () => {
  it('renders the cover title', () => {
    render(<CoverSlide stats={fullStats} />);
    expect(screen.getByText(/you and your shell/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test`
Expected: PASS. Then:
```bash
git add packages/web/src/slides/CoverSlide.tsx packages/web/src/slides/CoverSlide.test.tsx
git commit -m "feat(web): CoverSlide"
```

### Task 10: VolumeSlide

**Files:** Create `packages/web/src/slides/VolumeSlide.tsx`, `packages/web/src/slides/VolumeSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/VolumeSlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy } from './copy';
import { useCountUp } from '../lib/useCountUp';

export function VolumeSlide({ stats }: SlideViewProps) {
  const total = useCountUp(stats.meta.totalCommands);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.volumeKicker}</p>
      <p className="font-display font-extrabold leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}>
        {total.toLocaleString('en-US')}
      </p>
      <p className="font-display font-bold text-lg md:text-2xl mt-2">commands</p>
      <p className="mt-6 inline-block bg-lime text-ink font-display font-bold text-sm md:text-base px-3 py-1 rounded-full">
        {copy.volumeAside(stats.meta.distinctCommands)}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/VolumeSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeSlide } from './VolumeSlide';
import { fullStats } from '../test/fixtures';

describe('VolumeSlide', () => {
  it('renders the commands label and distinct-tools aside', () => {
    render(<VolumeSlide stats={fullStats} />);
    expect(screen.getByText('commands')).toBeInTheDocument();
    expect(screen.getByText(/35 different tools/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/VolumeSlide.tsx packages/web/src/slides/VolumeSlide.test.tsx
git commit -m "feat(web): VolumeSlide with count-up"
```

### Task 11: TypeSlide

**Files:** Create `packages/web/src/slides/TypeSlide.tsx`, `packages/web/src/slides/TypeSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/TypeSlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy, topCategoryPct } from './copy';

export function TypeSlide({ stats }: SlideViewProps) {
  const top = stats.categories[0];
  const pct = topCategoryPct(top.count, stats.meta.totalCommands);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl text-ink/70">{copy.typeKicker}</p>
      <h2 className="mt-2 font-display font-extrabold text-ink leading-[0.95]"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)' }}>
        {copy.typeVerdict(top.name, pct)}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/TypeSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeSlide } from './TypeSlide';
import { fullStats } from '../test/fixtures';

describe('TypeSlide', () => {
  it('renders the percentage verdict for the top category', () => {
    render(<TypeSlide stats={fullStats} />);
    expect(screen.getByText(/62% version control creature/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/TypeSlide.tsx packages/web/src/slides/TypeSlide.test.tsx
git commit -m "feat(web): TypeSlide"
```

### Task 12: PeakHourSlide

**Files:** Create `packages/web/src/slides/PeakHourSlide.tsx`, `packages/web/src/slides/PeakHourSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/PeakHourSlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy, hourLabel } from './copy';

export function PeakHourSlide({ stats }: SlideViewProps) {
  const peak = [...stats.activityByHour].sort((a, b) => b.count - a.count)[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.peakKicker}</p>
      <p className="font-display font-extrabold leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 20vw, 14rem)' }}>
        {hourLabel(peak.hour)}
      </p>
      <p className="mt-4 font-display font-bold text-lg md:text-2xl text-white/80">{copy.peakAside}</p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/PeakHourSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PeakHourSlide } from './PeakHourSlide';
import { fullStats } from '../test/fixtures';

describe('PeakHourSlide', () => {
  it('renders the busiest hour as a 12-hour label', () => {
    render(<PeakHourSlide stats={fullStats} />);
    expect(screen.getByText('2AM')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/PeakHourSlide.tsx packages/web/src/slides/PeakHourSlide.test.tsx
git commit -m "feat(web): PeakHourSlide"
```

### Task 13: BusiestDaySlide

**Files:** Create `packages/web/src/slides/BusiestDaySlide.tsx`, `packages/web/src/slides/BusiestDaySlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/BusiestDaySlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy } from './copy';

function prettyDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function BusiestDaySlide({ stats }: SlideViewProps) {
  const busiest = [...stats.activityByDay].sort((a, b) => b.count - a.count)[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.busiestKicker}</p>
      <p className="font-display font-extrabold leading-[0.95] mt-2"
         style={{ fontSize: 'clamp(3rem, 12vw, 8rem)' }}>
        {prettyDate(busiest.date)}
      </p>
      <p className="mt-4 font-display font-bold text-lg md:text-2xl">{copy.busiestAside(busiest.count)}</p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/BusiestDaySlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusiestDaySlide } from './BusiestDaySlide';
import { fullStats } from '../test/fixtures';

describe('BusiestDaySlide', () => {
  it('renders the busiest day and its command count', () => {
    render(<BusiestDaySlide stats={fullStats} />);
    expect(screen.getByText(/June 14/i)).toBeInTheDocument();
    expect(screen.getByText(/183 commands/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/BusiestDaySlide.tsx packages/web/src/slides/BusiestDaySlide.test.tsx
git commit -m "feat(web): BusiestDaySlide"
```

### Task 14: FlagSlide

**Files:** Create `packages/web/src/slides/FlagSlide.tsx`, `packages/web/src/slides/FlagSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/FlagSlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy } from './copy';

export function FlagSlide({ stats }: SlideViewProps) {
  const flag = stats.parameters.topFlags[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl text-white/80">{copy.flagKicker}</p>
      <p className="font-mono text-coral font-bold leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}>
        {flag.flag}
      </p>
      <p className="mt-4 font-display font-bold text-lg md:text-2xl">{copy.flagAside}</p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/FlagSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagSlide } from './FlagSlide';
import { fullStats } from '../test/fixtures';

describe('FlagSlide', () => {
  it('renders the top flag in monospace', () => {
    render(<FlagSlide stats={fullStats} />);
    expect(screen.getByText('-la')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/FlagSlide.tsx packages/web/src/slides/FlagSlide.test.tsx
git commit -m "feat(web): FlagSlide"
```

### Task 15: CountdownSlide

**Files:** Create `packages/web/src/slides/CountdownSlide.tsx`, `packages/web/src/slides/CountdownSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/CountdownSlide.tsx`:
```tsx
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
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/CountdownSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownSlide } from './CountdownSlide';
import { fullStats } from '../test/fixtures';

describe('CountdownSlide', () => {
  it('renders the #1 command and the branching-strategy payoff', () => {
    render(<CountdownSlide stats={fullStats} />);
    expect(screen.getByText('git')).toBeInTheDocument();
    expect(screen.getByText(/branching strategy/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/CountdownSlide.tsx packages/web/src/slides/CountdownSlide.test.tsx
git commit -m "feat(web): CountdownSlide lands on #1"
```

### Task 16: SecretsSlide

**Files:** Create `packages/web/src/slides/SecretsSlide.tsx`, `packages/web/src/slides/SecretsSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/SecretsSlide.tsx`:
```tsx
import type { SlideViewProps } from './types';
import { copy, fmt } from './copy';

export function SecretsSlide({ stats }: SlideViewProps) {
  const n = stats.secrets.totalSecretsFound;
  const types = stats.secrets.secretTypes.slice(0, 3);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.secretsKicker}</p>
      <p className="font-display font-extrabold text-coral leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}>{fmt(n)}</p>
      <p className="mt-2 font-display font-bold text-lg md:text-2xl">{copy.secretsVerdict(n)}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <li key={t.type} className="font-mono text-sm bg-coral text-ink px-2 py-1 rounded">
            {t.type} ×{t.count}
          </li>
        ))}
      </ul>
      <p className="mt-6 font-display font-extrabold text-coral" style={{ fontSize: 'clamp(2rem, 7vw, 4rem)' }}>
        {copy.secretsAside}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/SecretsSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecretsSlide } from './SecretsSlide';
import { fullStats } from '../test/fixtures';

describe('SecretsSlide', () => {
  it('renders the count, plaintext verdict, and the one-word punchline', () => {
    render(<SecretsSlide stats={fullStats} />);
    expect(screen.getByText(/plaintext/i)).toBeInTheDocument();
    expect(screen.getByText('Bold.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/SecretsSlide.tsx packages/web/src/slides/SecretsSlide.test.tsx
git commit -m "feat(web): SecretsSlide — the climax"
```

### Task 17: ReceiptSlide (with PNG export)

**Files:** Create `packages/web/src/slides/ReceiptSlide.tsx`, `packages/web/src/slides/ReceiptSlide.test.tsx`

- [ ] **Step 1: Component**

Create `packages/web/src/slides/ReceiptSlide.tsx`:
```tsx
import { useRef } from 'react';
import type { SlideViewProps } from './types';
import { copy, fmt } from './copy';
import { downloadNodeAsPng } from '../lib/exportImage';

export function ReceiptSlide({ stats }: SlideViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const top = stats.topCommands[0];

  const rows: Array<[string, string]> = [
    ['commands run', fmt(stats.meta.totalCommands)],
    ['tools used', fmt(stats.meta.distinctCommands)],
    ['#1 command', top ? top.name : '—'],
    ['secrets leaked', fmt(stats.secrets.totalSecretsFound)],
  ];

  return (
    <div className="flex flex-col items-center">
      <div ref={cardRef} className="w-full max-w-sm bg-ink border border-white/15 rounded-2xl p-6">
        <p className="font-mono text-lime text-xs uppercase tracking-widest">Terminal, Wrapped</p>
        <p className="mt-1 font-display font-extrabold text-2xl">{copy.receiptTitle}</p>
        <dl className="mt-4 divide-y divide-white/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="font-display text-white/70">{label}</dt>
              <dd className="font-mono font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <button
        type="button"
        className="mt-6 bg-lime text-ink font-display font-bold px-5 py-2 rounded-full"
        onClick={() => cardRef.current && downloadNodeAsPng(cardRef.current)}
      >
        Download your Wrapped
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Create `packages/web/src/slides/ReceiptSlide.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptSlide } from './ReceiptSlide';
import { fullStats } from '../test/fixtures';

describe('ReceiptSlide', () => {
  it('renders summary rows and a download button', () => {
    render(<ReceiptSlide stats={fullStats} />);
    expect(screen.getByText('commands run')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download your wrapped/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `pnpm --filter terminal-wrapped-web test` → PASS
```bash
git add packages/web/src/slides/ReceiptSlide.tsx packages/web/src/slides/ReceiptSlide.test.tsx
git commit -m "feat(web): ReceiptSlide with PNG export"
```

---

## Task 18: Slide registry

**Files:** Create `packages/web/src/slides/registry.tsx`

- [ ] **Step 1: Create the registry**

Create `packages/web/src/slides/registry.tsx`:
```tsx
import type { FC } from 'react';
import type { SlideId, SlideViewProps } from './types';
import { CoverSlide } from './CoverSlide';
import { VolumeSlide } from './VolumeSlide';
import { TypeSlide } from './TypeSlide';
import { PeakHourSlide } from './PeakHourSlide';
import { BusiestDaySlide } from './BusiestDaySlide';
import { FlagSlide } from './FlagSlide';
import { CountdownSlide } from './CountdownSlide';
import { SecretsSlide } from './SecretsSlide';
import { ReceiptSlide } from './ReceiptSlide';

export const SLIDE_REGISTRY: Record<SlideId, FC<SlideViewProps>> = {
  cover: CoverSlide,
  volume: VolumeSlide,
  type: TypeSlide,
  peakHour: PeakHourSlide,
  busiestDay: BusiestDaySlide,
  flag: FlagSlide,
  countdown: CountdownSlide,
  secrets: SecretsSlide,
  receipt: ReceiptSlide,
};
```

- [ ] **Step 2: Type-check + commit**

Run: `pnpm --filter terminal-wrapped-web exec tsc -b` → no errors
```bash
git add packages/web/src/slides/registry.tsx
git commit -m "feat(web): slide registry mapping id -> component"
```

---

## Task 19: `<Story>` engine

**Files:** Create `packages/web/src/story/Story.tsx`

- [ ] **Step 1: Create the engine**

Create `packages/web/src/story/Story.tsx`:
```tsx
import { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import type { Stats } from '../api/types';
import { buildSlideManifest } from '../slides/manifest';
import { SLIDE_REGISTRY } from '../slides/registry';
import { Slide } from './Slide';
import { ProgressBars } from './ProgressBars';
import { useStoryNavigation } from './useStoryNavigation';

export interface StoryProps {
  stats: Stats;
}

export function Story({ stats }: StoryProps) {
  const slides = useMemo(() => buildSlideManifest(stats), [stats]);
  const nav = useStoryNavigation(slides.length);
  const entry = slides[nav.index];
  const SlideView = SLIDE_REGISTRY[entry.id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nav.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); nav.prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ProgressBars count={slides.length} index={nav.index} />

      {/* Click zones: left third = back, right two-thirds = forward */}
      <button type="button" aria-label="Previous slide"
        className="absolute left-0 top-0 z-20 h-full w-1/3 cursor-default"
        onClick={nav.prev} />
      <button type="button" aria-label="Next slide"
        className="absolute right-0 top-0 z-20 h-full w-2/3 cursor-default"
        onClick={nav.next} />

      <AnimatePresence mode="wait">
        <Slide key={entry.id} bg={entry.bg}>
          <SlideView stats={stats} />
        </Slide>
      </AnimatePresence>
    </main>
  );
}
```

- [ ] **Step 2: Type-check + commit**

Run: `pnpm --filter terminal-wrapped-web exec tsc -b` → no errors
```bash
git add packages/web/src/story/Story.tsx
git commit -m "feat(web): Story engine — nav, progress, click zones"
```

---

## Task 20: Rewrite `App.tsx`, delete retired dashboard

**Files:**
- Modify: `packages/web/src/App.tsx`
- Delete: the retired files listed in File Structure

- [ ] **Step 1: Rewrite App.tsx**

Replace `packages/web/src/App.tsx`:
```tsx
import { useStats } from './api/useStats';
import { Story } from './story/Story';

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-center px-6">{children}</div>;
}

function App() {
  const { stats, loading, error } = useStats();

  if (loading) {
    return <Centered><p className="font-mono text-white/60">Loading your terminal stats…</p></Centered>;
  }
  if (error || !stats) {
    return (
      <Centered>
        <div className="max-w-md">
          <p className="font-display font-extrabold text-2xl">Couldn’t load your Wrapped</p>
          <p className="mt-2 font-mono text-sm text-white/60">
            {error || 'Stats are unavailable. Make sure the CLI is running.'}
          </p>
        </div>
      </Centered>
    );
  }

  return <Story stats={stats} />;
}

export default App;
```

- [ ] **Step 2: Delete retired files**

Run (from `packages/web/`):
```bash
rm -f src/components/layout/LayoutShell.tsx src/components/layout/Nav.tsx src/components/layout/Section.tsx
rm -f src/components/charts/TopCommandsBarChart.tsx src/components/charts/HourlyPatternBarChart.tsx src/components/charts/CategoryBarChart.tsx src/components/charts/ActivityHeatmap.tsx src/components/charts/ParameterStatsChart.tsx
rm -f src/components/summary/HeroSummary.tsx src/components/summary/HighlightsSection.tsx src/components/summary/SecretsSection.tsx
rm -f src/components/cards/MetricCard.tsx src/components/cards/CommandPill.tsx
rm -f src/components/motion/AnimatedSection.tsx src/components/motion/ConfettiBurst.tsx src/components/motion/StaggeredList.tsx
find src/components -type d -empty -delete
```

- [ ] **Step 3: Type-check + full test run**

Run: `pnpm --filter terminal-wrapped-web exec tsc -b`
Expected: no errors (no remaining imports of deleted files).
Run: `pnpm --filter terminal-wrapped-web test`
Expected: all tests PASS.

- [ ] **Step 4: Commit**
```bash
git add -A packages/web/src
git commit -m "feat(web): mount Story in App, remove dashboard components"
```

---

## Task 21: Build, visual walkthrough, a11y pass

**Files:** Modify as needed: `packages/web/index.html`, slide components for any visual fixes found.

- [ ] **Step 1: Production build**

Run (from repo root): `pnpm build`
Expected: web build succeeds, CLI copies assets, no errors.

- [ ] **Step 2: Run the real thing**

Run (from repo root): `pnpm cli:zsh`
Expected: browser opens to the story. Walk it end-to-end with arrow keys, spacebar, and clicks (left third back, right forward). Confirm: cover → volume count-up → type → (peak/busy if your history has timestamps) → flag → countdown lands on #1 → secrets → receipt with working PNG download.

- [ ] **Step 3: Reduced-motion check**

Enable "Reduce motion" in OS settings, reload. Expected: numbers snap (no count-up), slides still navigable. (Verifies `useCountUp` reduced-motion branch.)

- [ ] **Step 4: Minimal-data check**

Run: `pnpm cli -- ~/.bash_history` (a history without timestamps).
Expected: peak/busy slides are absent, progress bars show the reduced count with no gaps, story still reads start-to-finish.

- [ ] **Step 5: Title polish**

In `packages/web/index.html`, confirm `<html lang="en">` and `<title>Terminal Wrapped</title>`. Adjust only if needed.

- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "chore(web): verified Wrapped story build + a11y/minimal-data passes"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** format (Tasks 8,19,20) · framing/full-bleed (Task 8 `Slide`) · navigation (Tasks 6,19) · palette (Task 2) · fonts (Tasks 1,2) · voice/three-registers (Task 5 `copy.ts`) · all 9 slides (Tasks 9–17) · manifest skip logic (Task 4) · share card (Task 17) · motion + reduced-motion (Tasks 7,8,21) · a11y (Tasks 8,19,21) · manifest unit test (Task 4) · fallbacks (Tasks 4,21) · scope: only `packages/web` touched (CLI/server/analytics untouched). ✓ No gaps.
- **Placeholder scan:** every code step contains complete code; the only annotation is the explicit copy-artifact guard in Task 19. ✓
- **Type consistency:** `SlideViewProps {stats}` used identically across registry + all slides; `SlideEntry {id,bg}` consistent between `types.ts`, `manifest.ts`, `Story.tsx`; `ColorToken` keys match `PALETTE` and Tailwind colors; `buildSlideManifest` / `useStoryNavigation` / `downloadNodeAsPng` / `useCountUp` signatures match call sites. ✓
