import type {
  ActionItem,
  Household,
  Incident,
  Member,
  Pendant,
  ProviderConfig,
  Reminder,
  Session,
  TimelineEvent,
  WearerProfile,
  TodaySnapshot,
} from '@svaraa/shared';
import { compileSchedule, type ScheduleSnapshot } from '@svaraa/protocol';
import { MockPendantSimulator, type MockProfile, runScenario, type ScenarioId } from '@svaraa/mock-pendant';
import { loadPersistedTenants, savePersistedTenants } from './persist.js';

export type TenantState = {
  household: Household;
  members: Member[];
  wearer: WearerProfile | null;
  pendant: Pendant | null;
  reminders: Reminder[];
  occurrences: Array<{ id: string; reminderId: string; at: string; status: 'due' | 'taken' | 'missed' }>;
  sessions: Session[];
  actionItems: ActionItem[];
  incidents: Incident[];
  timeline: TimelineEvent[];
  provider: ProviderConfig | null;
  schedule: ScheduleSnapshot | null;
  consent: {
    recordingMode: 'on-request' | 'continuous';
    retentionDays: number;
    audioConsentCaptured: boolean;
    sharingLevel: 'wearer-only' | 'family' | 'care-circle';
  };
  onboarding: {
    step: number;
    complete: boolean;
    deferred: string[];
    pairingCode?: string;
    identifiedModel?: string;
    gatewayReady: boolean;
  };
  newsBriefing: { id: string; title: string; summary: string; at: string } | null;
  recitePlaylists: Array<{ id: string; title: string; tracks: number }>;
  connections: Array<{ id: string; name: string; status: 'connected' | 'needs_auth' | 'off' }>;
  auditLog: Array<{ id: string; at: string; actor: string; action: string }>;
  companionJobs: Array<{ id: string; title: string; status: 'working' | 'needs_ok' | 'done' }>;
  brainAllowanceUsed: number;
};

const tenants = new Map<string, { state: TenantState; sim: MockPendantSimulator | null }>();

function hydrateFromDisk() {
  const loaded = loadPersistedTenants();
  for (const [id, state] of Object.entries(loaded)) {
    tenants.set(id, { state, sim: null });
  }
}
hydrateFromDisk();

function persist() {
  savePersistedTenants(tenants);
}

function emptyState(partial: Partial<Household> & { id: string; region: Household['region'] }): TenantState {
  return {
    household: {
      id: partial.id,
      name: partial.name ?? 'Our household',
      region: partial.region,
      privacyMode: partial.privacyMode ?? 'wearer-managed',
      onboardingStep: 1,
      onboardingComplete: false,
    },
    members: [],
    wearer: null,
    pendant: null,
    reminders: [],
    occurrences: [],
    sessions: [],
    actionItems: [],
    incidents: [],
    timeline: [],
    provider: null,
    schedule: null,
    consent: {
      recordingMode: 'on-request',
      retentionDays: 30,
      audioConsentCaptured: false,
      sharingLevel: 'family',
    },
    onboarding: { step: 1, complete: false, deferred: [], gatewayReady: false },
    newsBriefing: null,
    recitePlaylists: [
      { id: 'pl1', title: 'Morning mantras', tracks: 12 },
      { id: 'pl2', title: 'Evening bhajans', tracks: 8 },
    ],
    connections: [
      { id: 'calendar', name: 'Calendar', status: 'off' },
      { id: 'health', name: 'Health', status: 'off' },
      { id: 'music', name: 'Music', status: 'off' },
      { id: 'alerts', name: 'SMS / calls', status: 'off' },
      { id: 'home', name: 'Home hub', status: 'off' },
    ],
    auditLog: [],
    companionJobs: [],
    brainAllowanceUsed: 12,
  };
}

export function bootstrapTenant(input: {
  tenantId: string;
  region: Household['region'];
  householdName: string;
  ownerAccountId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
}) {
  const state = emptyState({
    id: input.tenantId,
    region: input.region,
    name: input.householdName,
  });
  state.members.push({
    id: input.ownerAccountId,
    name: input.ownerName,
    email: input.ownerEmail,
    phone: input.ownerPhone,
    role: 'owner',
    sosTier: 0,
    channels: ['push', 'sms', 'call'],
    verified: true,
  });
  state.auditLog.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: input.ownerName,
    action: 'Household provisioned',
  });
  tenants.set(input.tenantId, { state, sim: null });
  persist();
  return state;
}

export function getTenant(tenantId: string) {
  return tenants.get(tenantId);
}

export function requireTenant(tenantId: string) {
  const t = tenants.get(tenantId);
  if (!t) throw Object.assign(new Error('tenant not found'), { statusCode: 404 });
  return t;
}

export function patchOnboarding(tenantId: string, step: number, data: Record<string, unknown> = {}) {
  const t = requireTenant(tenantId);
  t.state.onboarding.step = step;
  t.state.household.onboardingStep = step;

  if (data.privacyMode) {
    t.state.household.privacyMode = data.privacyMode as Household['privacyMode'];
    t.state.auditLog.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      actor: 'owner',
      action: `Privacy mode set to ${data.privacyMode}`,
    });
  }
  if (data.wearer) t.state.wearer = data.wearer as WearerProfile;
  if (data.gatewayReady) t.state.onboarding.gatewayReady = true;
  if (data.provider) t.state.provider = data.provider as ProviderConfig;
  if (data.consent) t.state.consent = { ...t.state.consent, ...(data.consent as object) };
  if (data.deferred) t.state.onboarding.deferred = data.deferred as string[];
  if (Array.isArray(data.members)) {
    for (const m of data.members as Member[]) {
      if (!t.state.members.find((x) => x.id === m.id)) t.state.members.push(m);
    }
  }
  if (Array.isArray(data.reminders)) {
    t.state.reminders = data.reminders as Reminder[];
    pushSchedule(tenantId);
  }
  if (data.complete) {
    t.state.onboarding.complete = true;
    t.state.household.onboardingComplete = true;
  }
  persist();
  return t.state;
}

export function pairMockPendant(tenantId: string, profile: MockProfile = 'sim-sl1a-chest') {
  const t = requireTenant(tenantId);
  const sim = new MockPendantSimulator(profile);
  sim.connect();
  const identified = sim.identify();
  const st = sim.getState();
  t.sim = sim;
  t.state.onboarding.pairingCode = st.pairingCode;
  t.state.onboarding.identifiedModel = identified.model;
  t.state.pendant = {
    id: st.id,
    serial: st.serial,
    name: st.name,
    hardwareModel: identified.model,
    firmwareVersion: st.firmwareVersion,
    batteryPercent: st.batteryPercent,
    connected: true,
    charging: st.charging,
    recording: st.recording,
    micsOff: st.micsOff,
    wearMode: st.wearMode,
    foldState: st.foldState,
    lastSpokeAt: new Date().toISOString(),
    storageUsedMb: 2.4,
    storageTotalMb: 128,
  };
  sim.onEvent((evt) => {
    applyPendantEvent(tenantId, evt);
  });
  sim.startIdleFeed();
  addTimeline(tenantId, 'pendant_paired', `Paired ${identified.model}`, `Auto-identified with ${identified.confidence} confidence`);
  persist();
  return { pendant: t.state.pendant, identified, pairingCode: st.pairingCode };
}

export function applyPendantEvent(tenantId: string, evt: { id: string; kind: string; at: string; payload?: Record<string, unknown> }) {
  const t = requireTenant(tenantId);
  const p = t.state.pendant;
  if (!p) return;

  if (evt.kind === 'battery') {
    p.batteryPercent = Number(evt.payload?.percent ?? p.batteryPercent);
    p.charging = Boolean(evt.payload?.charging ?? p.charging);
  }
  if (evt.kind === 'charging') p.charging = true;
  if (evt.kind === 'recording_started') p.recording = true;
  if (evt.kind === 'recording_stopped') p.recording = false;
  if (evt.kind === 'mic_mute' || evt.kind === 'privacy_slider') p.micsOff = Boolean(evt.payload?.micsOff);
  if (evt.kind === 'fold_state_changed' && evt.payload?.foldState) {
    p.foldState = evt.payload.foldState as Pendant['foldState'];
  }
  if (evt.kind === 'wear_mode_changed' && evt.payload?.wearMode) {
    p.wearMode = evt.payload.wearMode as Pendant['wearMode'];
  }
  if (evt.kind === 'button_single') {
    p.lastSpokeAt = evt.at;
    t.state.companionJobs.unshift({
      id: crypto.randomUUID(),
      title: 'Listening…',
      status: 'working',
    });
  }
  if (evt.kind === 'button_hold_sos' || evt.kind === 'fall_hard') {
    const isDrill = t.state.onboarding.step === 13 && !t.state.onboarding.complete;
    const incident: Incident = {
      id: crypto.randomUUID(),
      kind: isDrill ? 'drill' : evt.kind === 'fall_hard' ? 'fall' : 'sos',
      status: 'active',
      isDrill,
      startedAt: evt.at,
      acknowledgedAt: null,
      resolvedAt: null,
      locationLabel: t.state.wearer?.address || 'Home',
      batteryPercent: p.batteryPercent,
    };
    t.state.incidents.unshift(incident);
    addTimeline(tenantId, incident.kind, isDrill ? 'SOS drill started' : 'Help requested', incident.locationLabel);
  }
  if (evt.kind === 'came_loose' || (evt.kind === 'fold_state_changed' && evt.payload?.foldState === 'open')) {
    addTimeline(tenantId, 'came_loose', 'Pendant may have come loose', 'Check fold / wear');
  }

  broadcast(tenantId, 'pendant', p);
  broadcast(tenantId, 'timeline', t.state.timeline.slice(0, 40));
}

function addTimeline(tenantId: string, kind: string, title: string, detail?: string) {
  const t = requireTenant(tenantId);
  t.state.timeline.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind,
    title,
    detail,
  });
  broadcast(tenantId, 'timeline', t.state.timeline.slice(0, 40));
}

export function pushSchedule(tenantId: string) {
  const t = requireTenant(tenantId);
  const withAts = t.state.reminders.map((r, i) => ({
    id: r.id,
    at: r.at ?? new Date(Date.now() + (i + 1) * 3600_000).toISOString(),
    important: r.important,
    spokenPreview: r.spokenPreview,
  }));
  const next = compileSchedule(withAts);
  t.state.schedule = { ...next, pushedAt: new Date().toISOString() };
  broadcast(tenantId, 'schedule', t.state.schedule);
  return t.state.schedule;
}

export function todaySnapshot(tenantId: string): TodaySnapshot {
  const t = requireTenant(tenantId);
  const nextReminder = t.state.reminders[0] ?? null;
  const attention: TodaySnapshot['attention'] = [];
  const active = t.state.incidents.find((i) => i.status === 'active');
  if (active) {
    attention.push({
      id: active.id,
      title: active.isDrill ? 'SOS drill in progress' : 'Help needed now',
      cta: 'Open incident',
      severity: 'safety',
    });
  }
  if (t.state.pendant && !t.state.pendant.connected) {
    attention.push({
      id: 'offline',
      title: 'Pendant not connected',
      cta: 'View status',
      severity: 'attention',
    });
  }
  for (const d of t.state.onboarding.deferred) {
    attention.push({ id: d, title: `Finish: ${d}`, cta: 'Continue', severity: 'info' });
  }
  const wearerName = t.state.wearer?.callAs || t.state.wearer?.name || 'Amma';
  return {
    pendant: t.state.pendant,
    lastSpokeAt: t.state.pendant?.lastSpokeAt ?? null,
    nextReminder,
    attention,
    actionItems: t.state.actionItems.filter((a) => a.status !== 'done' && a.status !== 'dismissed'),
    timeline: t.state.timeline.slice(0, 30),
    familyLine: `${wearerName} is having a quiet morning`,
    recording: Boolean(t.state.pendant?.recording),
    brainJobs: t.state.companionJobs.filter((j) => j.status === 'working').length,
  };
}

export function inviteFamilyMember(
  tenantId: string,
  input: { name: string; email?: string; phone?: string; sosTier?: number },
) {
  const t = requireTenant(tenantId);
  const member = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: 'caregiver' as const,
    sosTier: input.sosTier ?? 1,
    channels: ['push', 'sms'] as Array<'push' | 'sms' | 'call'>,
    verified: false,
  };
  t.state.members.push(member);
  t.state.auditLog.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: 'owner',
    action: `Invited ${input.name} (pending verify)`,
  });
  persist();
  return member;
}

export function updateSosLadder(tenantId: string, order: Array<{ id: string; sosTier: number }>) {
  const t = requireTenant(tenantId);
  for (const row of order) {
    const m = t.state.members.find((x) => x.id === row.id);
    if (m) m.sosTier = Math.max(0, Math.min(3, row.sosTier));
  }
  t.state.members.sort((a, b) => a.sosTier - b.sosTier);
  t.state.auditLog.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: 'owner',
    action: 'Updated SOS ladder order',
  });
  persist();
  return t.state.members;
}

export function exportHousehold(tenantId: string) {
  const t = requireTenant(tenantId);
  t.state.auditLog.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: 'owner',
    action: 'Exported household data (stub)',
  });
  persist();
  return {
    exportedAt: new Date().toISOString(),
    household: t.state.household,
    members: t.state.members,
    consent: t.state.consent,
    note: 'V1 stub export — full archive ships with production storage.',
  };
}

export function requestDeleteHousehold(tenantId: string) {
  const t = requireTenant(tenantId);
  t.state.auditLog.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: 'owner',
    action: 'Requested household delete (stub — not purged in mock)',
  });
  persist();
  return { ok: true, status: 'scheduled', note: 'Deletion queued; mock keeps data for demos.' };
}

export function acknowledgeIncident(tenantId: string, incidentId: string, memberName: string) {
  const t = requireTenant(tenantId);
  const inc = t.state.incidents.find((i) => i.id === incidentId);
  if (!inc) throw Object.assign(new Error('incident not found'), { statusCode: 404 });
  inc.status = 'acknowledged';
  inc.acknowledgedAt = new Date().toISOString();
  addTimeline(tenantId, 'ack', `${memberName} is on it`, inc.isDrill ? 'DRILL' : undefined);
  broadcast(tenantId, 'incident', inc);
  return inc;
}

export function resolveIncident(tenantId: string, incidentId: string, outcome: string) {
  const t = requireTenant(tenantId);
  const inc = t.state.incidents.find((i) => i.id === incidentId);
  if (!inc) throw Object.assign(new Error('incident not found'), { statusCode: 404 });
  inc.status = 'resolved';
  inc.resolvedAt = new Date().toISOString();
  inc.notes = outcome;
  broadcast(tenantId, 'incident', inc);
  return inc;
}

export function injectScenario(tenantId: string, scenario: ScenarioId) {
  const t = requireTenant(tenantId);
  if (!t.sim) pairMockPendant(tenantId);
  const sim = requireTenant(tenantId).sim!;
  if (scenario === 'missed_med') {
    const rem = t.state.reminders[0] ?? {
      id: crypto.randomUUID(),
      title: 'Blood pressure tablet',
      spokenPreview: 'Amma, time for your blood pressure tablet',
      language: 'en',
      important: true,
      at: new Date(Date.now() - 35 * 60_000).toISOString(),
    };
    if (!t.state.reminders[0]) t.state.reminders.unshift(rem);
    t.state.occurrences.unshift({
      id: crypto.randomUUID(),
      reminderId: rem.id,
      at: rem.at!,
      status: 'missed',
    });
    addTimeline(tenantId, 'missed_med', 'Missed important medicine', 'Family notified at T+30 min');
  }
  return runScenario(sim, scenario);
}

export function seedDemoContent(tenantId: string) {
  const t = requireTenant(tenantId);
  const sessionId = crypto.randomUUID();
  t.state.sessions.unshift({
    id: sessionId,
    startedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    endedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    title: 'Call with Dr. Mehta',
    summary: 'Follow up in two weeks. Continue current dose. Drink more water.',
    kind: 'doctor',
    actionItemIds: [],
  });
  const ai: ActionItem = {
    id: crypto.randomUUID(),
    title: 'Book follow-up with Dr. Mehta',
    status: 'proposed',
    sessionId,
  };
  t.state.actionItems.unshift(ai);
  t.state.sessions[0].actionItemIds = [ai.id];
  t.state.newsBriefing = {
    id: crypto.randomUUID(),
    title: 'Morning briefing',
    summary: 'Clear skies in Chennai. Family dinner at seven. Reminder: evening prayer at six thirty.',
    at: new Date().toISOString(),
  };
  if (!t.state.reminders.length) {
    t.state.reminders = [
      {
        id: crypto.randomUUID(),
        title: 'Water',
        spokenPreview: 'Amma, a glass of water would be nice now',
        language: 'en',
        important: false,
        quietHoursExempt: false,
        at: new Date(Date.now() + 45 * 60_000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Evening prayer',
        spokenPreview: 'Amma, evening prayer begins soon',
        language: 'en',
        important: false,
        quietHoursExempt: false,
        at: new Date(Date.now() + 6 * 3600_000).toISOString(),
      },
    ];
    pushSchedule(tenantId);
  }
}

// SSE
type SseClient = { tenantId: string; write: (chunk: string) => void };
const sseClients = new Set<SseClient>();

export function subscribeSse(tenantId: string, write: (chunk: string) => void) {
  const client = { tenantId, write };
  sseClients.add(client);
  return () => sseClients.delete(client);
}

export function broadcast(tenantId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of sseClients) {
    if (c.tenantId === tenantId) c.write(payload);
  }
}

export function listTenants() {
  return [...tenants.keys()];
}

export function resetTenantsForTests() {
  for (const t of tenants.values()) {
    t.sim?.stopIdleFeed();
  }
  tenants.clear();
  sseClients.clear();
}

export function ensureDemoHousehold(): string {
  const existing = [...tenants.entries()].find(([, t]) => t.state.household.name.includes('demo'));
  if (existing) return existing[0];

  const tenantId = 'demo-household';
  bootstrapTenant({
    tenantId,
    region: 'IN',
    householdName: "Amma's demo household",
    ownerAccountId: 'demo-owner',
    ownerName: 'Demo Host',
    ownerEmail: 'demo@svaraa.family',
  });
  patchOnboarding(tenantId, 13, {
    complete: true,
    wearer: { name: 'Amma', callAs: 'Amma', languages: ['en', 'hi'], cardiacImplant: false },
    provider: { llm: 'sarvam', stt: 'sarvam', tts: 'sarvam', managedKeys: true },
    consent: {
      recordingMode: 'on-request',
      retentionDays: 30,
      audioConsentCaptured: true,
      sharingLevel: 'family',
    },
    members: [
      {
        id: 'c1',
        name: 'Ravi',
        phone: '+919800000001',
        role: 'caregiver',
        sosTier: 1,
        channels: ['push', 'sms'],
        verified: true,
      },
    ],
  });
  pairMockPendant(tenantId, 'sim-sl1a-chest');
  seedDemoContent(tenantId);
  persist();
  return tenantId;
}
