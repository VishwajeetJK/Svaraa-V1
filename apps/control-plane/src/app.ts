import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { getDb } from './db.js';
import { randomOtp, signSession, verifySession } from './auth.js';
import { checkOtpRateLimit, validateControlPlaneEnv } from './env.js';

export type CreateControlPlaneOptions = {
  tenantBaseUrl?: string;
  provisionDelayMs?: number;
  fetchImpl?: typeof fetch;
  logger?: boolean;
};

export async function createControlPlaneApp(
  opts: CreateControlPlaneOptions = {},
): Promise<FastifyInstance> {
  const TENANT_BASE = opts.tenantBaseUrl ?? process.env.TENANT_PUBLIC_URL ?? 'http://localhost:4001';
  const provisionDelayMs = opts.provisionDelayMs ?? 800;
  const fetchImpl = opts.fetchImpl ?? fetch;

  validateControlPlaneEnv();
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ ok: true, service: 'control-plane' }));

  app.post<{ Body: { email?: string; phone?: string } }>('/auth/otp/request', async (req, reply) => {
    const target = req.body.email ?? req.body.phone;
    if (!target) return reply.code(400).send({ error: 'email or phone required' });
    const limit = checkOtpRateLimit(target);
    if (!limit.ok) {
      return reply.code(429).send({ error: 'too many OTP requests', retryAfterSec: limit.retryAfterSec });
    }
    const db = await getDb();
    const code = randomOtp();
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO otps (id, target, code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [id, target, code],
    );
    return { ok: true, cooldownSec: 60, devCode: code };
  });

  app.post<{
    Body: {
      email?: string;
      phone?: string;
      code: string;
      name: string;
      country: string;
      timezone: string;
    };
  }>('/auth/otp/verify', async (req, reply) => {
    const { email, phone, code, name, country, timezone } = req.body;
    const target = email ?? phone;
    if (!target || !code || !name) return reply.code(400).send({ error: 'missing fields' });
    const db = await getDb();
    const otp = await db.query<{ code: string }>(
      `SELECT code FROM otps WHERE target = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`,
      [target],
    );
    if (!otp.rows[0] || otp.rows[0].code !== code) {
      return reply.code(401).send({ error: 'invalid code' });
    }

    let account = await db.query<{ id: string; name: string }>(
      email
        ? `SELECT id, name FROM accounts WHERE email = $1`
        : `SELECT id, name FROM accounts WHERE phone = $1`,
      [target],
    );
    if (!account.rows[0]) {
      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO accounts (id, email, phone, name, country, timezone) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, email ?? null, phone ?? null, name, country, timezone],
      );
      account = { rows: [{ id, name }], fields: [], affectedRows: 0 };
    }

    const token = await signSession({
      sub: account.rows[0].id,
      email,
      phone,
      name: account.rows[0].name || name,
    });
    return { token, accountId: account.rows[0].id };
  });

  app.post<{ Body: { region: 'IN' | 'EU' | 'US'; householdName: string } }>(
    '/tenants/provision',
    async (req, reply) => {
      const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!auth) return reply.code(401).send({ error: 'unauthorized' });
      const session = await verifySession(auth);
      const { region, householdName } = req.body;
      const db = await getDb();
      const id = crypto.randomUUID();
      const baseUrl = `${TENANT_BASE}?tenant=${id}`;
      await db.query(
        `INSERT INTO tenants (id, household_name, region, status, base_url, owner_account_id)
         VALUES ($1,$2,$3,'provisioning',$4,$5)`,
        [id, householdName || 'Our household', region, baseUrl, session.sub],
      );

      setTimeout(async () => {
        try {
          await fetchImpl(`${TENANT_BASE}/internal/bootstrap`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-internal-key': 'dev' },
            body: JSON.stringify({
              tenantId: id,
              region,
              householdName: householdName || 'Our household',
              ownerAccountId: session.sub,
              ownerName: session.name,
              ownerEmail: session.email,
              ownerPhone: session.phone,
            }),
          });
          const d = await getDb();
          await d.query(`UPDATE tenants SET status = 'active' WHERE id = $1`, [id]);
        } catch (e) {
          app.log.error(e);
          const d = await getDb();
          await d.query(`UPDATE tenants SET status = 'failed' WHERE id = $1`, [id]);
        }
      }, provisionDelayMs);

      return { tenantId: id, status: 'provisioning', baseUrl };
    },
  );

  app.get<{ Params: { id: string } }>('/tenants/:id', async (req, reply) => {
    const db = await getDb();
    const res = await db.query(
      `SELECT id, household_name, region, status, base_url, created_at FROM tenants WHERE id = $1`,
      [req.params.id],
    );
    if (!res.rows[0]) return reply.code(404).send({ error: 'not found' });
    return res.rows[0];
  });

  app.get('/firmware/latest', async () => {
    const db = await getDb();
    const res = await db.query(`SELECT version, signed_url, min_battery FROM firmware LIMIT 1`);
    return res.rows[0];
  });

  await getDb();
  return app;
}
