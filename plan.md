# Terminal Wrapped – Technical Plan

```text
Repo name: terminal-wrapped
CLI name: terminal-wrapped
Usage: npx terminal-wrapped ~/.zsh_history [options]
````

---

## 1. Goals

* Parse a user’s shell history file (e.g. `~/.zsh_history`, `~/.bash_history`, Fish history).
* Compute “Spotify Wrapped”-style stats about command usage.
* Launch a flashy, animated React single-page app that:

  * Reads these stats from a `stats.json` file served locally.
  * Visualizes them with smooth transitions and motion using `motion.dev` / Framer Motion.
* Serve the website locally (e.g., `http://localhost:3000`) and open it in the user’s browser.
* Provide a JSON-only mode for automation.

---

## 2. Tech Stack (Decided)

### 2.1 CLI / Backend

* **Language:** TypeScript
* **Runtime:** Node.js 18+
* **CLI framework:** [`commander`](https://www.npmjs.com/package/commander)
* **File system / paths:** Node core (`fs/promises`, `path`, `os`)
* **Local server:** [`express`](https://www.npmjs.com/package/express)
* **Open browser:** [`open`](https://www.npmjs.com/package/open)

### 2.2 Web App

* **Build tooling:** Vite
* **Language:** TypeScript
* **Framework:** React (function components + hooks)
* **Animations:** `motion.dev` (`motion/react`)
* **Styling:** Tailwind CSS
* **Charts / basic viz:** Implement with plain SVG / div-based charts (no external chart lib)

### 2.3 Packaging & Distribution

* **Workspace:** npm/pnpm workspaces monorepo
* **Structure:**

  * `packages/cli`
  * `packages/web`
* **Distribution:**

  * `packages/cli` is published as `terminal-wrapped` on npm.
  * `packages/web` builds to static assets; build output is copied into `packages/cli/assets/web-build` before publishing.

---

## 3. High-Level Architecture

1. The user runs `npx terminal-wrapped ~/.zsh_history [options]`.
2. The CLI:

   * Parses CLI arguments using `commander`.
   * Resolves and reads the history file.
   * Detects history format (zsh/bash/fish).
   * Normalizes entries into `CommandEvent[]`.
   * Runs analytics to produce a `Stats` object.
3. If `--json` is provided:

   * Writes `Stats` to the specified path and exits.
4. Otherwise:

   * Creates a temp directory.
   * Copies the pre-built React app (from `assets/web-build`) into the temp directory.
   * Writes `stats.json` into that directory.
   * Starts an Express server serving static assets and `/stats.json`.
   * Opens the browser to the local URL (unless `--no-open`).
   * Keeps the process running until terminated.

---

## 4. Project Structure

```text
terminal-wrapped/
  package.json
  tsconfig.base.json
  pnpm-lock.yaml | package-lock.json | yarn.lock

  packages/
    cli/
      package.json
      tsconfig.json
      src/
        index.ts              # CLI entry (main)
        cli.ts                # commander setup and top-level handler
        config.ts             # defaults, env detection
        history/
          parser.ts           # parse file into CommandEvent[]
          detectors.ts        # detect history format & shell
          models.ts           # CommandEvent type and related
        analytics/
          index.ts            # calculateStats(entry[] -> Stats)
          aggregates/
            commands.ts       # top commands, full commands
            categories.ts     # command categories / genres
            timeseries.ts     # per-day / per-hour activity
            directories.ts    # frequent dirs (if available)
            streaks.ts        # streak calculations
            quirky.ts         # sudo count, destructive commands, etc.
          models.ts           # Stats type and helpers
        server/
          server.ts           # express app, static file server, /stats.json
        scaffolding/
          copyWebBuild.ts     # copy web build to temp dir
        util/
          logger.ts           # logging helpers
          paths.ts            # resolve paths, temp dirs
          errors.ts           # custom error types

      assets/
        web-build/            # production build of React app (copied from web/dist)
          index.html
          assets/...

      bin/
        terminal-wrapped      # small JS stub -> dist/index.js (for npm bin)

      dist/
        ...                   # compiled JS from TypeScript

    web/
      package.json
      tsconfig.json
      vite.config.ts
      index.html
      postcss.config.cjs
      tailwind.config.cjs
      src/
        main.tsx
        App.tsx
        api/
          useStats.ts         # fetch /stats.json and expose as hook
          types.ts            # Stats type mirror (kept in sync with CLI)
        components/
          layout/
            LayoutShell.tsx
            Nav.tsx
            Section.tsx
          summary/
            HeroSummary.tsx
            YearHighlight.tsx
          charts/
            TopCommandsBarChart.tsx
            ActivityHeatmap.tsx
            HourlyPatternBarChart.tsx
            CategoryBarChart.tsx
          cards/
            MetricCard.tsx
            CommandPill.tsx
          motion/
            AnimatedSection.tsx
            StaggeredList.tsx
            ConfettiBurst.tsx
        theme/
          colors.ts
          typography.ts
        styles/
          globals.css
          tailwind.css
```

---

## 5. CLI Specification

### 5.1 CLI Usage

```bash
npx terminal-wrapped [historyPath] [options]

# Examples
npx terminal-wrapped ~/.zsh_history
npx terminal-wrapped ~/.bash_history --year 2024
npx terminal-wrapped ~/.local/share/fish/fish_history --no-open --port 4444
npx terminal-wrapped ~/.zsh_history --json ./stats.json
```

### 5.2 Arguments & Options

* **Positional:**

  * `historyPath` (optional)

    * Default: auto-detected based on `$SHELL`:

      * zsh → `~/.zsh_history`
      * bash → `~/.bash_history`
      * fish → `~/.local/share/fish/fish_history`

* **Options:**

  * `--year <number>`
    Filter to commands in a specific year.
  * `--since <date>`
    ISO date (`YYYY-MM-DD`); include commands on or after this date.
  * `--until <date>`
    ISO date; include commands on or before this date.
  * `--limit <number>`
    Maximum number of most recent commands to parse (default: 50_000).
  * `--port <number>`
    Port to serve the UI on (default: 3000; fall back to next available if in use).
  * `--no-open`
    Do not open the browser automatically.
  * `--verbose`
    Enable verbose logging.
  * `--json <path>`
    Write stats to JSON file and **do not** start the web server.

### 5.3 CLI Flow

`src/index.ts`:

1. Create a `Command` instance from `commander`.
2. Define options and positional arguments.
3. Parse `process.argv`.
4. Call a `runTerminalWrapped(options)` function from `cli.ts`.

`src/cli.ts` (`runTerminalWrapped`):

1. Resolve `historyPath` (positional or auto-detect).
2. Validate file existence and readability.
3. Parse history into `CommandEvent[]` via `parseHistory(filePath)`.
4. Apply date and limit filters.
5. Call `calculateStats(events, filters)` to obtain `Stats`.
6. If `--json` is provided:

   * Serialize `Stats` to the given path.
   * Log success and exit.
7. Otherwise:

   * Create a temp directory under `os.tmpdir()`, e.g. `terminal-wrapped-<timestamp>` via `paths.ts`.
   * Copy `assets/web-build` into the temp directory via `copyWebBuild(targetDir)`.
   * Write `stats.json` (stringified `Stats`) into the temp directory root.
   * Start the Express server with `startServer({ dir: tempDir, port, statsPath })`.
   * Log the URL.
   * If `--no-open` is not set, open the URL with `open(url)`.

---

## 6. History Parsing

### 6.1 Normalized Types

`packages/cli/src/history/models.ts`:

```ts
export type ShellType = 'zsh' | 'bash' | 'fish' | 'unknown';

export interface CommandEvent {
  command: string;        // Full command line, e.g. "git status"
  argv: string[];         // Tokenized form, e.g. ["git", "status"]
  timestamp?: Date;       // Parsed from history if available
  cwd?: string;           // Optional; only set if history includes cwd
  rawLine: string;        // Original line(s) from history file
  shell: ShellType;
}
```

### 6.2 Format Detection

`detectors.ts`:

* `detectShellFromEnv(): ShellType` using `process.env.SHELL`.
* `detectHistoryFormat(filePath: string, sample: string): ShellType`:

  * If lines start with `: <epoch>:<flags>;` → `zsh`.
  * If lines have `#<epoch>` preceding a command line → `bash` (with timestamps).
  * If file appears YAML-like with `- cmd:` and `when:` → `fish`.
  * Otherwise `unknown` → default to simple “one command per line”.

### 6.3 Parsers

`parser.ts`:

```ts
export async function parseHistory(filePath: string, limit: number): Promise<CommandEvent[]>;
```

Steps:

1. Read file content as a single string (initial version).
2. Extract a sample chunk for format detection.
3. Branch to parser based on detected shell type.
4. Parse lines into `CommandEvent[]`.
5. If `limit` provided, keep only the most recent `limit` commands (based on file order or timestamps).
6. Return the array, most recent last.

#### Zsh Parser (`parseZshHistory`)

* Zsh format: `: 1672531199:0;git status`.
* For each line:

  * Match `^: (\d+):\d+;(.*)$`.
  * Timestamp = first capture group (epoch seconds).
  * Command = second capture group (string).
  * `argv = command.split(/\s+/).filter(Boolean)`.
  * `timestamp = new Date(epoch * 1000)`.

#### Bash Parser (`parseBashHistory`)

Two cases:

1. **With timestamps**:

   ```text
   #1672531199
   git status
   ```

   * Lines starting with `#<epoch>` set a “current timestamp”.
   * Next non-comment, non-empty line is the command for that timestamp.

2. **Without timestamps**:

   * Each non-empty line is a command.
   * `timestamp` is `undefined`.

#### Fish Parser (`parseFishHistory`)

* Format (YAML-like):

  ```yaml
  - cmd: git status
    when: 1672531199
  - cmd: ls
    when: 1672531200
  ```

* Implement a minimal line-based parser:

  * On lines starting with `- cmd:`, extract command.
  * On following `when:` line, extract epoch.
  * Optionally handle `cwd:` if present.

#### Fallback Parser (`parseSimpleHistory`)

* For `unknown` shell:

  * Each non-empty line is a command.
  * `timestamp` is `undefined`.

---

## 7. Analytics & Stats Model

### 7.1 Stats Type

`packages/cli/src/analytics/models.ts`:

```ts
export interface Stats {
  meta: {
    generatedAt: string;        // ISO timestamp
    version: string;            // CLI version
    totalCommands: number;
    distinctCommands: number;   // unique base commands (first token)
    dateRange: {
      start?: string;           // ISO date string
      end?: string;
    };
    filters: {
      year?: number;
      since?: string;
      until?: string;
    };
  };

  topCommands: {
    name: string;               // base command, e.g. "git"
    count: number;
    fullExamples: string[];     // up to N sample full commands
    percentile: number;         // 0..1 rank for UI
  }[];

  topFullCommands: {
    command: string;            // full line, e.g. "git status"
    count: number;
  }[];

  categories: {
    name: string;               // "Version Control", "Package Management", etc.
    slug: string;               // "git", "npm", "docker", etc.
    count: number;
    exampleCommands: string[];
  }[];

  activityByDay: {
    date: string;               // YYYY-MM-DD
    count: number;
  }[];

  activityByHour: {
    hour: number;               // 0-23
    count: number;
  }[];

  topDirectories: {
    path: string;
    count: number;
  }[];

  streaks: {
    longestStreakDays: number;
    currentStreakDays: number;
  };

  quirky: {
    sudoCount: number;
    aliasLikeCount: number;     // very short commands, not in a known list
    destructiveCount: number;   // rm -rf, kubectl delete, etc.
  };

  highlights: {
    id: string;                 // stable key, e.g. "top-command"
    title: string;              // “Your #1 Command”
    description: string;        // human-readable highlight
    iconKey?: string;           // used by UI to pick an icon
  }[];
}
```

### 7.2 Aggregations

`analytics/index.ts`:

```ts
export function calculateStats(
  events: CommandEvent[],
  filters: { year?: number; since?: Date; until?: Date }
): Stats;
```

Sub-aggregations:

* `commands.ts`:

  * Compute:

    * Total commands.
    * Distinct base commands (first token).
    * `topCommands`: counts of base commands.
    * `topFullCommands`: counts of full lines.

* `categories.ts`:

  * Map base commands to a fixed category map, e.g.:

    ```ts
    const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
      git: { name: 'Version Control', slug: 'git' },
      hg: { name: 'Version Control', slug: 'hg' },
      svn: { name: 'Version Control', slug: 'svn' },

      npm: { name: 'Package Management', slug: 'npm' },
      yarn: { name: 'Package Management', slug: 'yarn' },
      pnpm: { name: 'Package Management', slug: 'pnpm' },

      node: { name: 'Runtime', slug: 'node' },
      deno: { name: 'Runtime', slug: 'deno' },
      bun: { name: 'Runtime', slug: 'bun' },

      docker: { name: 'DevOps', slug: 'docker' },
      kubectl: { name: 'DevOps', slug: 'kubectl' },
      helm: { name: 'DevOps', slug: 'helm' },

      ssh: { name: 'Remote Ops', slug: 'ssh' },
      scp: { name: 'Remote Ops', slug: 'scp' },
      rsync: { name: 'Remote Ops', slug: 'rsync' },

      vim: { name: 'Editors', slug: 'vim' },
      nvim: { name: 'Editors', slug: 'nvim' },
      code: { name: 'Editors', slug: 'code' }
    };
    ```

* `timeseries.ts`:

  * `activityByDay`: group by `YYYY-MM-DD`.
  * `activityByHour`: group by `timestamp.getHours()` (ignore if no timestamp).

* `directories.ts`:

  * Group by `event.cwd` if present.

* `streaks.ts`:

  * From `activityByDay`, compute:

    * Longest consecutive day streak.
    * Current streak up to the last date.

* `quirky.ts`:

  * `sudoCount`: events whose `command` starts with `sudo`.
  * `aliasLikeCount`: base commands shorter than a threshold (e.g. 2 characters), not in a known list.
  * `destructiveCount`: commands that match patterns like `rm -rf`, `kubectl delete`, etc.

### 7.3 Highlights

Generate highlight cards from stats, examples:

* `top-command`:

  * Title: “Your #1 Command”
  * Description: “You ran **git** **1234** times. That’s your terminal’s main character.”
* `night-owl` (if peak hour between 22–2):

  * Title: “Night Owl”
  * Description: “Most of your commands happen late at night. Who needs sleep, anyway?”
* `streak-hero`:

  * Title: “Streak Hero”
  * Description: “You had a **27-day** streak of terminal activity. Respect.”

These populate `Stats.highlights`.

---

## 8. Static Web Serving

### 8.1 Web Build Copy

`scaffolding/copyWebBuild.ts`:

* Exports:

  ```ts
  export async function copyWebBuildToDir(targetDir: string): Promise<void>;
  ```

* Implementation:

  * Resolve `ASSET_WEB_BUILD_DIR = path.join(__dirname, '..', 'assets', 'web-build')` (adjust for dist).
  * Recursively copy all files from `ASSET_WEB_BUILD_DIR` to `targetDir`.

### 8.2 Express Server

`server/server.ts`:

```ts
interface StartServerOptions {
  dir: string;
  port: number;
}

export async function startServer({ dir, port }: StartServerOptions): Promise<{ url: string }>;
```

* Uses Express:

  * `app.use(express.static(dir));`
  * `app.get('/stats.json', ...)` → directly serve `stats.json` from `dir`.
  * `app.get('*', ...)` → send `index.html` for SPA routing.
* Binds on `port`.

  * If bind fails due to `EADDRINUSE`, increment port and retry a small number of times.
* Returns `{ url: 'http://localhost:<port>' }`.

---

## 9. React App Design

### 9.1 Data Loading Hook

`web/src/api/useStats.ts`:

* Fetch `/stats.json` once on mount.
* States: `stats`, `loading`, `error`.

```ts
import { useEffect, useState } from 'react';
import type { Stats } from './types';

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/stats.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load stats: ${r.status}`);
        return r.json();
      })
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
```

### 9.2 Top-Level Layout

`LayoutShell.tsx`:

* Full-page dark gradient background using Tailwind.
* Centered content with max width (`max-w-5xl mx-auto`).
* Sticky top nav:

  * Sections: “Summary”, “Commands”, “Activity”, “Categories”, “Streaks”, “Quirks”.
  * Nav anchors scroll to sections via `id`.

`App.tsx`:

* Calls `useStats()`.
* Renders loading and error states.
* Once stats are loaded, renders sections wrapped in `AnimatedSection`.

### 9.3 Sections

Each section uses `AnimatedSection` from `motion/react` for scroll-in animations.

1. **Hero / Summary (`HeroSummary.tsx`)**

   * Big heading: “Your Terminal Wrapped”
   * Subtitle: year or date range from `stats.meta`.
   * Three metric cards:

     * Total commands.
     * Distinct commands.
     * Top command.
   * Use motion to fade and slide in, plus a background `ConfettiBurst` animation.

2. **Top Commands (`TopCommandsBarChart.tsx`)**

   * Horizontal bar chart using divs:

     * Each bar width proportional to count.
     * Animate width from 0 to final value.
   * Show command name, count, and optional examples.

3. **Activity Heatmap (`ActivityHeatmap.tsx`)**

   * Map `activityByDay` into a grid of days (simplified calendar).
   * Represent intensity via Tailwind background classes.
   * On mount, fade cells in with staggered animation.

4. **Hourly Pattern (`HourlyPatternBarChart.tsx`)**

   * 24 bars (0–23 hours).
   * Height based on `count`.
   * Bars animate from height 0 to target height.

5. **Categories (`CategoryBarChart.tsx`)**

   * Vertical column chart showing counts by category.
   * Each column enters with an upward motion.

6. **Streaks & Highlights (`StreaksSection`)**

   * Metric cards:

     * Longest streak.
     * Current streak.
   * Highlight cards mapping `Stats.highlights`.
   * Use `StaggeredList` for entry animation.

7. **Quirky Metrics (`QuirkySection`)**

   * Display `sudoCount`, `aliasLikeCount`, `destructiveCount` with playful copy.
   * Cards with small icon/emoji and text.

### 9.4 Motion Components

`motion/AnimatedSection.tsx`:

* Wraps sections with `motion.section`.
* Initial: `{ opacity: 0, y: 40 }`
* While in view: `{ opacity: 1, y: 0 }`
* `viewport={{ once: true, amount: 0.2 }}`

`motion/StaggeredList.tsx`:

* Uses parent/child variants for delayed child animations.

`motion/ConfettiBurst.tsx`:

* Renders a set of `motion.div` elements positioned absolutely behind hero content.
* Animates scale/opacity for celebratory feel.

---

## 10. Theming & Styling

### 10.1 Tailwind Setup

* `tailwind.config.cjs`:

  * Enable `./index.html`, `./src/**/*.{ts,tsx}` as content.
  * Add custom colors for neon accents:

    * `primary`: purple.
    * `secondary`: teal.
    * `accent`: neon green.

* `globals.css`:

  * Apply `bg-slate-950 text-slate-50` to `body`.
  * Disable horizontal scroll.
  * Use a sans-serif font plus monospace for command text.

### 10.2 Design Guidelines

* Background: dark gradient (e.g. `from-slate-950 via-slate-900 to-black`).
* Cards: glass-like effect (semi-transparent backgrounds, subtle borders).
* Commands: display in monospace (`font-mono`).
* Emphasize key numbers with large fonts and subtle glow effects.

---

## 11. Build & Dev Workflows

### 11.1 Root `package.json`

* Use workspaces:

```json
{
  "private": true,
  "name": "terminal-wrapped-monorepo",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "pnpm -r build",
    "build:web": "pnpm --filter web build",
    "build:cli": "pnpm --filter cli build",
    "dev:web": "pnpm --filter web dev"
  }
}
```

### 11.2 CLI Package

`packages/cli/package.json`:

```json
{
  "name": "terminal-wrapped",
  "version": "0.1.0",
  "bin": {
    "terminal-wrapped": "bin/terminal-wrapped"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json && node ./scripts/copy-web-build.mjs"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "express": "^4.19.0",
    "open": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

* `scripts/copy-web-build.mjs`:

  * Copies `../web/dist` to `assets/web-build`.

### 11.3 Web Package

`packages/web/package.json`:

```json
{
  "name": "terminal-wrapped-web",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "motion": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

---

## 12. Error Handling & Edge Cases

* **Missing history file:**

  * Display an error: “History file not found at `<path>`.”
  * Suggest auto-detected paths based on shell.
* **Empty/very small history:**

  * Generate minimal `Stats`.
  * UI shows a friendly message like “Not much terminal history yet.”
* **No timestamps (bash without timestamps):**

  * `activityByDay` and `activityByHour` can be empty.
  * UI hides time-based sections when arrays are empty.
* **Very large histories:**

  * Respect `--limit` (default 50_000 events).
  * Log a message in verbose mode indicating truncation.

---

## 13. Security & Privacy

* All parsing and analytics run locally in the CLI process.
* The React app is served locally and only fetches `/stats.json` from the local server.
* No outbound network requests are made by default.
* Add a simple redaction mechanism for destructive examples:

  * When generating sample commands for display, replace long tokens (e.g., tokens containing `=` or >32 chars) with `<redacted>`.
* Avoid printing full commands in verbose logs by default; log only counts and aggregate information.

---

## 14. Implementation Tasks (For LLM or Human)

1. **Monorepo Setup**

   * Create root `package.json` with workspaces.
   * Add `tsconfig.base.json`.
   * Initialize `packages/cli` and `packages/web`.

2. **Web App Implementation**

   * Set up Vite + React + TypeScript + Tailwind.
   * Implement `Stats` type in `web/src/api/types.ts`.
   * Implement `useStats` hook.
   * Implement layout components (`LayoutShell`, `Nav`, `Section`).
   * Implement summary section (`HeroSummary`) with animated metrics and confetti.
   * Implement charts and sections using div/SVG-based visualizations.
   * Wire Framer Motion (`motion/react`) into `AnimatedSection`, `StaggeredList`, `ConfettiBurst`.
   * Style everything with Tailwind to achieve a “Wrapped”-like vibe.

3. **Web Build Integration**

   * Add `build` script to web package (`vite build`).
   * Add script `copy-web-build.mjs` in CLI to copy `web/dist` to `cli/assets/web-build`.
   * Ensure `pnpm build` or `npm run build` at root builds web, then CLI.

4. **History Parsing**

   * Implement `CommandEvent` type and `ShellType` enum.
   * Implement shell detection from environment and history sample.
   * Implement `parseZshHistory`, `parseBashHistory`, `parseFishHistory`, and `parseSimpleHistory`.
   * Implement `parseHistory(filePath, limit)` to orchestrate parsing and limit handling.

5. **Analytics**

   * Implement aggregation helpers for commands, categories, timeseries, directories, streaks, quirky metrics.
   * Implement `calculateStats(events, filters)` to produce a complete `Stats` object.
   * Implement highlight generation based on computed stats.

6. **CLI Wiring**

   * Set up `commander` in `src/index.ts` with all options.
   * Implement `runTerminalWrapped()` in `cli.ts` that:

     * Resolves path.
     * Parses and filters history.
     * Computes stats.
     * Either writes JSON or starts server and opens browser.

7. **Server**

   * Implement Express server in `server.ts` serving:

     * Static files from temp directory.
     * `/stats.json` from file.
     * `index.html` for SPA routes.

8. **Testing**

   * Create sample history files for zsh/bash/fish.
   * Add tests (using Node’s built-in assert or a simple test harness) for:

     * Parsing correctness.
     * Analytics (top command, streaks).
   * Manual test: run CLI against sample history and verify UI.

9. **Publish**

   * Ensure `bin/terminal-wrapped` is an executable that calls `node dist/index.js`.
   * Test `npx terminal-wrapped ./examples/zsh_history` locally.
   * Publish `terminal-wrapped` to npm.
