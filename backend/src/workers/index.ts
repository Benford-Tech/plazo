import { startPgBoss } from '@/config/pgboss';
import { logger } from '@/utils/logger';
import { registerMaintenanceWorker } from './maintenance.worker';
import { createAllQueues } from './worker';

export async function startWorkers() {
  const boss = await startPgBoss();
  if (!boss) return;
  try {
    await createAllQueues();
    await registerMaintenanceWorker();
    logger.info('Workers started');
  } catch (error) {
    logger.error(`Failed to start workers: ${error}`);
  }
}
