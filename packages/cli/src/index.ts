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
