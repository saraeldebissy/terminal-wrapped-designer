import { describe, it, expect } from 'vitest';
import { buildSlideManifest } from './manifest';
import { fullStats, minimalStats } from '../test/fixtures';

describe('buildSlideManifest', () => {
  it('includes all slides for full stats, in order', () => {
    const ids = buildSlideManifest(fullStats).map((s) => s.id);
    expect(ids).toEqual([
      'cover', 'volume', 'type', 'peakHour',
      'busiestDay', 'flag', 'countdown', 'secrets', 'receipt',
    ]);
  });

  it('always starts with cover and ends with receipt', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids[0]).toBe('cover');
    expect(ids[ids.length - 1]).toBe('receipt');
  });

  it('skips time slides when there is no timestamp data', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('peakHour');
    expect(ids).not.toContain('busiestDay');
  });

  it('skips secrets when none were found', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('secrets');
  });

  it('skips type and flag slides when those sections are empty', () => {
    const ids = buildSlideManifest(minimalStats).map((s) => s.id);
    expect(ids).not.toContain('type');
    expect(ids).not.toContain('flag');
  });

  it('assigns a known palette token to every slide', () => {
    const valid = ['lime', 'magenta', 'blue', 'violet', 'ink'];
    for (const s of buildSlideManifest(fullStats)) {
      expect(valid).toContain(s.bg);
    }
  });

  it('skips only countdown when topCommands is empty but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, topCommands: [] }).map((s) => s.id);
    expect(ids).not.toContain('countdown');
    expect(ids).toContain('peakHour');
    expect(ids).toContain('busiestDay');
    expect(ids).toContain('type');
    expect(ids).toContain('flag');
    expect(ids).toContain('secrets');
  });

  it('skips only peakHour when activityByHour is all-zero but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, activityByHour: [{ hour: 0, count: 0 }] }).map((s) => s.id);
    expect(ids).not.toContain('peakHour');
    expect(ids).toContain('busiestDay');
    expect(ids).toContain('type');
    expect(ids).toContain('flag');
    expect(ids).toContain('countdown');
    expect(ids).toContain('secrets');
  });

  it('skips only busiestDay when activityByDay is empty but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, activityByDay: [] }).map((s) => s.id);
    expect(ids).not.toContain('busiestDay');
    expect(ids).toContain('peakHour');
    expect(ids).toContain('type');
    expect(ids).toContain('flag');
    expect(ids).toContain('countdown');
    expect(ids).toContain('secrets');
  });

  it('skips only type when categories is empty but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, categories: [] }).map((s) => s.id);
    expect(ids).not.toContain('type');
    expect(ids).toContain('peakHour');
    expect(ids).toContain('busiestDay');
    expect(ids).toContain('flag');
    expect(ids).toContain('countdown');
    expect(ids).toContain('secrets');
  });

  it('skips only flag when parameters.topFlags is empty but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, parameters: { ...fullStats.parameters, topFlags: [] } }).map((s) => s.id);
    expect(ids).not.toContain('flag');
    expect(ids).toContain('peakHour');
    expect(ids).toContain('busiestDay');
    expect(ids).toContain('type');
    expect(ids).toContain('countdown');
    expect(ids).toContain('secrets');
  });

  it('skips only secrets when totalSecretsFound is 0 but other data is present', () => {
    const ids = buildSlideManifest({ ...fullStats, secrets: { ...fullStats.secrets, totalSecretsFound: 0 } }).map((s) => s.id);
    expect(ids).not.toContain('secrets');
    expect(ids).toContain('peakHour');
    expect(ids).toContain('busiestDay');
    expect(ids).toContain('type');
    expect(ids).toContain('flag');
    expect(ids).toContain('countdown');
  });

  it('does not crash and skips flag/secrets when parameters and secrets are absent (legacy stats.json)', () => {
    const legacy = { ...fullStats } as Record<string, unknown>;
    delete legacy.parameters;
    delete legacy.secrets;
    const ids = buildSlideManifest(legacy as unknown as import('../api/types').Stats).map((s) => s.id);
    expect(ids).not.toContain('flag');
    expect(ids).not.toContain('secrets');
    expect(ids[0]).toBe('cover');
    expect(ids[ids.length - 1]).toBe('receipt');
    expect(ids).toContain('countdown');
  });
});
