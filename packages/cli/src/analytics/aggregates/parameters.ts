/**
 * Parameter/flag analysis aggregation
 */

import type { CommandEvent } from '../../history/models';
import { getBaseCommand } from '../../history/models';
import type { ParameterStats } from '../models';

const MAX_TOP_FLAGS = 15;
const MAX_FLAG_COMBOS = 10;
const MAX_COMMANDS_PER_FLAG = 5;

/**
 * Check if a string looks like a flag
 */
function isFlag(arg: string): boolean {
  return arg.startsWith('-') && arg.length > 1;
}

/**
 * Normalize a flag (handle combined short flags like -la -> -l, -a)
 */
function normalizeFlags(arg: string): string[] {
  // Long flag: --verbose, --help
  if (arg.startsWith('--')) {
    return [arg];
  }

  // Short combined flags: -la -> -l, -a
  if (arg.startsWith('-') && arg.length > 2 && !arg.includes('=')) {
    // Check if it looks like combined short flags (all letters)
    const flagPart = arg.slice(1);
    if (/^[a-zA-Z]+$/.test(flagPart)) {
      return flagPart.split('').map(c => `-${c}`);
    }
  }

  // Single short flag or flag with value
  return [arg.split('=')[0]];
}

/**
 * Aggregate parameter statistics from command events
 */
export function aggregateParameters(events: CommandEvent[]): ParameterStats {
  const flagCounts = new Map<string, { count: number; commands: Set<string> }>();
  const commandFlagCombos = new Map<string, { flags: Set<string>; count: number }>();

  for (const event of events) {
    const baseCmd = getBaseCommand(event.command);
    const argv = event.argv;

    // Track flags used in this command
    const flagsInThisCommand = new Set<string>();

    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i];

      if (isFlag(arg)) {
        const normalizedFlags = normalizeFlags(arg);

        for (const flag of normalizedFlags) {
          flagsInThisCommand.add(flag);

          // Count global flag usage
          if (!flagCounts.has(flag)) {
            flagCounts.set(flag, { count: 0, commands: new Set() });
          }
          const flagData = flagCounts.get(flag)!;
          flagData.count++;
          if (flagData.commands.size < MAX_COMMANDS_PER_FLAG) {
            flagData.commands.add(baseCmd);
          }
        }
      }
    }

    // Track command + flag combinations
    if (flagsInThisCommand.size > 0) {
      const comboKey = `${baseCmd}:${[...flagsInThisCommand].sort().join(',')}`;

      if (!commandFlagCombos.has(comboKey)) {
        commandFlagCombos.set(comboKey, {
          flags: flagsInThisCommand,
          count: 0,
        });
      }
      commandFlagCombos.get(comboKey)!.count++;
    }
  }

  // Sort and format top flags
  const topFlags = [...flagCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, MAX_TOP_FLAGS)
    .map(([flag, data]) => ({
      flag,
      count: data.count,
      commands: [...data.commands],
    }));

  // Sort and format command flag combos (group by command, show top combos)
  const combosByCommand = new Map<string, { flags: string[]; count: number }[]>();

  for (const [key, data] of commandFlagCombos) {
    const [command] = key.split(':');
    if (!combosByCommand.has(command)) {
      combosByCommand.set(command, []);
    }
    combosByCommand.get(command)!.push({
      flags: [...data.flags].sort(),
      count: data.count,
    });
  }

  // Get top combos per command
  const topCombos: { command: string; flags: string[]; count: number }[] = [];

  for (const [command, combos] of combosByCommand) {
    // Sort by count and take top combo for this command
    const sorted = combos.sort((a, b) => b.count - a.count);
    if (sorted.length > 0 && sorted[0].count >= 3) {
      topCombos.push({
        command,
        flags: sorted[0].flags,
        count: sorted[0].count,
      });
    }
  }

  // Sort by count and limit
  const commandFlagCombosResult = topCombos
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_FLAG_COMBOS);

  return {
    topFlags,
    commandFlagCombos: commandFlagCombosResult,
  };
}
