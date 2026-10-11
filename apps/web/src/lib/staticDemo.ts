/**
 * In-browser mock for GitHub Pages (no control-plane / tenant servers).
 * Enabled when VITE_STATIC_DEMO=true.
 */
import type { Session } from './api';

type Pendant = {
  id: string;
  serial: string;
  name: string;
  hardwareModel: 'SL1-A' | 'SL1-F';
  firmwareVersion: string;
  batteryPercent: number;
  connected: boolean;
  charging: boolean;
  recording: boolean;
  micsOff: boolean;
  lastSpokeAt: string | null;
};

type Member = {
  id: string;
  name: string;
  role: string;
  sosTier: number;
  verified: boolean;
  email?: string;
};

type Incident = {
  id: string;
  kind: string;
  status: string;
  isDrill: boolean;
  startedAt: string;
  locationLabel?: string;
  batteryPercent?: number;
};

type State = {
  tenantId: string;
  members: Member[];
  pendant: Pendant;
  reminders: Array<{ id: string; title: string; at: string; spokenPreview?: string }>;
  actionItems: Array<{ id: string; title: string; status: string }>;
  timeline: Array<{ id: string; at: string; title: string; detail?: string }>;
  incidents: Incident[];
  sessions: Array<{ id: string; title: string; summary?: string; startedAt: string }>;
  auditLog: Array<{ id: string; at: string; actor: string; action: string }>;
  news: { title: string; summary: string; at: string };
  recite: Array<{ id: string; title: string; tracks: number }>;
  connections: Array<{ id: string; name: string; status: string }>;
  consent: { recordingMode: string; retentionDays: number; audioConsentCaptured: boolean };
  privacyMode: string;
  onboardingStep: number;
  onboardingComplete: boolean;
};

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function defaultState(): State {
  return {
    tenantId: 'demo-household',
    members: [
      { id: 'owner-1', name: 'Demo Host', role: 'owner', sosTier: 0, verified: true, email: 'demo@svaraa.family' },
      { id: 'ravi', name: 'Ravi', role: 'caregiver', sosTier: 1, verified: true },
    ],
    pendant: {
      id: 'mock-7f2a',
      serial: '7F2A',
      name: 'Svaraa Lite SL1-A-7F2A',
      hardwareModel: 'SL1-A',
      firmwareVersion: '1.0.0-mock',
      batteryPercent: 78,
      connected: true,
      charging: false,
      recording: false,
      micsOff: false,
      lastSpokeAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    },
    reminders: [
      {
        id: id(),
        title: 'Evening aarti',
        at: new Date(Date.now() + 3 * 3600_000).toISOString(),
        spokenPreview: 'Amma, time for evening aarti',
      },
      {
        id: id(),
        title: 'Blood pressure tablet',
        at: new Date(Date.now() - 40 * 60_000).toISOString(),
      },
    ],
    actionItems: [
      { id: id(), title: 'Book cab for Dr. Menon on Tue', status: 'proposed' },
      { id: id(), title: 'Buy Amlodipine refill', status: 'proposed' },
    ],
    timeline: [
      { id: id(), at: new Date(Date.now() - 8 * 3600_000).toISOString(), title: 'Morning aarti played on pendant' },
      {
        id: id(),
        at: new Date(Date.now() - 5 * 3600_000).toISOString(),
        title: 'Phone call with Ravi (14 min)',
        detail: 'Ravi visits on 12 Oct; bring the scan report to Dr. Menon.',
      },
      { id: id(), at: new Date(Date.now() - 3 * 3600_000).toISOString(), title: 'Blood-pressure tablet — taken' },
    ],
    incidents: [],
    sessions: [
      { id: id(), title: 'Doctor visit notes', summary: 'Follow-up in two weeks', startedAt: now() },
    ],
    auditLog: [{ id: id(), at: now(), actor: 'system', action: 'Static GitHub Pages demo household ready' }],
    news: {
      title: 'Morning briefing',
      summary: 'Clear skies in Chennai. Family digest ready at 6 pm. Calm mode available.',
      at: now(),
    },
    recite: [
      { id: 'pl1', title: 'Morning mantras', tracks: 12 },
      { id: 'pl2', title: 'Evening bhajans', tracks: 8 },
    ],
    connections: [
      { id: 'calendar', name: 'Calendar', status: 'off' },
      { id: 'health', name: 'Health', status: 'off' },
      { id: 'music', name: 'Music', status: 'off' },
      { id: 'alerts', name: 'SMS / calls', status: 'connected' },
    ],
    consent: { recordingMode: 'on-request', retentionDays: 30, audioConsentCaptured: true },
    privacyMode: 'wearer-managed',
    onboardingStep: 13,
    onboardingComplete: true,
  };
}

let state = defaultState();
let accountId = 'acct-static-demo';

function todaySnapshot() {
  const attention = [];
  if (state.incidents.some((i) => i.status === 'active')) {
    const inc = state.incidents.find((i) => i.status === 'active')!;
    attention.push({
      id: inc.id,
      title: inc.isDrill ? 'SOS drill in progress' : 'Help needed now',
      severity: 'safety' as const,
      cta: 'Open incident',
    });
  }
  const nextReminder = state.reminders
    .filter((r) => new Date(r.at).getTime() > Date.now() - 60_000)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))[0];

  return {
    pendant: state.pendant,
    lastSpokeAt: state.pendant.lastSpokeAt,
    nextReminder: nextReminder ?? null,
    attention,
    actionItems: state.actionItems,
    timeline: state.timeline,
    familyLine: 'Amma is having a quiet morning',
    recording: state.pendant.recording,
    brainJobs: 0,
  };
}

function seed() {
  state.timeline.unshift({
    id: id(),
    at: now(),
    title: 'Demo content refreshed',
    detail: 'Static Pages demo seed',
  });
  return todaySnapshot();
}

export const staticDemo = {
  ensureDemoHousehold: async () => {
    state = defaultState();
    return { tenantId: state.tenantId, today: todaySnapshot() };
  },

  requestOtp: async () => ({ ok: true, devCode: '000000' }),

  verifyOtp: async (body: {
    email?: string;
    phone?: string;
    code: string;
    name: string;
    country: string;
    timezone: string;
  }) => {
    accountId = id();
    return { token: 'static-demo-token', accountId, name: body.name };
  },

  provision: async (_s: Session, body: { region: 'IN' | 'EU' | 'US'; householdName: string }) => {
    state.tenantId = state.tenantId || 'demo-household';
    state.auditLog.unshift({
      id: id(),
      at: now(),
      actor: body.householdName,
      action: 'Household provisioned (static demo)',
    });
    return { tenantId: state.tenantId, status: 'active', baseUrl: '.' };
  },

  tenantStatus: async () => ({ status: 'active', region: 'IN' }),

  getToday: async () => todaySnapshot(),

  getState: async () => ({ ...state, today: todaySnapshot() }),

  patchOnboarding: async (_s: Session, step: number, data: Record<string, unknown>) => {
    state.onboardingStep = step;
    if (data.complete) state.onboardingComplete = true;
    return { ok: true, step };
  },

  scanMock: async () => [{ name: 'Svaraa Lite', model: 'SL1-A' }],

  pairMock: async (
    _s: Session,
    profile: 'sim-sl1a-chest' | 'sim-sl1a-wrist' | 'sim-sl1f-clipped' | 'sim-sl1f-open-privacy-off',
  ) => {
    const isF = profile.includes('sl1f');
    state.pendant.hardwareModel = isF ? 'SL1-F' : 'SL1-A';
    state.pendant.name = `Svaraa Lite ${state.pendant.hardwareModel}-7F2A`;
    state.pendant.connected = true;
    state.pendant.micsOff = profile.includes('privacy');
    return { pendant: state.pendant, pairingCode: '482 913' };
  },

  confirmPair: async () => ({ ok: true }),

  setWearMode: async () => ({ ok: true }),

  ask: async (_s: Session, text: string) => ({
    reply: `(Static demo) I heard: “${text}”. On GitHub Pages the AI Brain is stubbed — use the Guide for product answers.`,
    tier: 0,
    latencyMs: 12,
  }),

  doPropose: async (_s: Session, title: string, _steps: string[]) => ({
    job: { id: id(), title, status: 'needs_ok' },
  }),

  getReminders: async () => state.reminders,
  saveReminders: async (_s: Session, reminders: unknown[]) => {
    state.reminders = reminders as State['reminders'];
    return state.reminders;
  },

  getIncidents: async () => state.incidents,

  ackIncident: async (_s: Session, incidentId: string, memberName: string) => {
    const inc = state.incidents.find((i) => i.id === incidentId);
    if (inc) {
      inc.status = 'acknowledged';
      state.timeline.unshift({
        id: id(),
        at: now(),
        title: `${memberName} is on it`,
        detail: inc.isDrill ? 'DRILL' : undefined,
      });
    }
    return inc;
  },

  resolveIncident: async (_s: Session, incidentId: string, outcome: string) => {
    const inc = state.incidents.find((i) => i.id === incidentId);
    if (inc) inc.status = 'resolved';
    state.timeline.unshift({ id: id(), at: now(), title: `Resolved · ${outcome}` });
    return inc;
  },

  getRecall: async () => state.sessions,
  ingestRecall: async (_s: Session, text: string) => {
    state.sessions.unshift({ id: id(), title: text.slice(0, 48), summary: text, startedAt: now() });
    return state.sessions[0];
  },

  getTodo: async () => state.actionItems,
  getFamily: async () => state.members,

  inviteFamily: async (_s: Session, body: { name: string; email?: string; sosTier?: number }) => {
    const m = {
      id: id(),
      name: body.name,
      email: body.email,
      role: 'caregiver',
      sosTier: body.sosTier ?? 2,
      verified: false,
    };
    state.members.push(m);
    state.auditLog.unshift({ id: id(), at: now(), actor: 'owner', action: `Invited ${body.name}` });
    return m;
  },

  updateFamilyLadder: async (_s: Session, order: Array<{ id: string; sosTier: number }>) => {
    for (const row of order) {
      const m = state.members.find((x) => x.id === row.id);
      if (m) m.sosTier = row.sosTier;
    }
    state.members.sort((a, b) => a.sosTier - b.sosTier);
    return state.members;
  },

  getPrivacy: async () => ({
    consent: state.consent,
    auditLog: state.auditLog,
    privacyMode: state.privacyMode,
  }),

  exportPrivacy: async () => {
    state.auditLog.unshift({ id: id(), at: now(), actor: 'owner', action: 'Exported household data (stub)' });
    return { exportedAt: now(), note: 'Static demo export' };
  },

  deleteHousehold: async () => {
    state.auditLog.unshift({
      id: id(),
      at: now(),
      actor: 'owner',
      action: 'Requested household delete (stub)',
    });
    return { ok: true, status: 'scheduled' };
  },

  getNews: async () => state.news,
  getRecite: async () => state.recite,
  getConnections: async () => state.connections,
  getRoutines: async () => ({
    quietHours: { start: '22:00', end: '06:30', safetyExempt: true },
    ribbon: [
      { at: '07:00', kind: 'briefing', label: 'Morning briefing' },
      { at: '12:00', kind: 'checkin', label: 'Midday check-in' },
      { at: '18:30', kind: 'prayer', label: 'Evening prayer' },
      { at: '20:30', kind: 'digest', label: 'Evening digest' },
    ],
  }),

  seedDemo: async () => seed(),

  scenario: async (_s: Session, scenario: string) => {
    if (scenario === 'sos_drill' || scenario === 'fall_checkin') {
      const inc: Incident = {
        id: id(),
        kind: scenario === 'fall_checkin' ? 'fall' : 'sos',
        status: 'active',
        isDrill: true,
        startedAt: now(),
        locationLabel: 'Home · Chennai',
        batteryPercent: state.pendant.batteryPercent,
      };
      state.incidents.unshift(inc);
      state.timeline.unshift({ id: id(), at: now(), title: 'SOS drill started', detail: 'DRILL' });
    }
    if (scenario === 'low_battery') state.pendant.batteryPercent = 12;
    if (scenario === 'disconnect_2h') state.pendant.connected = false;
    if (scenario === 'fold_loose') {
      state.pendant.hardwareModel = 'SL1-F';
      state.timeline.unshift({ id: id(), at: now(), title: 'Fold sensing: loose clip' });
    }
    if (scenario === 'missed_med') {
      state.timeline.unshift({
        id: id(),
        at: now(),
        title: 'Blood-pressure tablet — missed',
        detail: 'Family notified',
      });
    }
    return todaySnapshot();
  },

  openSse: (_session: Session, onEvent: (name: string, data: unknown) => void) => {
    const t = window.setTimeout(() => onEvent('ready', { static: true }), 50);
    return () => clearTimeout(t);
  },
};

export const isStaticDemo = () => import.meta.env.VITE_STATIC_DEMO === 'true';
