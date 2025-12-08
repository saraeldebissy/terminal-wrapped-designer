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
