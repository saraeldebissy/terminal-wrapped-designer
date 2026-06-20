# Terminal Wrapped — Designer Edition Redesign

**Date:** 2026-06-20
**Scope:** `packages/web` only. The CLI, server, history parsing, and analytics are untouched.

## Goal

Transform the web visualization from a scrolling dashboard into a **Spotify-Wrapped-style tap-through story**, with the Wrapped editorial color language and a "designer who codes" voice. The end product funnels to a screenshot-worthy share card.

## Decisions (locked during brainstorming)

| Decision | Choice |
|----------|--------|
| Format | Full-screen tap-through **story slides** (not a dashboard reskin) |
| Framing | **Full-bleed, responsive to viewport** — color fills the screen, type goes huge |
| Navigation | User-paced: click / arrow keys / spacebar, with Wrapped-style progress bars (position indicator, NOT an auto-advance timer) |
| Palette — backgrounds | lime `#C9F23C`, magenta `#FF2E93`, electric blue `#2D6DF6`, violet `#8B5CF6`, ink `#0A0A0A` |
| Palette — accents | yellow `#FFD23F`, coral `#FF4B2B`, white |
| Type | Bold grotesque display for headlines/numbers; **monospace for command tokens** (`git`, `-la`). The sans/mono split is the designer-who-codes signature. |
| Voice | Dry & deadpan. Three rotated registers: flat fact / dry aside / single word. Emoji rationed to near-zero. |

## Slide Sequence

Narrative arc: warm-up → habits → identity → countdown payoff → secrets punchline → shareable receipt.

| # | Slide | Data source | Background | Notes |
|---|-------|-------------|------------|-------|
| 1 | **Cover** | `meta.dateRange` | ink + lime wordmark | "You and your shell had a year" |
| 2 | **The volume** | `meta.totalCommands`, `meta.distinctCommands` | magenta | warm-up number, counts up |
| 3 | **Your type** | `categories` | lime | "62% git creature" — sets up the countdown |
| 4 | **Peak hour** | `activityByHour` | blue | **optional — skipped if no timestamp data** |
| 5 | **Busiest day** | `activityByDay` | violet | **optional — skipped if no timestamp data** |
| 6 | **Favorite flag** | `parameters.topFlags` | ink + coral accent | texture beat; flag in mono |
| 7 | **Top command countdown** | `topCommands[0–4]` | blue | animates 5→1, lands on the hero (`git`) |
| 8 | **Dirty secrets** (climax) | `secrets` | ink + coral danger | the differentiator; "3 plaintext credentials. Bold." Skipped if no secrets. |
| 9 | **The receipt** | `meta` + `highlights` | ink + full palette | shareable PNG export |

`git` is stated **once** (as the countdown payoff). Quirky stats (`quirky.sudoCount`, `destructiveCount`, `aliasLikeCount`) appear as accent details on existing slides, not their own screens.

## Architecture

### Data flow

```
useStats() → stats → buildSlideManifest(stats) → Slide[] → <Story slides={...} />
                                                            └ renders slides[index]
```

### Core components

- **`<Story>`** — owns slide index and navigation (click / ArrowLeft / ArrowRight / Space), renders progress bars, drives enter/exit transitions. Has no knowledge of terminal data. Reusable.
- **`buildSlideManifest(stats): Slide[]`** — pure function. Returns the ordered list of slides that have data. All absent-data logic lives here (e.g. skip peak-hour/busiest-day when timestamps are missing, skip secrets when none found). Single source of truth, unit-testable. Progress bars derive from the manifest length, so there are never holes.
- **`<Slide>`** — full-bleed wrapper taking a background color token + children. Foundation for every slide.

### Slide components

One small, focused component per slide, each receiving its data as props and owning its own motion:
`CoverSlide`, `VolumeSlide`, `TypeSlide`, `PeakHourSlide`, `BusiestDaySlide`, `FlagSlide`, `CountdownSlide`, `SecretsSlide`, `ReceiptSlide`.

### Copy layer

- **`copy.ts`** maps stats → display strings. All voice lives here so tone is tunable in one file, never hardcoded inside slide components.

### Share card

- `ReceiptSlide` doubles as the export target. Rendered to PNG via **`html-to-image`** (one new dependency) and offered as a download.

### Retired / kept

- **Retired:** `LayoutShell`, `Nav`, `Section`, and the dashboard chart components (`TopCommandsBarChart`, `HourlyPatternBarChart`, `CategoryBarChart`, `ActivityHeatmap`, `ParameterStatsChart`) — the scrolling dashboard goes away.
- **Kept untouched:** `api/useStats.ts`, `api/types.ts`.
- **Repurposed where useful:** motion helpers and `CommandPill` may be adapted for slides.

## Design Tokens

- `tailwind.config.cjs`: remove `primary/secondary/accent`; add `lime, magenta, blue, violet, ink` (backgrounds) and `yellow, coral, white` (accents).
- Type scale: hero numbers via responsive `clamp()`, tight leading. Display grotesque + mono pairing. Per-background text color (black or white) locked for WCAG AA contrast.

## Motion

- Framer Motion (`motion/react`, already a dependency).
- Per-slide enter: numbers count up, text staggers in.
- Countdown slide: animates 5→1 and lands on the hero command.
- User-paced advance; progress bars indicate position, not a timer.
- `prefers-reduced-motion` honored — animations reduce to simple fades.

## Accessibility

- Full keyboard navigation with visible focus management.
- AA contrast on every background/text pairing.
- `prefers-reduced-motion` respected.
- Progress and navigation exposed via appropriate ARIA.

## Fallbacks

- Manifest skips any slide whose data is absent; the story still reads at as few as ~3 slides.
- No timestamps → time slides vanish (common for default bash/zsh history).
- No secrets detected → secrets slide vanishes.

## Testing

- Unit-test `buildSlideManifest` — the data-presence/skip logic is the one piece of real branching and must be covered (no timestamps, no secrets, minimal data, full data).
- Manual: run `pnpm dev:web` against sample `stats.json` and walk the story by keyboard and click.

## Out of Scope

- New or changed statistics, analytics logic, or CLI flags.
- Changes to history parsing, the server, or the build pipeline (beyond the new web dependency).
