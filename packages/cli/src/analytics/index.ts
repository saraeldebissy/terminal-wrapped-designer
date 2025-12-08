/**
 * Main analytics orchestrator
 */

import type { CommandEvent } from '../history/models';
import type { Stats } from './models';
import { aggregateCommands } from './aggregates/commands';
import { aggregateCategories } from './aggregates/categories';
import { aggregateActivityByDay, aggregateActivityByHour, getDateRange } from './aggregates/timeseries';
import { aggregateDirectories } from './aggregates/directories';
import { aggregateParameters } from './aggregates/parameters';
import { aggregateSecrets } from './aggregates/secrets';
import { aggregateQuirky } from './aggregates/quirky';
import { generateHighlights } from './highlights';

// Version from package.json (will be updated during build)
const VERSION = '0.1.0';

export interface CalculateStatsOptions {
  /** Filter to commands in a specific year */
  year?: number;
  /** Include commands on or after this date */
  since?: Date;
  /** Include commands on or before this date */
  until?: Date;
}

/**
 * Calculate all statistics from command events
 */
export function calculateStats(
  events: CommandEvent[],
  options: CalculateStatsOptions = {}
): Stats {
  // Apply date filters
  const filteredEvents = filterByDate(events, options);

  // Run all aggregations
  const { topCommands, topFullCommands, totalCommands, distinctCommands } = aggregateCommands(filteredEvents);
  const categories = aggregateCategories(filteredEvents);
  const activityByDay = aggregateActivityByDay(filteredEvents);
  const activityByHour = aggregateActivityByHour(filteredEvents);
  const topDirectories = aggregateDirectories(filteredEvents);
  const parameters = aggregateParameters(filteredEvents);
  const secrets = aggregateSecrets(filteredEvents);
  const quirky = aggregateQuirky(filteredEvents);

  // Get date range
  const dateRange = getDateRange(filteredEvents);

  // Build partial stats for highlight generation
  const partialStats: Partial<Stats> = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: VERSION,
      totalCommands,
      distinctCommands,
      dateRange: {
        start: dateRange.start?.toISOString().split('T')[0],
        end: dateRange.end?.toISOString().split('T')[0],
      },
      filters: {
        year: options.year,
        since: options.since?.toISOString().split('T')[0],
        until: options.until?.toISOString().split('T')[0],
      },
    },
    topCommands,
    activityByHour,
    secrets,
    quirky,
  };

  // Generate highlights
  const highlights = generateHighlights(partialStats);

  // Assemble full stats
  const stats: Stats = {
    meta: partialStats.meta!,
    topCommands,
    topFullCommands,
    categories,
    activityByDay,
    activityByHour,
    topDirectories,
    parameters,
    secrets,
    quirky,
    highlights,
  };

  return stats;
}

/**
 * Filter events by date range
 */
function filterByDate(
  events: CommandEvent[],
  options: CalculateStatsOptions
): CommandEvent[] {
  let { since, until } = options;
  const { year } = options;

  // Convert year to date range
  if (year !== undefined) {
    since = new Date(year, 0, 1);
    until = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  if (!since && !until) {
    return events;
  }

  return events.filter(event => {
    // If event has no timestamp, include it (can't filter)
    if (!event.timestamp) {
      return true;
    }

    if (since && event.timestamp < since) {
      return false;
    }

    if (until && event.timestamp > until) {
      return false;
    }

    return true;
  });
}

// Re-export types
export type { Stats, StatsMeta, TopCommand, TopFullCommand, Category, DayActivity, HourActivity, TopDirectory, ParameterStats, SecretsStats, SecretMatch, QuirkyStats, Highlight } from './models';
