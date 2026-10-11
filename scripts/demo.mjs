#!/usr/bin/env node
/**
 * One-command demo: wait for CP+tenant, ensure demo household, print URLs.
 * Start servers separately or via `pnpm demo` (concurrent).
 */
const CP = process.env.CONTROL_PLANE_URL ?? 'http://localhost:4000';
const TENANT = process.env.TENANT_URL ?? 'http://localhost:4001';
const WEB = process.env.WEB_URL ?? 'http://localhost:5173';

async function wait(url, label) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        console.log(`✓ ${label}`);
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${label} not ready at ${url}`);
}

async function main() {
  await wait(`${CP}/health`, 'control-plane');
  await wait(`${TENANT}/health`, 'tenant');
  const ensured = await fetch(`${TENANT}/v1/demo/ensure`, { method: 'POST' }).then((r) => r.json());
  console.log(`✓ demo household ${ensured.tenantId}`);
  console.log('');
  console.log('Open investor demo:');
  console.log(`  ${WEB}/demo?demo=1`);
  console.log('Or click “Investor demo” on the landing page.');
  console.log('Use the Guide (bottom-right) for the product walkthrough.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
