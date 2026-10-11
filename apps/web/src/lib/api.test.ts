import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, type Session } from './api';

const session: Session = {
  token: 'tok',
  accountId: 'acc',
  tenantId: 'ten',
  name: 'Priya',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = await impl(url, init);
      return {
        ok: true,
        json: async () => body,
      };
    }),
  );
}

describe('web api client', () => {
  it('requestOtp posts email', async () => {
    mockFetch((url, init) => {
      expect(url).toBe('/cp/auth/otp/request');
      expect(init?.method).toBe('POST');
      return { ok: true, devCode: '123456' };
    });
    const r = await api.requestOtp({ email: 'a@b.com' });
    expect(r.devCode).toBe('123456');
  });

  it('verifyOtp returns token', async () => {
    mockFetch(() => ({ token: 't', accountId: 'a' }));
    const r = await api.verifyOtp({
      email: 'a@b.com',
      code: '123456',
      name: 'P',
      country: 'IN',
      timezone: 'UTC',
    });
    expect(r.token).toBe('t');
  });

  it('provision sends bearer token', async () => {
    mockFetch((url, init) => {
      expect(url).toBe('/cp/tenants/provision');
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer tok');
      return { tenantId: 'ten', status: 'provisioning', baseUrl: 'x' };
    });
    const r = await api.provision(session, { region: 'IN', householdName: 'Home' });
    expect(r.tenantId).toBe('ten');
  });

  it('tenant calls include x-tenant-id', async () => {
    mockFetch((url, init) => {
      expect(url.startsWith('/tenant/')).toBe(true);
      expect((init?.headers as Record<string, string>)['x-tenant-id']).toBe('ten');
      return { ok: true };
    });
    await api.getToday(session);
    await api.getState(session);
    await api.getReminders(session);
    await api.getIncidents(session);
    await api.getRecall(session);
    await api.getTodo(session);
    await api.getFamily(session);
    await api.getPrivacy(session);
    await api.getNews(session);
    await api.getRecite(session);
    await api.getConnections(session);
    await api.getRoutines(session);
  });

  it('pairMock / confirmPair / wearMode / ask / do / scenarios', async () => {
    const calls: string[] = [];
    mockFetch((url) => {
      calls.push(url);
      if (url.includes('pair-mock')) return { pairingCode: '482913', identified: { model: 'SL1-A' } };
      if (url.includes('confirm-pair')) return { ok: true };
      if (url.includes('wear-mode')) return { wearMode: 'wrist' };
      if (url.includes('companion/ask')) return { reply: 'hi', tier: 0, latencyMs: 1 };
      if (url.includes('companion/do')) return { job: { title: 'x' } };
      return {};
    });
    await api.pairMock(session, 'sim-sl1a-chest');
    await api.confirmPair(session, '482 913');
    await api.setWearMode(session, 'wrist');
    await api.ask(session, 'hello');
    await api.doPropose(session, 'Job', ['a']);
    await api.scenario(session, 'sos_drill');
    await api.seedDemo(session);
    await api.ackIncident(session, 'i1', 'Ravi');
    await api.resolveIncident(session, 'i1', 'ok');
    await api.ingestRecall(session, 'text');
    await api.saveReminders(session, []);
    await api.patchOnboarding(session, 2, { region: 'IN' });
    expect(calls.some((c) => c.includes('pair-mock'))).toBe(true);
    expect(calls.some((c) => c.includes('sos_drill') || c.includes('scenario'))).toBe(true);
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        statusText: 'Bad',
        json: async () => ({ error: 'nope' }),
      })),
    );
    await expect(api.getToday(session)).rejects.toThrow('nope');
  });

  it('openSse noops without tenantId', () => {
    const close = api.openSse({ token: 't', accountId: 'a' }, () => undefined);
    expect(typeof close).toBe('function');
    close();
  });

  it('openSse wires EventSource listeners', () => {
    const listeners: Record<string, (ev: MessageEvent) => void> = {};
    class FakeES {
      addEventListener(name: string, fn: (ev: MessageEvent) => void) {
        listeners[name] = fn;
      }
      close = vi.fn();
    }
    vi.stubGlobal('EventSource', FakeES as unknown as typeof EventSource);
    const onEvent = vi.fn();
    const close = api.openSse(session, onEvent);
    listeners.pendant?.(new MessageEvent('pendant', { data: '{"batteryPercent":10}' }));
    expect(onEvent).toHaveBeenCalledWith('pendant', { batteryPercent: 10 });
    close();
  });
});
