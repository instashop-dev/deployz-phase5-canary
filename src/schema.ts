// Boot-time schema for the canary's two tables. The DDL is idempotent, so the
// worker and the scheduled task can both run it on start against a fresh
// database.
import { Pool } from 'pg';

const DDL = [
  'CREATE TABLE IF NOT EXISTS messages (body text NOT NULL, received_at timestamptz NOT NULL DEFAULT now())',
  'CREATE TABLE IF NOT EXISTS ticks (ran_at timestamptz NOT NULL DEFAULT now(), note text)',
];

export async function ensureSchema(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const statement of DDL) await pool.query(statement);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('schema ensure failed', err);
  } finally {
    await pool.end();
  }
}
