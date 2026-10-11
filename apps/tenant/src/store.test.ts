import { afterEach, describe, expect, it } from 'vitest';
import {
  acknowledgeIncident,
  applyPendantEvent,
  bootstrapTenant,
  exportHousehold,
  getTenant,
  injectScenario,
  inviteFamilyMember,
  pairMockPendant,
  patchOnboarding,
  pushSchedule,
  requestDeleteHousehold,
  requireTenant,
  resetTenantsForTests,
  resolveIncident,
  seedDemoContent,
  subscribeSse,
  todaySnapshot,
  updateSosLadder,
} from './store.js';

function boot(id = crypto.randomUUID()) {
  return bootstrapTenant({
    tenantId: id,
    region: 'IN',
    householdName: 'Test home',
    ownerAccountId: 'owner-1',
    ownerName: 'Priya',
    ownerEmail: 'priya@test.com',
  });
}

afterEach(() => {
  resetTenantsForTests();
});

describe('tenant store', () => {
  it('bootstrap creates owner member and audit', () => {
    const state = boot('t1');
    expect(state.household.id).toBe('t1');
    expect(state.members[0].role).toBe('owner');
    expect(state.auditLog[0].action).toMatch(/provisioned/i);
    expect(getTenant('t1')).toBeTruthy();
  });

  it('requireTenant throws 404-ish error', () => {
    expect(() => requireTenant('missing')).toThrow(/tenant not found/);
  });

  it('patchOnboarding advances step and stores wearer/provider/consent', () => {
    boot('t2');
    patchOnboarding('t2', 4, {
      privacyMode: 'family-managed',
      wearer: { name: 'Amma', callAs: 'Amma', languages: ['en'], cardiacImplant: false },
      gatewayReady: true,
      provider: { llm: 'sarvam', stt: 'sarvam', tts: 'sarvam', managedKeys: true },
      consent: { recordingMode: 'on-request', retentionDays: 30, audioConsentCaptured: true },
      members: [
        {
          id: 'c1',
          name: 'Ravi',
          role: 'caregiver',
          sosTier: 1,
          channels: ['push'],
          verified: true,
        },
      ],
      reminders: [
        {
          id: 'r1',
          title: 'Meds',
          spokenPreview: 'Medicine time',
          language: 'en',
          important: true,
          quietHoursExempt: false,
          at: new Date(Date.now() + 3600_000).toISOString(),
        },
      ],
      deferred: ['music'],
      complete: true,
    });
    const t = requireTenant('t2');
    expect(t.state.onboarding.step).toBe(4);
    expect(t.state.household.privacyMode).toBe('family-managed');
    expect(t.state.wearer?.callAs).toBe('Amma');
    expect(t.state.provider?.llm).toBe('sarvam');
    expect(t.state.consent.audioConsentCaptured).toBe(true);
    expect(t.state.members.some((m) => m.id === 'c1')).toBe(true);
    expect(t.state.schedule?.slots.length).toBeGreaterThan(0);
    expect(t.state.onboarding.complete).toBe(true);
    expect(t.state.onboarding.deferred).toContain('music');
  });

  it('pairMockPendant auto-identifies SL1-A and SL1-F', () => {
    boot('ta');
    const a = pairMockPendant('ta', 'sim-sl1a-wrist');
    expect(a.identified.model).toBe('SL1-A');
    expect(a.pendant?.wearMode).toBe('wrist');
    expect(a.pairingCode).toBeTruthy();

    boot('tf');
    const f = pairMockPendant('tf', 'sim-sl1f-clipped');
    expect(f.identified.model).toBe('SL1-F');
    expect(f.pendant?.foldState).toBe('clipped');
  });

  it('applyPendantEvent updates battery/recording/mics/fold', () => {
    boot('te');
    pairMockPendant('te', 'sim-sl1f-clipped');
    applyPendantEvent('te', {
      id: '1',
      kind: 'battery',
      at: new Date().toISOString(),
      payload: { percent: 33, charging: true },
    });
    applyPendantEvent('te', {
      id: '2',
      kind: 'recording_started',
      at: new Date().toISOString(),
    });
    applyPendantEvent('te', {
      id: '3',
      kind: 'privacy_slider',
      at: new Date().toISOString(),
      payload: { micsOff: true },
    });
    applyPendantEvent('te', {
      id: '4',
      kind: 'fold_state_changed',
      at: new Date().toISOString(),
      payload: { foldState: 'open' },
    });
    const p = requireTenant('te').state.pendant!;
    expect(p.batteryPercent).toBe(33);
    expect(p.charging).toBe(true);
    expect(p.recording).toBe(true);
    expect(p.micsOff).toBe(true);
    expect(p.foldState).toBe('open');
  });

  it('SOS during onboarding step 13 creates drill incident', () => {
    boot('td');
    pairMockPendant('td', 'sim-sl1a-chest');
    patchOnboarding('td', 13, {});
    applyPendantEvent('td', {
      id: 'sos',
      kind: 'button_hold_sos',
      at: new Date().toISOString(),
    });
    const inc = requireTenant('td').state.incidents[0];
    expect(inc.isDrill).toBe(true);
    expect(inc.kind).toBe('drill');
  });

  it('fall after onboarding creates fall incident', () => {
    boot('tf2');
    pairMockPendant('tf2', 'sim-sl1a-chest');
    patchOnboarding('tf2', 13, { complete: true });
    applyPendantEvent('tf2', {
      id: 'fall',
      kind: 'fall_hard',
      at: new Date().toISOString(),
    });
    expect(requireTenant('tf2').state.incidents[0].kind).toBe('fall');
    expect(requireTenant('tf2').state.incidents[0].isDrill).toBe(false);
  });

  it('acknowledge and resolve incident', () => {
    boot('ti');
    pairMockPendant('ti', 'sim-sl1a-chest');
    applyPendantEvent('ti', { id: 's', kind: 'button_hold_sos', at: new Date().toISOString() });
    const id = requireTenant('ti').state.incidents[0].id;
    const ack = acknowledgeIncident('ti', id, 'Ravi');
    expect(ack.status).toBe('acknowledged');
    expect(ack.acknowledgedAt).toBeTruthy();
    const resolved = resolveIncident('ti', id, 'All clear');
    expect(resolved.status).toBe('resolved');
    expect(resolved.notes).toBe('All clear');
  });

  it('todaySnapshot includes attention for deferred and offline', () => {
    boot('tt');
    pairMockPendant('tt', 'sim-sl1a-chest');
    patchOnboarding('tt', 8, { deferred: ['recording-consent'] });
    requireTenant('tt').state.pendant!.connected = false;
    const snap = todaySnapshot('tt');
    expect(snap.attention.some((a) => a.id === 'recording-consent')).toBe(true);
    expect(snap.attention.some((a) => a.id === 'offline')).toBe(true);
  });

  it('pushSchedule compiles reminders', () => {
    boot('ts');
    requireTenant('ts').state.reminders = [
      {
        id: 'r1',
        title: 'Water',
        spokenPreview: 'Water',
        language: 'en',
        important: false,
        quietHoursExempt: false,
        at: new Date(Date.now() + 3600_000).toISOString(),
      },
    ];
    const schedule = pushSchedule('ts');
    expect(schedule.slots).toHaveLength(1);
    expect(schedule.pushedAt).toBeTruthy();
  });

  it('seedDemoContent fills sessions and news', () => {
    boot('seed');
    seedDemoContent('seed');
    const t = requireTenant('seed');
    expect(t.state.sessions.length).toBeGreaterThan(0);
    expect(t.state.actionItems.length).toBeGreaterThan(0);
    expect(t.state.newsBriefing?.title).toMatch(/briefing/i);
  });

  it('inviteFamilyMember + SOS ladder + privacy stubs audit', () => {
    boot('fam');
    const invited = inviteFamilyMember('fam', { name: 'Ravi', email: 'ravi@example.com', sosTier: 2 });
    expect(invited.verified).toBe(false);
    const owner = requireTenant('fam').state.members[0];
    updateSosLadder('fam', [
      { id: invited.id, sosTier: 0 },
      { id: owner.id, sosTier: 1 },
    ]);
    expect(requireTenant('fam').state.members[0].id).toBe(invited.id);
    exportHousehold('fam');
    requestDeleteHousehold('fam');
    const actions = requireTenant('fam').state.auditLog.map((a) => a.action).join(' ');
    expect(actions).toMatch(/Invited Ravi/i);
    expect(actions).toMatch(/SOS ladder/i);
    expect(actions).toMatch(/Exported/i);
    expect(actions).toMatch(/delete/i);
  });

  it('injectScenario missed_med adds occurrence', async () => {
    boot('sc');
    await injectScenario('sc', 'missed_med');
    expect(requireTenant('sc').state.occurrences[0].status).toBe('missed');
  });

  it('injectScenario sos_drill creates incident via sim', async () => {
    boot('sc2');
    await injectScenario('sc2', 'sos_drill');
    expect(requireTenant('sc2').state.incidents.length).toBeGreaterThan(0);
  });

  it('SSE subscribe receives broadcast', () => {
    boot('sse');
    const chunks: string[] = [];
    const unsub = subscribeSse('sse', (c) => chunks.push(c));
    pairMockPendant('sse', 'sim-sl1a-chest');
    expect(chunks.some((c) => c.includes('event: timeline'))).toBe(true);
    applyPendantEvent('sse', {
      id: 'b',
      kind: 'battery',
      at: new Date().toISOString(),
      payload: { percent: 40 },
    });
    expect(chunks.some((c) => c.includes('event: pendant'))).toBe(true);
    unsub();
  });
});
