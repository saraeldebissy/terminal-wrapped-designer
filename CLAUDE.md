# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Terminal Wrapped is a CLI tool that generates Spotify Wrapped-style statistics from shell history files. It parses history (zsh/bash/fish), computes analytics, and serves an animated React visualization locally.

## Commands

```bash
# Install dependencies
pnpm install

# Build everything (web first, then CLI copies web build)
pnpm build

# Build individual packages
pnpm build:web    # Build React app
pnpm build:cli    # Build CLI + copy web assets

# Development
pnpm dev:web      # Start Vite dev server at localhost:5173

# Run the CLI
pnpm cli -- [historyPath] [options]
pnpm cli:help
```

## Architecture

**Monorepo with pnpm workspaces:**
- `packages/cli` - Node.js CLI (published as `terminal-wrapped` on npm)
- `packages/web` - React SPA (built assets copied into CLI for distribution)

**CLI Flow:**
1. Parse CLI args with `commander` (`src/index.ts` → `src/cli.ts`)
2. Read and parse shell history file (`src/history/`)
3. Compute statistics (`src/analytics/`)
4. Either write JSON (`--json`) or:
   - Copy web build to temp dir
   - Write `stats.json`
   - Start Express server (`src/server/`)
   - Open browser

**Web App:**
- Fetches `/stats.json` from local server via `useStats` hook
- Renders animated visualizations with `motion/react` (Framer Motion)
- Styled with Tailwind CSS

**Build Pipeline:**
The CLI build script (`pnpm build:cli`) runs TypeScript compilation then executes `scripts/copy-web-build.mjs` to copy `packages/web/dist` → `packages/cli/assets/web-build`.

## Key Types

`CommandEvent` - Normalized shell history entry with command, argv, timestamp, shell type
`Stats` - Analytics output including topCommands, activityByDay/Hour, categories, streaks, highlights
