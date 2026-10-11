import { isStaticDemo, staticDemo } from './staticDemo';

const CP = '/cp';
const TENANT = '/tenant';

export type Session = {
  token: string;
  accountId: string;
  tenantId?: string;
  name?: string;
};

function headers(session?: Session | null, json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['content-type'] = 'application/json';
  if (session?.token) h.authorization = `Bearer ${session.token}`;
  if (session?.tenantId) h['x-tenant-id'] = session.tenantId;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const liveApi = {
  requestOtp: (body: { email?: string; phone?: string }) =>
    fetch(`${CP}/auth/otp/request`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(
      (r) => parse<{ ok: boolean; devCode: string }>(r),
    ),

  verifyOtp: (body: {
    email?: string;
    phone?: string;
    code: string;
    name: string;
    country: string;
    timezone: string;
  }) =>
    fetch(`${CP}/auth/otp/verify`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(
      (r) => parse<{ token: string; accountId: string }>(r),
    ),

  provision: (session: Session, body: { region: 'IN' | 'EU' | 'US'; householdName: string }) =>
    fetch(`${CP}/tenants/provision`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify(body),
    }).then((r) => parse<{ tenantId: string; status: string; baseUrl: string }>(r)),

  tenantStatus: (tenantId: string) =>
    fetch(`${CP}/tenants/${tenantId}`).then((r) => parse<{ status: string; region: string }>(r)),

  getToday: (session: Session) =>
    fetch(`${TENANT}/v1/today`, { headers: headers(session, false) }).then((r) => parse(r)),

  getState: (session: Session) =>
    fetch(`${TENANT}/v1/state`, { headers: headers(session, false) }).then((r) => parse(r)),

  patchOnboarding: (session: Session, step: number, data: Record<string, unknown> = {}) =>
    fetch(`${TENANT}/v1/onboarding`, {
      method: 'PATCH',
      headers: headers(session),
      body: JSON.stringify({ step, data }),
    }).then((r) => parse(r)),

  scanMock: (session: Session) =>
    fetch(`${TENANT}/v1/pendant/scan-mock`, { headers: headers(session, false) }).then((r) => parse(r)),

  pairMock: (
    session: Session,
    profile: 'sim-sl1a-chest' | 'sim-sl1a-wrist' | 'sim-sl1f-clipped' | 'sim-sl1f-open-privacy-off',
  ) =>
    fetch(`${TENANT}/v1/pendant/pair-mock`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ profile }),
    }).then((r) => parse(r)),

  confirmPair: (session: Session, code: string) =>
    fetch(`${TENANT}/v1/pendant/confirm-pair`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ code }),
    }).then((r) => parse(r)),

  setWearMode: (session: Session, wearMode: 'chest' | 'wrist' | 'clip') =>
    fetch(`${TENANT}/v1/pendant/wear-mode`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ wearMode }),
    }).then((r) => parse(r)),

  ask: (session: Session, text: string) =>
    fetch(`${TENANT}/v1/companion/ask`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ text }),
    }).then((r) => parse<{ reply: string; tier: number; latencyMs: number }>(r)),

  doPropose: (session: Session, title: string, steps: string[]) =>
    fetch(`${TENANT}/v1/companion/do`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ title, steps }),
    }).then((r) => parse(r)),

  getReminders: (session: Session) =>
    fetch(`${TENANT}/v1/reminders`, { headers: headers(session, false) }).then((r) => parse(r)),

  saveReminders: (session: Session, reminders: unknown[]) =>
    fetch(`${TENANT}/v1/reminders`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ reminders }),
    }).then((r) => parse(r)),

  getIncidents: (session: Session) =>
    fetch(`${TENANT}/v1/incidents`, { headers: headers(session, false) }).then((r) => parse(r)),

  ackIncident: (session: Session, id: string, memberName: string) =>
    fetch(`${TENANT}/v1/incidents/${id}/ack`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ memberName }),
    }).then((r) => parse(r)),

  resolveIncident: (session: Session, id: string, outcome: string) =>
    fetch(`${TENANT}/v1/incidents/${id}/resolve`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ outcome }),
    }).then((r) => parse(r)),

  getRecall: (session: Session) =>
    fetch(`${TENANT}/v1/recall`, { headers: headers(session, false) }).then((r) => parse(r)),

  ingestRecall: (session: Session, text: string) =>
    fetch(`${TENANT}/v1/recall/ingest`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ text }),
    }).then((r) => parse(r)),

  getTodo: (session: Session) =>
    fetch(`${TENANT}/v1/todo`, { headers: headers(session, false) }).then((r) => parse(r)),

  getFamily: (session: Session) =>
    fetch(`${TENANT}/v1/family`, { headers: headers(session, false) }).then((r) => parse(r)),

  inviteFamily: (session: Session, body: { name: string; email?: string; phone?: string; sosTier?: number }) =>
    fetch(`${TENANT}/v1/family/invite`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify(body),
    }).then((r) => parse(r)),

  updateFamilyLadder: (session: Session, order: Array<{ id: string; sosTier: number }>) =>
    fetch(`${TENANT}/v1/family/ladder`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ order }),
    }).then((r) => parse(r)),

  getPrivacy: (session: Session) =>
    fetch(`${TENANT}/v1/privacy`, { headers: headers(session, false) }).then((r) => parse(r)),

  exportPrivacy: (session: Session) =>
    fetch(`${TENANT}/v1/privacy/export`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({}),
    }).then((r) => parse(r)),

  deleteHousehold: (session: Session) =>
    fetch(`${TENANT}/v1/privacy/delete`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({}),
    }).then((r) => parse(r)),

  getNews: (session: Session) =>
    fetch(`${TENANT}/v1/news`, { headers: headers(session, false) }).then((r) => parse(r)),

  getRecite: (session: Session) =>
    fetch(`${TENANT}/v1/recite`, { headers: headers(session, false) }).then((r) => parse(r)),

  getConnections: (session: Session) =>
    fetch(`${TENANT}/v1/connections`, { headers: headers(session, false) }).then((r) => parse(r)),

  getRoutines: (session: Session) =>
    fetch(`${TENANT}/v1/routines`, { headers: headers(session, false) }).then((r) => parse(r)),

  seedDemo: (session: Session) =>
    fetch(`${TENANT}/v1/demo/seed`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({}),
    }).then((r) => parse(r)),

  ensureDemoHousehold: () =>
    fetch(`${TENANT}/v1/demo/ensure`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    }).then((r) => parse<{ tenantId: string }>(r)),

  scenario: (session: Session, scenario: string) =>
    fetch(`${TENANT}/v1/demo/scenario`, {
      method: 'POST',
      headers: headers(session),
      body: JSON.stringify({ scenario }),
    }).then((r) => parse(r)),

  openSse: (session: Session, onEvent: (name: string, data: unknown) => void) => {
    if (!session.tenantId) return () => undefined;
    const es = new EventSource(`${TENANT}/v1/events?tenant=${session.tenantId}`);
    const handler = (name: string) => (ev: MessageEvent) => {
      try {
        onEvent(name, JSON.parse(ev.data));
      } catch {
        /* ignore */
      }
    };
    ['pendant', 'timeline', 'incident', 'schedule', 'ready'].forEach((n) => es.addEventListener(n, handler(n)));
    return () => es.close();
  },
};

/** Live API locally; static in-browser mock on GitHub Pages. */
export const api = (isStaticDemo() ? staticDemo : liveApi) as typeof liveApi;
