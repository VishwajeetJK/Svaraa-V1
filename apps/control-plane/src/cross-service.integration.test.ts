/**
 * Cross-service integration: control-plane + tenant via inject (no network listen).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTenantApp } from '../../tenant/src/app.js';
import { resetTenantsForTests } from '../../tenant/src/store.js';
import { createControlPlaneApp } from './app.js';
import { resetDbForTests } from './db.js';
import { resetOtpRateLimitForTests } from './env.js';

process.env.VITEST = 'true';

describe('control-plane ↔ tenant full household flow', () => {
  let cp: Awaited<ReturnType<typeof createControlPlaneApp>>;
  let tenant: Awaited<ReturnType<typeof createTenantApp>>;

  beforeEach(async () => {
    await resetDbForTests();
    resetOtpRateLimitForTests();
    resetTenantsForTests();
    tenant = await createTenantApp();
    const tenantFetch: typeof fetch = async (input, init) => {
      const url = new URL(String(input));
      const res = await tenant.inject({
        method: (init?.method as 'GET' | 'POST') ?? 'GET',
        url: url.pathname,
        headers: init?.headers as Record<string, string>,
        payload: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      return {
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        json: async () => res.json(),
        text: async () => res.body,
      } as Response;
    };
    cp = await createControlPlaneApp({
      tenantBaseUrl: 'http://tenant.local',
      provisionDelayMs: 10,
      fetchImpl: tenantFetch,
    });
  });

  afterEach(async () => {
    await cp.close();
    await tenant.close();
    await resetDbForTests();
    resetTenantsForTests();
  });

  it('signup → provision → pair both hardware → today → rescue → recall', async () => {
    const otp = await cp
      .inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'flow@test.com' } })
      .then((r) => r.json());
    const session = await cp
      .inject({
        method: 'POST',
        url: '/auth/otp/verify',
        payload: {
          email: 'flow@test.com',
          code: otp.devCode,
          name: 'Priya',
          country: 'IN',
          timezone: 'Asia/Kolkata',
        },
      })
      .then((r) => r.json());

    const prov = await cp
      .inject({
        method: 'POST',
        url: '/tenants/provision',
        headers: { authorization: `Bearer ${session.token}` },
        payload: { region: 'IN', householdName: 'Flow home' },
      })
      .then((r) => r.json());

    await new Promise((r) => setTimeout(r, 40));
    const status = await cp.inject({ method: 'GET', url: `/tenants/${prov.tenantId}` });
    expect(status.json().status).toBe('active');

    const headers = { 'x-tenant-id': prov.tenantId as string, 'content-type': 'application/json' };

    const pairA = await tenant
      .inject({
        method: 'POST',
        url: '/v1/pendant/pair-mock',
        headers,
        payload: { profile: 'sim-sl1a-chest' },
      })
      .then((r) => r.json());
    expect(pairA.identified.model).toBe('SL1-A');

    const pairF = await tenant
      .inject({
        method: 'POST',
        url: '/v1/pendant/pair-mock',
        headers,
        payload: { profile: 'sim-sl1f-clipped' },
      })
      .then((r) => r.json());
    expect(pairF.identified.model).toBe('SL1-F');

    await tenant.inject({
      method: 'POST',
      url: '/v1/demo/scenario',
      headers,
      payload: { scenario: 'fall_checkin' },
    });
    const incidents = await tenant
      .inject({ method: 'GET', url: '/v1/incidents', headers })
      .then((r) => r.json());
    expect(incidents[0].kind).toBe('fall');
    await tenant.inject({
      method: 'POST',
      url: `/v1/incidents/${incidents[0].id}/ack`,
      headers,
      payload: { memberName: 'Priya' },
    });

    await tenant.inject({
      method: 'POST',
      url: '/v1/recall/ingest',
      headers,
      payload: { text: 'Book follow up next week. Take medicine.' },
    });
    await tenant.inject({ method: 'POST', url: '/v1/demo/seed', headers });
    const today = await tenant.inject({ method: 'GET', url: '/v1/today', headers }).then((r) => r.json());
    expect(today.pendant.hardwareModel).toBe('SL1-F');
    expect(today.actionItems.length).toBeGreaterThan(0);

    const ask = await tenant
      .inject({
        method: 'POST',
        url: '/v1/companion/ask',
        headers,
        payload: { text: 'battery please' },
      })
      .then((r) => r.json());
    expect(ask.tier).toBe(0);
  });
});
