import { describe, expect, it } from 'vitest';
import {
  AccountSchema,
  ActionItemSchema,
  HouseholdSchema,
  IncidentSchema,
  MemberSchema,
  PendantSchema,
  ProviderConfigSchema,
  ReminderSchema,
  SessionSchema,
  WearerProfileSchema,
} from './schemas.js';

describe('AccountSchema', () => {
  it('accepts email account', () => {
    const r = AccountSchema.parse({
      email: 'a@b.com',
      name: 'Priya',
      country: 'IN',
      timezone: 'Asia/Kolkata',
    });
    expect(r.name).toBe('Priya');
  });

  it('rejects bad email', () => {
    expect(() =>
      AccountSchema.parse({ email: 'nope', name: 'X', country: 'IN', timezone: 'UTC' }),
    ).toThrow();
  });
});

describe('WearerProfileSchema', () => {
  it('defaults languages and cardiacImplant', () => {
    const r = WearerProfileSchema.parse({ name: 'Amma', callAs: 'Amma' });
    expect(r.languages).toEqual(['en']);
    expect(r.cardiacImplant).toBe(false);
  });
});

describe('PendantSchema', () => {
  it('accepts SL1-A pendant', () => {
    const r = PendantSchema.parse({
      id: 'p1',
      serial: '7F2A',
      name: 'Svaraa Lite SL1-A-7F2A',
      hardwareModel: 'SL1-A',
      firmwareVersion: '1.0.0',
      batteryPercent: 80,
      connected: true,
      charging: false,
      recording: false,
      micsOff: false,
      wearMode: 'chest',
      lastSpokeAt: null,
    });
    expect(r.storageTotalMb).toBe(128);
  });

  it('rejects battery over 100', () => {
    expect(() =>
      PendantSchema.parse({
        id: 'p1',
        serial: 'x',
        name: 'n',
        hardwareModel: 'SL1-F',
        firmwareVersion: '1',
        batteryPercent: 101,
        connected: true,
        charging: false,
        recording: false,
        micsOff: false,
        lastSpokeAt: null,
      }),
    ).toThrow();
  });
});

describe('ReminderSchema', () => {
  it('defaults language and flags', () => {
    const r = ReminderSchema.parse({
      id: 'r1',
      title: 'Water',
      spokenPreview: 'Drink water',
    });
    expect(r.language).toBe('en');
    expect(r.important).toBe(false);
    expect(r.quietHoursExempt).toBe(false);
  });
});

describe('IncidentSchema', () => {
  it('accepts drill incident', () => {
    const r = IncidentSchema.parse({
      id: 'i1',
      kind: 'drill',
      status: 'active',
      isDrill: true,
      startedAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
    });
    expect(r.kind).toBe('drill');
  });

  it('rejects unknown kind', () => {
    expect(() =>
      IncidentSchema.parse({
        id: 'i1',
        kind: 'alien',
        status: 'active',
        startedAt: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
      }),
    ).toThrow();
  });
});

describe('SessionSchema / ActionItemSchema', () => {
  it('defaults session kind and action status', () => {
    const s = SessionSchema.parse({
      id: 's1',
      startedAt: new Date().toISOString(),
      endedAt: null,
      title: 'Chat',
    });
    expect(s.kind).toBe('conversation');
    const a = ActionItemSchema.parse({ id: 'a1', title: 'Book doctor' });
    expect(a.status).toBe('proposed');
  });
});

describe('MemberSchema / HouseholdSchema / ProviderConfigSchema', () => {
  it('parses member with role', () => {
    const m = MemberSchema.parse({ id: 'm1', name: 'Ravi', role: 'caregiver' });
    expect(m.sosTier).toBe(1);
    expect(m.channels).toEqual(['push']);
  });

  it('parses household', () => {
    const h = HouseholdSchema.parse({
      id: 'h1',
      name: 'Home',
      region: 'IN',
      privacyMode: 'wearer-managed',
    });
    expect(h.onboardingStep).toBe(1);
    expect(h.onboardingComplete).toBe(false);
  });

  it('parses provider config', () => {
    const p = ProviderConfigSchema.parse({ llm: 'sarvam', stt: 'sarvam', tts: 'sarvam' });
    expect(p.managedKeys).toBe(true);
  });
});
