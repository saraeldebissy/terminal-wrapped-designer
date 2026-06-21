# terminal-wrapped-web

The React SPA for [Terminal Wrapped — Designer Edition](../../README.md). It renders the tap-through story from a `stats.json` file. In production the CLI builds this app, drops a generated `stats.json` next to it, and serves it; in development it reads the sample at `public/stats.json`.

## Develop

```bash
# From the repo root
pnpm dev:web        # Vite dev server at http://localhost:5173

# Or from this package
pnpm dev
pnpm build
pnpm test           # Vitest
```

The dev server reads `public/stats.json` — edit that file to preview the story against different data.

## How it fits together

- **`src/api/types.ts`** — the `Stats` type. This is the contract with the CLI; everything downstream is data-agnostic.
- **`src/slides/manifest.ts`** — single source of truth for slide order and absent-data skipping. A slide only appears if it has data, so the story never has holes.
- **`src/story/`** — the engine: `Story` (navigation, keyboard/click, a11y), `Slide` (background + terminal-window chrome), `ProgressBars`.
- **`src/slides/`** — one component per slide, plus `copy.ts` (all user-facing text and the voice) and `registry.tsx` (id → component).
- **`src/components/`** — shared pieces: `BackgroundDecor`, `TerminalChrome`, `Cursor`, and `charts/` (HourHistogram, DaySparkline, CategoryBars).
- **`src/theme/`** — `palette.ts` (the Wrapped color tokens) and `color.ts` (the `rgba()` helper).

## Notes

- Built with React 19, Vite, Tailwind CSS v3, and Framer Motion (`motion/react`).
- Faint tints are computed as `rgba()` from each slide's text color, **not** Tailwind `*-current/NN` — Tailwind v3 ignores opacity modifiers on `currentColor`.
- Motion respects `prefers-reduced-motion` via a top-level `MotionConfig reducedMotion="user"`.
- The web defends against partial/legacy `stats.json` with optional chaining, so a thin history still renders a valid (shorter) story.
