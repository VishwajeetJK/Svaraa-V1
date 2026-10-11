import { describe, expect, it } from 'vitest';
import { APP_TILES, ONBOARDING_STEPS } from './apps.js';

describe('APP_TILES', () => {
  it('includes the PRD registry apps', () => {
    const ids = APP_TILES.map((t) => t.id);
    for (const required of [
      'today',
      'recall',
      'todo',
      'reminders',
      'prayer',
      'recite',
      'music',
      'news',
      'family',
      'safety',
      'pendant',
      'connections',
      'routines',
      'settings',
    ]) {
      expect(ids).toContain(required);
    }
  });

  it('routes start with slash', () => {
    for (const tile of APP_TILES) {
      expect(tile.route.startsWith('/')).toBe(true);
    }
  });

  it('uses known families', () => {
    const families = new Set(APP_TILES.map((t) => t.family));
    expect(families.has('care')).toBe(true);
    expect(families.has('safety')).toBe(true);
    expect(families.has('spirit')).toBe(true);
  });
});

describe('ONBOARDING_STEPS', () => {
  it('has exactly 13 steps numbered 1..13', () => {
    expect(ONBOARDING_STEPS).toHaveLength(13);
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('marks skippable steps as not required', () => {
    const skippable = ONBOARDING_STEPS.filter((s) => !s.required).map((s) => s.key);
    expect(skippable).toEqual(['reminders', 'recite', 'routines']);
  });

  it('requires account, pair, and SOS drill', () => {
    for (const key of ['account', 'pair', 'drill']) {
      expect(ONBOARDING_STEPS.find((s) => s.key === key)?.required).toBe(true);
    }
  });
});
