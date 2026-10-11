import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ScenarioId } from '@svaraa/mock-pendant';
import { respondVoice, summarizeTranscript } from './ai.js';
import {
  acknowledgeIncident,
  bootstrapTenant,
  ensureDemoHousehold,
  getTenant,
  injectScenario,
  pairMockPendant,
  patchOnboarding,
  pushSchedule,
  requireTenant,
  resolveIncident,
  seedDemoContent,
  inviteFamilyMember,
  updateSosLadder,
  exportHousehold,
  requestDeleteHousehold,
  subscribeSse,
  todaySnapshot,
} from './store.js';

export async function createTenantApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(cors, { origin: true });

  function tenantIdFrom(req: { headers: { [key: string]: unknown }; query?: unknown }) {
    const q = (req.query ?? {}) as Record<string, unknown>;
    return String(req.headers['x-tenant-id'] ?? q.tenant ?? '');
  }

  app.get('/health', async () => ({ ok: true, service: 'tenant' }));

  app.post('/v1/demo/ensure', async () => {
    const tenantId = ensureDemoHousehold();
    return { tenantId, today: todaySnapshot(tenantId) };
  });

  app.post<{
    Body: {
      tenantId: string;
      region: 'IN' | 'EU' | 'US';
      householdName: string;
      ownerAccountId: string;
      ownerName: string;
      ownerEmail?: string;
      ownerPhone?: string;
    };
  }>('/internal/bootstrap', async (req, reply) => {
    if (req.headers['x-internal-key'] !== 'dev') return reply.code(403).send({ error: 'forbidden' });
    const state = bootstrapTenant(req.body);
    return { ok: true, householdId: state.household.id };
  });

  app.get('/v1/household', async (req, reply) => {
    const id = tenantIdFrom(req);
    const t = getTenant(id);
    if (!t) return reply.code(404).send({ error: 'tenant not found' });
    return t.state.household;
  });

  app.get('/v1/today', async (req, reply) => {
    const id = tenantIdFrom(req);
    if (!getTenant(id)) return reply.code(404).send({ error: 'tenant not found' });
    return todaySnapshot(id);
  });

  app.get('/v1/state', async (req, reply) => {
    const id = tenantIdFrom(req);
    const t = getTenant(id);
    if (!t) return reply.code(404).send({ error: 'tenant not found' });
    return t.state;
  });

  app.patch<{ Body: { step: number; data?: Record<string, unknown> } }>('/v1/onboarding', async (req, reply) => {
    const id = tenantIdFrom(req);
    if (!getTenant(id)) return reply.code(404).send({ error: 'tenant not found' });
    return patchOnboarding(id, req.body.step, req.body.data ?? {});
  });

  app.post<{
    Body: { profile?: 'sim-sl1a-chest' | 'sim-sl1a-wrist' | 'sim-sl1f-clipped' | 'sim-sl1f-open-privacy-off' };
  }>('/v1/pendant/pair-mock', async (req, reply) => {
    const id = tenantIdFrom(req);
    if (!getTenant(id)) return reply.code(404).send({ error: 'tenant not found' });
    return pairMockPendant(id, req.body.profile ?? 'sim-sl1a-chest');
  });

  app.get('/v1/pendant/scan-mock', async (req, reply) => {
    const id = tenantIdFrom(req);
    if (!getTenant(id)) return reply.code(404).send({ error: 'tenant not found' });
    const a = pairMockPendant(id, 'sim-sl1a-chest');
    const { listDiscoverableMocks } = await import('@svaraa/mock-pendant');
    return { devices: listDiscoverableMocks(), samplePairing: a.pairingCode };
  });

  app.post<{ Body: { code: string } }>('/v1/pendant/confirm-pair', async (req, reply) => {
    const id = tenantIdFrom(req);
    const t = getTenant(id);
    if (!t?.state.onboarding.pairingCode) return reply.code(400).send({ error: 'no pairing in progress' });
    const expected = t.state.onboarding.pairingCode.replace(/\s/g, '');
    if (req.body.code.replace(/\s/g, '') !== expected) return reply.code(401).send({ error: 'code mismatch' });
    return { ok: true, pendant: t.state.pendant, model: t.state.onboarding.identifiedModel };
  });

  app.post<{ Body: { wearMode?: 'chest' | 'wrist' | 'clip' } }>('/v1/pendant/wear-mode', async (req, reply) => {
    const id = tenantIdFrom(req);
    const t = requireTenant(id);
    if (!t.state.pendant) return reply.code(400).send({ error: 'no pendant' });
    if (t.state.pendant.hardwareModel !== 'SL1-A') {
      return reply.code(400).send({ error: 'wear mode only on SL1-A' });
    }
    t.state.pendant.wearMode = req.body.wearMode ?? 'chest';
    return t.state.pendant;
  });

  app.get('/v1/reminders', async (req) => requireTenant(tenantIdFrom(req)).state.reminders);
  app.post<{ Body: { reminders: unknown[] } }>('/v1/reminders', async (req) => {
    const id = tenantIdFrom(req);
    const t = requireTenant(id);
    t.state.reminders = req.body.reminders as typeof t.state.reminders;
    return pushSchedule(id);
  });

  app.get('/v1/incidents', async (req) => requireTenant(tenantIdFrom(req)).state.incidents);
  app.post<{ Params: { id: string }; Body: { memberName?: string } }>(
    '/v1/incidents/:id/ack',
    async (req) => acknowledgeIncident(tenantIdFrom(req), req.params.id, req.body.memberName ?? 'Family'),
  );
  app.post<{ Params: { id: string }; Body: { outcome: string } }>(
    '/v1/incidents/:id/resolve',
    async (req) => resolveIncident(tenantIdFrom(req), req.params.id, req.body.outcome),
  );

  app.get('/v1/recall', async (req) => requireTenant(tenantIdFrom(req)).state.sessions);
  app.get('/v1/todo', async (req) => requireTenant(tenantIdFrom(req)).state.actionItems);
  app.post<{ Body: { text: string } }>('/v1/recall/ingest', async (req) => {
    const id = tenantIdFrom(req);
    const t = requireTenant(id);
    const { summary, actionItems } = await summarizeTranscript(req.body.text);
    const sessionId = crypto.randomUUID();
    const items = actionItems.map((title) => ({
      id: crypto.randomUUID(),
      title,
      status: 'proposed' as const,
      sessionId,
    }));
    t.state.sessions.unshift({
      id: sessionId,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      title: 'Voice session',
      summary,
      kind: 'conversation',
      actionItemIds: items.map((i) => i.id),
    });
    t.state.actionItems.unshift(...items);
    return { session: t.state.sessions[0], actionItems: items };
  });

  app.post<{ Body: { text: string } }>('/v1/companion/ask', async (req) => {
    const id = tenantIdFrom(req);
    const t = requireTenant(id);
    const provider = t.state.provider?.llm ?? 'sarvam';
    const result = await respondVoice({
      text: req.body.text,
      provider,
      callAs: t.state.wearer?.callAs || 'Amma',
      battery: t.state.pendant?.batteryPercent,
    });
    t.state.brainAllowanceUsed += 1;
    t.state.companionJobs.unshift({
      id: crypto.randomUUID(),
      title: req.body.text.slice(0, 48),
      status: 'done',
    });
    return result;
  });

  app.post<{ Body: { title: string; steps: string[] } }>('/v1/companion/do', async (req) => {
    const id = tenantIdFrom(req);
    const t = requireTenant(id);
    const job = {
      id: crypto.randomUUID(),
      title: req.body.title,
      status: 'needs_ok' as const,
    };
    t.state.companionJobs.unshift(job);
    return { job, steps: req.body.steps, actions: ['Do it', 'Edit', 'Cancel'] };
  });

  app.get('/v1/family', async (req) => requireTenant(tenantIdFrom(req)).state.members);
  app.post<{ Body: { name: string; email?: string; phone?: string; sosTier?: number } }>(
    '/v1/family/invite',
    async (req, reply) => {
      if (!req.body?.name) return reply.code(400).send({ error: 'name required' });
      return inviteFamilyMember(tenantIdFrom(req), req.body);
    },
  );
  app.post<{ Body: { order: Array<{ id: string; sosTier: number }> } }>('/v1/family/ladder', async (req, reply) => {
    if (!Array.isArray(req.body?.order)) return reply.code(400).send({ error: 'order required' });
    return updateSosLadder(tenantIdFrom(req), req.body.order);
  });
  app.get('/v1/privacy', async (req) => {
    const t = requireTenant(tenantIdFrom(req));
    return { consent: t.state.consent, auditLog: t.state.auditLog, privacyMode: t.state.household.privacyMode };
  });
  app.post('/v1/privacy/export', async (req) => exportHousehold(tenantIdFrom(req)));
  app.post('/v1/privacy/delete', async (req) => requestDeleteHousehold(tenantIdFrom(req)));
  app.get('/v1/news', async (req) => requireTenant(tenantIdFrom(req)).state.newsBriefing);
  app.get('/v1/recite', async (req) => requireTenant(tenantIdFrom(req)).state.recitePlaylists);
  app.get('/v1/connections', async (req) => requireTenant(tenantIdFrom(req)).state.connections);
  app.get('/v1/routines', async () => ({
    quietHours: { start: '22:00', end: '06:30', safetyExempt: true },
    ribbon: [
      { at: '07:00', kind: 'briefing', label: 'Morning briefing' },
      { at: '12:00', kind: 'checkin', label: 'Midday check-in' },
      { at: '18:30', kind: 'prayer', label: 'Evening prayer' },
      { at: '20:30', kind: 'digest', label: 'Evening digest' },
    ],
  }));

  app.post('/v1/demo/seed', async (req) => {
    const id = tenantIdFrom(req);
    seedDemoContent(id);
    return todaySnapshot(id);
  });

  app.post<{ Body: { scenario: ScenarioId; profile?: string } }>('/v1/demo/scenario', async (req) => {
    const id = tenantIdFrom(req);
    await injectScenario(id, req.body.scenario);
    return todaySnapshot(id);
  });

  app.get('/v1/events', async (req, reply) => {
    const id = tenantIdFrom(req);
    if (!getTenant(id)) return reply.code(404).send({ error: 'tenant not found' });
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    reply.raw.write(`event: ready\ndata: ${JSON.stringify({ tenantId: id })}\n\n`);
    const unsub = subscribeSse(id, (chunk) => reply.raw.write(chunk));
    const ping = setInterval(() => reply.raw.write(`: ping\n\n`), 15000);
    req.raw.on('close', () => {
      clearInterval(ping);
      unsub();
    });
  });

  return app;
}
