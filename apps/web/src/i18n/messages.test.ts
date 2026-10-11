import { describe, expect, it } from 'vitest';
import { messages, t } from './messages';

describe('i18n messages', () => {
  it('has en hi ta locales', () => {
    expect(Object.keys(messages).sort()).toEqual(['en', 'hi', 'ta']);
  });

  it('interpolates workingOn count', () => {
    expect(t('en', 'workingOn', { n: 3 })).toContain('3');
    expect(t('hi', 'workingOn', { n: 2 })).toContain('2');
    expect(t('ta', 'workingOn', { n: 1 })).toContain('1');
  });

  it('returns brand per locale', () => {
    expect(t('en', 'brand')).toBe('Svaraa');
    expect(t('hi', 'brand')).toBe('स्वरा');
    expect(t('ta', 'brand')).toBe('ஸ்வரா');
  });

  it('covers core nav keys in every locale', () => {
    for (const locale of ['en', 'hi', 'ta'] as const) {
      for (const key of ['today', 'talk', 'apps', 'alerts', 'getHelp', 'play', 'myDay'] as const) {
        expect(t(locale, key).length).toBeGreaterThan(0);
      }
    }
  });
});
