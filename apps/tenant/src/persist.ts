import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { TenantState } from './store.js';

const DATA_PATH = process.env.TENANT_STATE_PATH ?? join(process.cwd(), '.data', 'tenants.json');

export type PersistedBlob = {
  version: 1;
  tenants: Record<string, TenantState>;
};

export function loadPersistedTenants(): Record<string, TenantState> {
  try {
    if (!existsSync(DATA_PATH)) return {};
    const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as PersistedBlob;
    return raw.tenants ?? {};
  } catch {
    return {};
  }
}

export function savePersistedTenants(tenants: Map<string, { state: TenantState }>) {
  if (process.env.VITEST === 'true') return;
  const blob: PersistedBlob = { version: 1, tenants: {} };
  for (const [id, t] of tenants) {
    blob.tenants[id] = t.state;
  }
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(blob, null, 2));
}
