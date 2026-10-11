import { describe, expect, it } from 'vitest';
import { FAQ_ENTRIES } from './faq.js';
import { SAFETY_RULES, searchFaq, violatesSafetyLanguage } from './search.js';
import { routeIntent } from './intent.js';
import { TOURS, getTour } from './tours.js';
import { getHardwareCard } from './hardware.js';

describe('FAQ KB', () => {
  it('has extensive entries across categories', () => {
    expect(FAQ_ENTRIES.length).toBeGreaterThanOrEqual(25);
    const cats = new Set(FAQ_ENTRIES.map((e) => e.category));
    expect(cats.has('safety')).toBe(true);
    expect(cats.has('hardware')).toBe(true);
    expect(cats.has('privacy')).toBe(true);
  });

  it('ranks SOS / 112 questions highly', () => {
    const hits = searchFaq('Does Svaraa call 112 automatically?', { audience: 'family' });
    expect(hits[0]?.id).toMatch(/never-auto-dial|sos-how/);
    expect(hits[0]?.safetyCritical || hits[0]?.answer.toLowerCase().includes('never')).toBeTruthy();
  });

  it('finds SL1-F privacy slider', () => {
    const hits = searchFaq('privacy slider fold-over mics', { audience: 'both' });
    expect(hits.some((h) => h.id === 'sl1f-privacy')).toBe(true);
  });

  it('safety language detector', () => {
    expect(violatesSafetyLanguage('We automatically call 112')).toBe(true);
    expect(violatesSafetyLanguage('V1 never auto-dials emergency services')).toBe(false);
    expect(SAFETY_RULES.length).toBeGreaterThan(0);
  });
});

describe('intent router', () => {
  it('routes tour requests', () => {
    expect(routeIntent('start a tour of safety').type).toBe('tour');
    expect(routeIntent('walk through hardware').type).toBe('tour');
    const full = routeIntent('full product walkthrough all features');
    expect(full.type).toBe('tour');
    if (full.type === 'tour') expect(full.tourId).toBe('full-product');
  });

  it('routes hardware intents', () => {
    const i = routeIntent('tell me about SL1-F fold privacy');
    expect(i.type).toBe('hardware');
    if (i.type === 'hardware') expect(i.model).toBe('SL1-F');
  });

  it('routes FAQ', () => {
    expect(routeIntent('what is the private home server?').type).toBe('faq');
  });
});

describe('tours', () => {
  it('defines focused tours plus full-product covering all surfaces', () => {
    expect(TOURS.length).toBeGreaterThanOrEqual(6);
    const full = getTour('full-product');
    expect(full).toBeTruthy();
    expect(full!.steps.length).toBeGreaterThanOrEqual(20);
    const routes = new Set(full!.steps.map((s) => s.route));
    for (const must of [
      '/',
      '/onboarding',
      '/home',
      '/today',
      '/talk',
      '/recall',
      '/todo',
      '/reminders',
      '/prayer',
      '/recite',
      '/music',
      '/news',
      '/routines',
      '/connections',
      '/family',
      '/safety',
      '/pendant',
      '/privacy',
      '/settings',
      '/simple',
      '/alerts',
    ]) {
      expect(routes.has(must)).toBe(true);
    }
    for (const t of TOURS) {
      expect(t.steps.length).toBeGreaterThan(0);
      for (const s of t.steps) {
        expect(s.route.startsWith('/')).toBe(true);
        expect(s.title.length).toBeGreaterThan(0);
      }
    }
  });

  it('getTour returns known ids', () => {
    expect(getTour('first-five')?.title).toMatch(/First/);
    expect(getTour('full-product')?.title).toMatch(/Full product/i);
  });
});

describe('hardware cards', () => {
  it('covers shared A F architecture', () => {
    expect(getHardwareCard('SL1-A').bullets.some((b) => /puck/i.test(b))).toBe(true);
    expect(getHardwareCard('SL1-F').bullets.some((b) => /privacy slider/i.test(b))).toBe(true);
    expect(getHardwareCard('architecture').bullets.some((b) => /Gateway/i.test(b))).toBe(true);
  });
});
