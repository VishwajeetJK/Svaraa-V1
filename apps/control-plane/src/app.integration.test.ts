import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createControlPlaneApp } from './app.js';
import { resetDbForTests } from './db.js';
import { resetOtpRateLimitForTests } from './env.js';

process.env.VITEST = 'true';

describe('control-plane integration', () => {
  let app: Awaited<ReturnType<typeof createControlPlaneApp>>;

  beforeEach(async () => {
    await resetDbForTests();
    resetOtpRateLimitForTests();
    app = await createControlPlaneApp({
      tenantBaseUrl: 'http://tenant.test',
      provisionDelayMs: 20,
      fetchImpl: vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch,
    });
  });

  afterEach(async () => {
    await app.close();
    await resetDbForTests();
  });

  it('health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, service: 'control-plane' });
  });

  it('OTP request requires email or phone', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('OTP request returns dev code for email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/request',
      payload: { email: 'owner@test.com' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.devCode).toMatch(/^\d{6}$/);
    expect(body.cooldownSec).toBe(60);
  });

  it('OTP request accepts phone', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/request',
      payload: { phone: '+919800000001' },
    });
    expect(res.json().devCode).toMatch(/^\d{6}$/);
  });

  it('OTP verify rejects missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: { email: 'a@b.com', code: '123456' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('OTP verify rejects wrong code', async () => {
    await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'a@b.com' } });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: {
        email: 'a@b.com',
        code: '000000',
        name: 'A',
        country: 'IN',
        timezone: 'Asia/Kolkata',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('OTP verify creates account and returns JWT', async () => {
    const otp = await app
      .inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'new@test.com' } })
      .then((r) => r.json());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/otp/verify',
      payload: {
        email: 'new@test.com',
        code: otp.devCode,
        name: 'Priya',
        country: 'IN',
        timezone: 'Asia/Kolkata',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeTruthy();
    expect(res.json().accountId).toBeTruthy();
  });

  it('OTP verify reuses existing account', async () => {
    const otp1 = await app
      .inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'same@test.com' } })
      .then((r) => r.json());
    const first = await app
      .inject({
        method: 'POST',
        url: '/auth/otp/verify',
        payload: {
          email: 'same@test.com',
          code: otp1.devCode,
          name: 'Priya',
          country: 'IN',
          timezone: 'UTC',
        },
      })
      .then((r) => r.json());

    const otp2 = await app
      .inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'same@test.com' } })
      .then((r) => r.json());
    const second = await app
      .inject({
        method: 'POST',
        url: '/auth/otp/verify',
        payload: {
          email: 'same@test.com',
          code: otp2.devCode,
          name: 'Priya',
          country: 'IN',
          timezone: 'UTC',
        },
      })
      .then((r) => r.json());
    expect(second.accountId).toBe(first.accountId);
  });

  async function sessionToken() {
    const otp = await app
      .inject({ method: 'POST', url: '/auth/otp/request', payload: { email: 'prov@test.com' } })
      .then((r) => r.json());
    const verified = await app
      .inject({
        method: 'POST',
        url: '/auth/otp/verify',
        payload: {
          email: 'prov@test.com',
          code: otp.devCode,
          name: 'Owner',
          country: 'IN',
          timezone: 'Asia/Kolkata',
        },
      })
      .then((r) => r.json());
    return verified.token as string;
  }

  it('provision requires auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tenants/provision',
      payload: { region: 'IN', householdName: 'Home' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('provision creates tenant and becomes active', async () => {
    const token = await sessionToken();
    const res = await app.inject({
      method: 'POST',
      url: '/tenants/provision',
      headers: { authorization: `Bearer ${token}` },
      payload: { region: 'EU', householdName: "Amma's household" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('provisioning');
    expect(body.tenantId).toBeTruthy();

    await new Promise((r) => setTimeout(r, 50));
    const status = await app.inject({ method: 'GET', url: `/tenants/${body.tenantId}` });
    expect(status.statusCode).toBe(200);
    expect(status.json().status).toBe('active');
    expect(status.json().region).toBe('EU');
  });

  it('marks tenant failed when bootstrap fetch throws', async () => {
    await app.close();
    await resetDbForTests();
    app = await createControlPlaneApp({
      tenantBaseUrl: 'http://tenant.test',
      provisionDelayMs: 10,
      fetchImpl: vi.fn().mockRejectedValue(new Error('down')) as unknown as typeof fetch,
    });
    const token = await sessionToken();
    const res = await app.inject({
      method: 'POST',
      url: '/tenants/provision',
      headers: { authorization: `Bearer ${token}` },
      payload: { region: 'US', householdName: 'X' },
    });
    await new Promise((r) => setTimeout(r, 40));
    const status = await app.inject({ method: 'GET', url: `/tenants/${res.json().tenantId}` });
    expect(status.json().status).toBe('failed');
  });

  it('tenant get 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/tenants/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('firmware latest', async () => {
    const res = await app.inject({ method: 'GET', url: '/firmware/latest' });
    expect(res.statusCode).toBe(200);
    expect(res.json().version).toBe('1.0.0-mock');
    expect(res.json().min_battery).toBe(50);
  });
});
