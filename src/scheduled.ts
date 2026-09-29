// Scheduled-job process: runs once per ECS task. INSERTs a tick row to
// demonstrate that the EventBridge Scheduler -> ECS RunTask path fires.
import { Pool } from 'pg';

import { ensureSchema } from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main(): Promise<void> {
  await ensureSchema();
  await pool.query(
    'INSERT INTO ticks (ran_at, note) VALUES (NOW(), $1)',
    ['canary-scheduled-task-fired'],
  );
  await pool.end();
  // eslint-disable-next-line no-console
  console.log('scheduled task tick recorded');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('scheduled task failed', err);
  process.exit(1);
});
