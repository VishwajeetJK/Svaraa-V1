import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTenantApp } from './app.js';
import { resetTenantsForTests } from './store.js';

/**
 * End-to-end onboarding flow through tenant APIs (13 PRD steps worth of data).
 */
describe('13-step onboarding flow', () => {
  let app: Awaited<ReturnType<typeof createTenantApp>>;
  let tenantId: string;
  const h = () => ({ 'x-tenant-id': tenantId, 'content-type': 'application/json' });

  beforeEach(async () => {
    resetTenantsForTests();
    app = await createTenantApp();
    tenantId = crypto.randomUUID();
    await app.inject({
      method: 'POST',
      url: '/internal/bootstrap',
      headers: { 'x-internal-key': 'dev' },
      payload: {
        tenantId,
        region: 'IN',
        householdName: "Amma's household",
        ownerAccountId: 'owner',
        ownerName: 'Priya',
      },
    });
  });

  afterEach(async () => {
    await app.close();
    resetTenantsForTests();
  });

  it('walks family setup path including SL1-F auto-id and SOS drill', async () => {
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: { step: 3, data: { privacyMode: 'wearer-managed' } },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 4,
        data: {
          wearer: {
            name: 'Amma',
            callAs: 'Amma',
            languages: ['en', 'ta'],
            address: 'Chennai',
            cardiacImplant: false,
          },
        },
      },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: { step: 5, data: { gatewayReady: true } },
    });

    const pair = await app
      .inject({
        method: 'POST',
        url: '/v1/pendant/pair-mock',
        headers: h(),
        payload: { profile: 'sim-sl1f-clipped' },
      })
      .then((r) => r.json());
    expect(pair.identified.model).toBe('SL1-F');

    await app.inject({
      method: 'POST',
      url: '/v1/pendant/confirm-pair',
      headers: h(),
      payload: { code: pair.pairingCode },
    });

    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 7,
        data: { provider: { llm: 'sarvam', stt: 'sarvam', tts: 'sarvam', managedKeys: true } },
      },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 8,
        data: {
          consent: {
            recordingMode: 'on-request',
            retentionDays: 30,
            audioConsentCaptured: true,
            sharingLevel: 'family',
          },
        },
      },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 9,
        data: {
          members: [
            {
              id: 'c1',
              name: 'Ravi',
              phone: '+9198',
              role: 'caregiver',
              sosTier: 1,
              channels: ['push', 'sms'],
              verified: true,
            },
            {
              id: 'c2',
              name: 'Meera',
              phone: '+9199',
              role: 'caregiver',
              sosTier: 2,
              channels: ['push'],
              verified: true,
            },
          ],
        },
      },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 10,
        data: {
          reminders: [
            {
              id: 'r1',
              title: 'Meds',
              spokenPreview: 'Amma, medicine',
              language: 'en',
              important: true,
              quietHoursExempt: false,
              at: new Date(Date.now() + 3600_000).toISOString(),
            },
          ],
        },
      },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: { step: 12, data: { deferred: [] } },
    });

    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: { step: 13 },
    });
    await app.inject({
      method: 'POST',
      url: '/v1/demo/scenario',
      headers: h(),
      payload: { scenario: 'sos_drill' },
    });
    const incidents = await app
      .inject({ method: 'GET', url: '/v1/incidents', headers: h() })
      .then((r) => r.json());
    expect(incidents[0].isDrill).toBe(true);
    await app.inject({
      method: 'POST',
      url: `/v1/incidents/${incidents[0].id}/ack`,
      headers: h(),
      payload: { memberName: 'Priya' },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: { step: 13, data: { complete: true } },
    });
    await app.inject({ method: 'POST', url: '/v1/demo/seed', headers: h() });

    const state = await app.inject({ method: 'GET', url: '/v1/state', headers: h() }).then((r) => r.json());
    expect(state.household.onboardingComplete).toBe(true);
    expect(state.pendant.hardwareModel).toBe('SL1-F');
    expect(state.members.length).toBeGreaterThanOrEqual(3);
    expect(state.reminders.length).toBeGreaterThan(0);
    expect(state.provider.llm).toBe('sarvam');

    const today = await app.inject({ method: 'GET', url: '/v1/today', headers: h() }).then((r) => r.json());
    expect(today.pendant.hardwareModel).toBe('SL1-F');
  });

  it('walks SL1-A path with deferred consent appearing on Today', async () => {
    const pair = await app
      .inject({
        method: 'POST',
        url: '/v1/pendant/pair-mock',
        headers: h(),
        payload: { profile: 'sim-sl1a-wrist' },
      })
      .then((r) => r.json());
    expect(pair.identified.model).toBe('SL1-A');
    await app.inject({
      method: 'POST',
      url: '/v1/pendant/wear-mode',
      headers: h(),
      payload: { wearMode: 'wrist' },
    });
    await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: h(),
      payload: {
        step: 8,
        data: {
          consent: { recordingMode: 'on-request', audioConsentCaptured: false, retentionDays: 30 },
          deferred: ['recording-consent'],
        },
      },
    });
    const today = await app.inject({ method: 'GET', url: '/v1/today', headers: h() }).then((r) => r.json());
    expect(today.attention.some((a: { id: string }) => a.id === 'recording-consent')).toBe(true);
    expect(today.pendant.wearMode).toBe('wrist');
  });
});
