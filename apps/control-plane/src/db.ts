import { PGlite } from '@electric-sql/pglite';

let db: PGlite | null = null;

export async function getDb() {
  if (db) return db;
  const memory = process.env.VITEST === 'true' || process.env.USE_PGLITE_MEMORY === 'true';
  db = memory ? new PGlite() : new PGlite('./.data/control-plane');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      timezone TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      household_name TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'provisioning',
      base_url TEXT NOT NULL,
      owner_account_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS firmware (
      version TEXT PRIMARY KEY,
      signed_url TEXT NOT NULL,
      min_battery INTEGER NOT NULL DEFAULT 50
    );
  `);
  await db.exec(`
    INSERT INTO firmware (version, signed_url, min_battery)
    VALUES ('1.0.0-mock', 'https://fw.svaraa.local/1.0.0-mock.bin', 50)
    ON CONFLICT DO NOTHING;
  `);
  return db;
}

export async function resetDbForTests() {
  if (db) {
    try {
      await db.close();
    } catch {
      /* ignore close races in vitest */
    }
  }
  db = null;
}
