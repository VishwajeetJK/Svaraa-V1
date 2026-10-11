import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTenantApp } from './app.js';
import { resetTenantsForTests } from './store.js';

describe('tenant API integration', () => {
  let app: Awaited<ReturnType<typeof createTenantApp>>;
  let tenantId: string;

  beforeEach(async () => {
    resetTenantsForTests();
    app = await createTenantApp();
    tenantId = crypto.randomUUID();
    const boot = await app.inject({
      method: 'POST',
      url: '/internal/bootstrap',
      headers: { 'x-internal-key': 'dev' },
      payload: {
        tenantId,
        region: 'IN',
        householdName: 'API home',
        ownerAccountId: 'owner-1',
        ownerName: 'Priya',
        ownerEmail: 'priya@test.com',
      },
    });
    expect(boot.statusCode).toBe(200);
  });

  afterEach(async () => {
    await app.close();
    resetTenantsForTests();
  });

  const headers = () => ({ 'x-tenant-id': tenantId, 'content-type': 'application/json' });

  it('health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json().service).toBe('tenant');
  });

  it('bootstrap rejects bad internal key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/internal/bootstrap',
      headers: { 'x-internal-key': 'nope' },
      payload: {
        tenantId: 'x',
        region: 'IN',
        householdName: 'x',
        ownerAccountId: 'o',
        ownerName: 'n',
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('household / today / state 404 without tenant', async () => {
    for (const url of ['/v1/household', '/v1/today', '/v1/state']) {
      const res = await app.inject({ method: 'GET', url, headers: { 'x-tenant-id': 'missing' } });
      expect(res.statusCode).toBe(404);
    }
  });

  it('reads household and today', async () => {
    const h = await app.inject({ method: 'GET', url: '/v1/household', headers: headers() });
    expect(h.json().name).toBe('API home');
    const today = await app.inject({ method: 'GET', url: '/v1/today', headers: headers() });
    expect(today.statusCode).toBe(200);
    expect(today.json().attention).toBeDefined();
  });

  it('onboarding patch stores privacy + wearer', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/onboarding',
      headers: headers(),
      payload: {
        step: 4,
        data: {
          privacyMode: 'wearer-managed',
          wearer: { name: 'Amma', callAs: 'Amma', languages: ['hi'], cardiacImplant: true },
        },
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().wearer.callAs).toBe('Amma');
  });

  it('full pendant pair confirm wear-mode flow for SL1-A', async () => {
    const scan = await app.inject({ method: 'GET', url: '/v1/pendant/scan-mock', headers: headers() });
    expect(scan.json().devices.length).toBe(2);

    const pair = await app.inject({
      method: 'POST',
      url: '/v1/pendant/pair-mock',
      headers: headers(),
      payload: { profile: 'sim-sl1a-chest' },
    });
    expect(pair.json().identified.model).toBe('SL1-A');
    const code = pair.json().pairingCode as string;

    const bad = await app.inject({
      method: 'POST',
      url: '/v1/pendant/confirm-pair',
      headers: headers(),
      payload: { code: '000000' },
    });
    expect(bad.statusCode).toBe(401);

    const ok = await app.inject({
      method: 'POST',
      url: '/v1/pendant/confirm-pair',
      headers: headers(),
      payload: { code: code.replace(/(\d{3})(\d{3})/, '$1 $2') },
    });
    expect(ok.json().ok).toBe(true);

    const wear = await app.inject({
      method: 'POST',
      url: '/v1/pendant/wear-mode',
      headers: headers(),
      payload: { wearMode: 'wrist' },
    });
    expect(wear.json().wearMode).toBe('wrist');
  });

  it('rejects wear-mode on SL1-F', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/pendant/pair-mock',
      headers: headers(),
      payload: { profile: 'sim-sl1f-clipped' },
    });
    const wear = await app.inject({
      method: 'POST',
      url: '/v1/pendant/wear-mode',
      headers: headers(),
      payload: { wearMode: 'wrist' },
    });
    expect(wear.statusCode).toBe(400);
  });

  it('reminders push schedule', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/reminders',
      headers: headers(),
      payload: {
        reminders: [
          {
            id: 'r1',
            title: 'Water',
            spokenPreview: 'Water please',
            language: 'en',
            important: false,
            quietHoursExempt: false,
            at: new Date(Date.now() + 7200_000).toISOString(),
          },
        ],
      },
    });
    expect(res.json().slots.length).toBe(1);
    const list = await app.inject({ method: 'GET', url: '/v1/reminders', headers: headers() });
    expect(list.json()).toHaveLength(1);
  });

  it('SOS scenario ack resolve lifecycle', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/demo/scenario',
      headers: headers(),
      payload: { scenario: 'sos_drill' },
    });
    const list = await app.inject({ method: 'GET', url: '/v1/incidents', headers: headers() });
    const id = list.json()[0].id as string;
    const ack = await app.inject({
      method: 'POST',
      url: `/v1/incidents/${id}/ack`,
      headers: headers(),
      payload: { memberName: 'Ravi' },
    });
    expect(ack.json().status).toBe('acknowledged');
    const resolved = await app.inject({
      method: 'POST',
      url: `/v1/incidents/${id}/resolve`,
      headers: headers(),
      payload: { outcome: 'All clear' },
    });
    expect(resolved.json().status).toBe('resolved');
  });

  it('recall ingest creates session and todos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/recall/ingest',
      headers: headers(),
      payload: { text: 'Please book a follow up. Drink more water.' },
    });
    expect(res.json().session.summary).toBeTruthy();
    expect(res.json().actionItems.length).toBeGreaterThan(0);
    const recall = await app.inject({ method: 'GET', url: '/v1/recall', headers: headers() });
    const todo = await app.inject({ method: 'GET', url: '/v1/todo', headers: headers() });
    expect(recall.json().length).toBeGreaterThan(0);
    expect(todo.json().length).toBeGreaterThan(0);
  });

  it('companion ask and do', async () => {
    const ask = await app.inject({
      method: 'POST',
      url: '/v1/companion/ask',
      headers: headers(),
      payload: { text: 'What time is it?' },
    });
    expect(ask.json().tier).toBe(0);
    const doit = await app.inject({
      method: 'POST',
      url: '/v1/companion/do',
      headers: headers(),
      payload: { title: 'Send prayer time', steps: ['Confirm', 'Push'] },
    });
    expect(doit.json().job.status).toBe('needs_ok');
    expect(doit.json().actions).toContain('Do it');
  });

  it('lifestyle endpoints', async () => {
    await app.inject({ method: 'POST', url: '/v1/demo/seed', headers: headers() });
    for (const url of [
      '/v1/family',
      '/v1/privacy',
      '/v1/news',
      '/v1/recite',
      '/v1/connections',
      '/v1/routines',
    ]) {
      const res = await app.inject({ method: 'GET', url, headers: headers() });
      expect(res.statusCode).toBe(200);
    }
    expect((await app.inject({ method: 'GET', url: '/v1/routines', headers: headers() })).json().quietHours.safetyExempt).toBe(
      true,
    );
  });

  it('accepts tenant id from query string', async () => {
    const res = await app.inject({ method: 'GET', url: `/v1/household?tenant=${tenantId}` });
    expect(res.statusCode).toBe(200);
  });

  it('confirm-pair without prior pair returns 400', async () => {
    const fresh = crypto.randomUUID();
    await app.inject({
      method: 'POST',
      url: '/internal/bootstrap',
      headers: { 'x-internal-key': 'dev' },
      payload: {
        tenantId: fresh,
        region: 'IN',
        householdName: 'x',
        ownerAccountId: 'o',
        ownerName: 'n',
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/pendant/confirm-pair',
      headers: { 'x-tenant-id': fresh, 'content-type': 'application/json' },
      payload: { code: '123456' },
    });
    expect(res.statusCode).toBe(400);
  });
});
