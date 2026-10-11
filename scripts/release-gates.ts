/**
 * G1–G4 smoke checks against running services OR inject-mode self-contained run.
 * Prefer: pnpm test (unit/integration). This script validates a live stack.
 */
const CP = process.env.CONTROL_PLANE_URL ?? 'http://localhost:4000';
const TENANT = process.env.TENANT_URL ?? 'http://localhost:4001';

async function main() {
  const results: Array<{ gate: string; ok: boolean; detail: string }> = [];

  const healthCp = await fetch(`${CP}/health`).then((r) => r.json());
  results.push({ gate: 'G1.control-plane', ok: healthCp.ok === true, detail: JSON.stringify(healthCp) });

  const otp = await fetch(`${CP}/auth/otp/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'gates@svaraa.test' }),
  }).then((r) => r.json());

  const t0 = Date.now();
  const session = await fetch(`${CP}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'gates@svaraa.test',
      code: otp.devCode,
      name: 'Gates',
      country: 'IN',
      timezone: 'Asia/Kolkata',
    }),
  }).then((r) => r.json());

  const prov = await fetch(`${CP}/tenants/provision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ region: 'IN', householdName: 'Gate household' }),
  }).then((r) => r.json());

  let status = 'provisioning';
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    const st = await fetch(`${CP}/tenants/${prov.tenantId}`).then((r) => r.json());
    status = st.status;
    if (status === 'active') break;
  }
  const provisionMs = Date.now() - t0;
  results.push({
    gate: 'G1.provision<90s',
    ok: status === 'active' && provisionMs < 90_000,
    detail: `${status} in ${provisionMs}ms`,
  });

  const headers = { 'content-type': 'application/json', 'x-tenant-id': prov.tenantId };
  const pairA = await fetch(`${TENANT}/v1/pendant/pair-mock`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ profile: 'sim-sl1a-chest' }),
  }).then((r) => r.json());
  results.push({
    gate: 'G2.auto-id-SL1-A',
    ok: pairA.identified?.model === 'SL1-A',
    detail: JSON.stringify(pairA.identified),
  });

  const pairF = await fetch(`${TENANT}/v1/pendant/pair-mock`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ profile: 'sim-sl1f-clipped' }),
  }).then((r) => r.json());
  results.push({
    gate: 'G2.auto-id-SL1-F',
    ok: pairF.identified?.model === 'SL1-F' && pairF.identified?.buttonMap?.double === 'record',
    detail: JSON.stringify(pairF.identified),
  });

  await fetch(`${TENANT}/v1/demo/scenario`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ scenario: 'sos_drill' }),
  });
  const incidents = await fetch(`${TENANT}/v1/incidents`, { headers: { 'x-tenant-id': prov.tenantId } }).then((r) =>
    r.json(),
  );
  const drill = incidents[0];
  const ackT0 = Date.now();
  await fetch(`${TENANT}/v1/incidents/${drill.id}/ack`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ memberName: 'Gates' }),
  });
  results.push({
    gate: 'G2.sos-ack',
    ok: Boolean(drill) && Date.now() - ackT0 < 120_000,
    detail: `incident ${drill?.id}`,
  });

  const ask = await fetch(`${TENANT}/v1/companion/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: 'What time is it?' }),
  }).then((r) => r.json());
  results.push({
    gate: 'G3.tier0-voice',
    ok: ask.tier === 0 && ask.latencyMs < 3500,
    detail: JSON.stringify(ask),
  });

  const recall = await fetch(`${TENANT}/v1/recall/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: 'Book follow up. Drink water.' }),
  }).then((r) => r.json());
  results.push({
    gate: 'G3.recall-action-items',
    ok: Array.isArray(recall.actionItems) && recall.actionItems.length > 0,
    detail: JSON.stringify(recall.actionItems),
  });

  const today = await fetch(`${TENANT}/v1/today`, { headers: { 'x-tenant-id': prov.tenantId } }).then((r) =>
    r.json(),
  );
  results.push({
    gate: 'G4.today-snapshot',
    ok: Boolean(today.pendant),
    detail: `battery ${today.pendant?.batteryPercent}`,
  });

  const routines = await fetch(`${TENANT}/v1/routines`, { headers: { 'x-tenant-id': prov.tenantId } }).then((r) =>
    r.json(),
  );
  results.push({
    gate: 'G4.quiet-hours-safety-exempt',
    ok: routines.quietHours?.safetyExempt === true,
    detail: JSON.stringify(routines.quietHours),
  });

  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.gate} — ${r.detail}`);
    if (!r.ok) failed += 1;
  }
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
