import type { Stats } from '../api/types';
import type { SlideEntry } from './types';

/**
 * Build the ordered list of slides that have data to show.
 * This is the single source of truth for slide order and absent-data skipping,
 * so the Story engine never has to guess and progress bars never have holes.
 */
export function buildSlideManifest(stats: Stats): SlideEntry[] {
  const entries: SlideEntry[] = [];

  entries.push({ id: 'cover', bg: 'ink' });
  entries.push({ id: 'volume', bg: 'magenta' });

  // Top commands countdown sits right after the volume reveal.
  if ((stats.topCommands?.length ?? 0) > 0) {
    entries.push({ id: 'countdown', bg: 'blue' });
  }
  if ((stats.categories?.length ?? 0) > 0) {
    entries.push({ id: 'type', bg: 'lime' });
  }
  if (stats.activityByHour?.some((h) => h.count > 0)) {
    entries.push({ id: 'peakHour', bg: 'blue' });
  }
  if ((stats.activityByDay?.length ?? 0) > 0) {
    entries.push({ id: 'busiestDay', bg: 'violet' });
  }
  // Secrets (the "terminal mistake") lands before the flag reveal.
  if ((stats.secrets?.totalSecretsFound ?? 0) > 0) {
    entries.push({ id: 'secrets', bg: 'ink' });
  }
  if ((stats.parameters?.topFlags?.length ?? 0) > 0) {
    entries.push({ id: 'flag', bg: 'ink' });
  }

  entries.push({ id: 'receipt', bg: 'ink' });
  return entries;
}
