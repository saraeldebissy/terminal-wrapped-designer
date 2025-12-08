# Terminal Wrapped – Setup Guide (`setup.md`)

This guide walks through setting up the `terminal-wrapped` monorepo using Node.js, TypeScript, React, Vite, Tailwind CSS, and `pnpm`.

> **Assumptions**
> - Node.js 18+ is installed.
> - `pnpm` is installed globally (`npm install -g pnpm`).

---

## 1. Create the Repo and Initialize Workspaces

```bash
# 1. Create and enter the project folder
mkdir terminal-wrapped
cd terminal-wrapped

# 2. Initialize a root package.json
pnpm init -y

# 3. Create workspace folders
mkdir -p packages/cli packages/web
````

Edit the root `package.json` to enable workspaces and add basic scripts:

```jsonc
{
  "name": "terminal-wrapped-monorepo",
  "private": true,
  "version": "0.0.0",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "pnpm -r build",
    "build:web": "pnpm --filter web build",
    "build:cli": "pnpm --filter cli build",
    "dev:web": "pnpm --filter web dev"
  }
}
```

Create a base TypeScript config for the repo:

```bash
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
EOF
```

---

## 2. Create the Web App (`packages/web`) with Vite + React + TS

### 2.1 Scaffold the React App

```bash
cd packages/web

# Using Vite's React + TypeScript template
pnpm dlx create-vite@latest . --template react-ts

# Initialize package metadata
pnpm init -y
```

Update `packages/web/package.json` (at minimum):

```jsonc
{
  "name": "terminal-wrapped-web",
  "version": "0.1.0",
  "private": true,
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
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

Point `tsconfig.json` to the base config:

```bash
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "vite-env.d.ts"]
}
EOF
```

### 2.2 Add Tailwind CSS

From `packages/web`:

```bash
# Install Tailwind + PostCSS + Autoprefixer (if not already)
pnpm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config
pnpm dlx tailwindcss init -p
```

Edit `tailwind.config.cjs`:

```js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#a855f7',
        secondary: '#14b8a6',
        accent: '#22c55e'
      }
    }
  },
  plugins: []
};
```

Create `src/styles/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Edit `src/main.tsx` to import the Tailwind styles (adjust path if needed):

```ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Set a dark background in a global stylesheet (optional, but recommended). For example in `src/styles/globals.css`:

```css
body {
  @apply bg-slate-950 text-slate-50;
}
```

And import `./styles/globals.css` in `main.tsx` as well if you create it.

### 2.3 Verify the Web Dev Server

From `packages/web`:

```bash
pnpm install
pnpm dev
```

Confirm the app runs at the Vite dev URL (typically `http://localhost:5173`).

---

## 3. Create the CLI Package (`packages/cli`)

### 3.1 Initialize the Package

```bash
cd ../../packages/cli

pnpm init -y
```

Update `packages/cli/package.json`:

```jsonc
{
  "name": "terminal-wrapped",
  "version": "0.1.0",
  "bin": {
    "terminal-wrapped": "bin/terminal-wrapped"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "private": false,
  "scripts": {
    "build": "tsc -p tsconfig.json && node ./scripts/copy-web-build.mjs"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "express": "^4.19.0",
    "open": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0"
  }
}
```

Create `tsconfig.json` in `packages/cli`:

```bash
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}
EOF
```

### 3.2 Create Source Structure

```bash
mkdir -p src/history src/analytics src/server src/scaffolding src/util bin scripts assets/web-build
```

Create a minimal `src/index.ts` wired to `commander`:

```bash
cat > src/index.ts << 'EOF'
import { Command } from 'commander';
import { runTerminalWrapped } from './cli';

const program = new Command();

program
  .name('terminal-wrapped')
  .description('Generate a Spotify-Wrapped-style summary of your terminal history')
  .argument('[historyPath]', 'Path to shell history file')
  .option('--year <number>', 'Filter commands by year', (v) => parseInt(v, 10))
  .option('--since <date>', 'Include commands on or after this date (YYYY-MM-DD)')
  .option('--until <date>', 'Include commands on or before this date (YYYY-MM-DD)')
  .option('--limit <number>', 'Max number of commands to parse', '50000')
  .option('--port <number>', 'Port to serve the UI on', '3000')
  .option('--no-open', 'Do not open the browser automatically')
  .option('--verbose', 'Enable verbose logging')
  .option('--json <path>', 'Write stats as JSON instead of starting the UI')
  .action(async (historyPath, options) => {
    await runTerminalWrapped(historyPath, options);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
EOF
```

Stub `src/cli.ts`:

```bash
cat > src/cli.ts << 'EOF'
import { resolve } from 'path';

export async function runTerminalWrapped(
  historyPath: string | undefined,
  options: any
): Promise<void> {
  const resolved = historyPath ? resolve(historyPath) : '<auto-detect TBD>';
  console.log('[terminal-wrapped] Stub run with history path:', resolved);
  console.log('[terminal-wrapped] Options:', options);
  // TODO: integrate history parsing, analytics, and server startup.
}
EOF
```

### 3.3 Create the Bin Entry Point

```bash
cat > bin/terminal-wrapped << 'EOF'
#!/usr/bin/env node
require('../dist/index.js');
EOF

chmod +x bin/terminal-wrapped
```

---

## 4. Wire Web Build into the CLI (`copy-web-build.mjs`)

After you have the web app building to `packages/web/dist`, hook it into the CLI.

From `packages/cli`:

```bash
cat > scripts/copy-web-build.mjs << 'EOF'
import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const webDist = resolve(__dirname, '../../web/dist');
  const dest = resolve(__dirname, '../assets/web-build');
  await cp(webDist, dest, { recursive: true });
  console.log('[copy-web-build] Copied', webDist, '->', dest);
}

main().catch((err) => {
  console.error('[copy-web-build] Error:', err);
  process.exit(1);
});
EOF
```

This script is already referenced in `packages/cli/package.json` `build` script:

* `tsc -p tsconfig.json && node ./scripts/copy-web-build.mjs`

---

## 5. Install Dependencies and Run Builds

From the **repo root** (`terminal-wrapped`):

```bash
# Install dependencies for all workspaces
pnpm install
```

Build the web app first:

```bash
pnpm build:web
```

Then build the CLI (which will copy the web build):

```bash
pnpm build:cli
```

Or run both via root script:

```bash
pnpm build
```

---

## 6. Local Development

### 6.1 Web App Development

From repo root:

```bash
pnpm dev:web
```

* This runs `vite` in `packages/web`.
* Access the dev app at the Vite dev URL (e.g. `http://localhost:5173`).

### 6.2 CLI Development (Stub)

After running `pnpm build:cli`, test the CLI:

```bash
# From repo root
cd packages/cli

# Use node directly
node bin/terminal-wrapped ~/.zsh_history --year 2024

# Or simulate how it will be used when installed
pnpm link --global  # optional link for local testing
terminal-wrapped ~/.zsh_history --year 2024
```

Once the full implementation is in place, the CLI will:

* Parse the provided history file.
* Generate `stats.json`.
* Copy the web build to a temp directory.
* Start an Express server and open your browser.

---

## 7. Next Steps for Implementation

After scaffolding with this `setup.md`:

1. Implement history parsing (`src/history/` in CLI).
2. Implement analytics and `Stats` model (`src/analytics/` in CLI).
3. Implement the Express static server (`src/server/` in CLI).
4. Implement the React UI (charts, sections, animations) in `packages/web`.
5. Replace the stub logic in `runTerminalWrapped` with the full pipeline:

   * parse history → calculate stats → write `stats.json` → serve web → open browser.
