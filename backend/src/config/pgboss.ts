import PgBoss from 'pg-boss';
import { BOSS_DATABASE_URL } from '@/config';
import { logger } from '@/utils/logger';

const boss = new PgBoss({ connectionString: BOSS_DATABASE_URL, schema: 'pgboss', max: 5 });

export default boss;

export async function startPgBoss() {
  boss.on('error', err => {
    logger.error(`PgBoss error: ${err}`);
  });
  try {
    await boss.start();
    logger.info('PgBoss started successfully');
    return boss;
  } catch (error) {
    logger.error(`Failed to start PgBoss — background jobs disabled: ${error}`);
    return null;
  }
}
