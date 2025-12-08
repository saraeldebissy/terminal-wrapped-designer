/**
 * Generate highlight cards from computed stats
 */

import type { Stats, Highlight, HourActivity } from './models';

/**
 * Find the peak hour from hourly activity
 */
function getPeakHour(activityByHour: HourActivity[]): number | null {
  if (activityByHour.length === 0) {
    return null;
  }

  let maxCount = 0;
  let peakHour = 0;

  for (const { hour, count } of activityByHour) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  }

  return maxCount > 0 ? peakHour : null;
}

/**
 * Format a number with commas
 */
function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Generate highlights based on computed stats
 */
export function generateHighlights(stats: Partial<Stats>): Highlight[] {
  const highlights: Highlight[] = [];

  // Top command highlight
  if (stats.topCommands && stats.topCommands.length > 0) {
    const top = stats.topCommands[0];
    highlights.push({
      id: 'top-command',
      title: 'Your #1 Command',
      description: `You ran **${top.name}** ${formatNumber(top.count)} times. That's your terminal's main character.`,
      iconKey: 'star',
    });
  }

  // Night owl / Early bird
  if (stats.activityByHour && stats.activityByHour.length > 0) {
    const peakHour = getPeakHour(stats.activityByHour);

    if (peakHour !== null) {
      // Night owl: peak between 22:00 and 02:00
      if (peakHour >= 22 || peakHour <= 2) {
        highlights.push({
          id: 'night-owl',
          title: 'Night Owl',
          description: `Most of your commands happen late at night (around ${peakHour}:00). Who needs sleep, anyway?`,
          iconKey: 'moon',
        });
      }
      // Early bird: peak between 5:00 and 8:00
      else if (peakHour >= 5 && peakHour <= 8) {
        highlights.push({
          id: 'early-bird',
          title: 'Early Bird',
          description: `You're most active around ${peakHour}:00. Rise and grind!`,
          iconKey: 'sun',
        });
      }
    }
  }

  // Secrets exposed warning
  if (stats.secrets && stats.secrets.totalSecretsFound > 0) {
    highlights.push({
      id: 'secrets-exposed',
      title: 'Secrets Spotter',
      description: `Found **${stats.secrets.totalSecretsFound}** potential secret(s) in your history. Time to rotate those keys!`,
      iconKey: 'alert',
    });
  }

  // Git guru
  if (stats.topCommands) {
    const gitRank = stats.topCommands.findIndex(c => c.name === 'git');
    if (gitRank >= 0 && gitRank < 3) {
      const gitCmd = stats.topCommands[gitRank];
      highlights.push({
        id: 'git-guru',
        title: 'Git Guru',
        description: `Git is your #${gitRank + 1} command with ${formatNumber(gitCmd.count)} uses. Version control champion!`,
        iconKey: 'git-branch',
      });
    }
  }

  // Docker whale
  if (stats.topCommands) {
    const dockerRank = stats.topCommands.findIndex(c => c.name === 'docker');
    if (dockerRank >= 0 && dockerRank < 5) {
      const dockerCmd = stats.topCommands[dockerRank];
      highlights.push({
        id: 'docker-whale',
        title: 'Container Captain',
        description: `You ran docker ${formatNumber(dockerCmd.count)} times. Ship it!`,
        iconKey: 'box',
      });
    }
  }

  // Sudo wielder
  if (stats.quirky && stats.quirky.sudoCount > 100) {
    highlights.push({
      id: 'sudo-wielder',
      title: 'Sudo Wielder',
      description: `You used sudo ${formatNumber(stats.quirky.sudoCount)} times. With great power...`,
      iconKey: 'shield',
    });
  }

  // Clean coder (low destructive count relative to total)
  if (stats.quirky && stats.meta) {
    const destructiveRatio = stats.quirky.destructiveCount / stats.meta.totalCommands;
    if (destructiveRatio < 0.001 && stats.meta.totalCommands > 1000) {
      highlights.push({
        id: 'clean-coder',
        title: 'Safety First',
        description: `Very few destructive commands. You measure twice and cut once.`,
        iconKey: 'check-circle',
      });
    }
  }

  // Command diversity
  if (stats.meta && stats.meta.distinctCommands > 100) {
    highlights.push({
      id: 'polyglot',
      title: 'Command Polyglot',
      description: `You used ${formatNumber(stats.meta.distinctCommands)} different commands. Jack of all trades!`,
      iconKey: 'layers',
    });
  }

  // Prolific coder
  if (stats.meta && stats.meta.totalCommands > 10000) {
    highlights.push({
      id: 'prolific',
      title: 'Terminal Power User',
      description: `${formatNumber(stats.meta.totalCommands)} commands! Your terminal has seen some things.`,
      iconKey: 'zap',
    });
  }

  return highlights;
}
