import { Container } from 'typedi';
import boss from '@/config/pgboss';
import { TokenService } from '@/services/token.service';
import { logger } from '@/utils/logger';
import { JobNames } from './registry';
import { registerJobWorker } from './worker';

export const registerMaintenanceWorker = async () => {
  await registerJobWorker(JobNames.PurgeExpiredTokens, async () => {
    const count = await Container.get(TokenService).deleteExpired();
    logger.info(`[MaintenanceWorker] ${count} expired staff tokens deleted`);
  });
  // Every night at 03:00 (Paris time).
  await boss.schedule(JobNames.PurgeExpiredTokens, '0 3 * * *', {}, { tz: 'Europe/Paris' });
};
