import { SendOptions, WorkHandler } from 'pg-boss';
import boss from '@/config/pgboss';
import { JobNames, JobRegistry } from './registry';

export async function createAllQueues() {
  for (const name of Object.values(JobNames)) {
    await boss.createQueue(`${name}.dead-letter`);
    await boss.createQueue(name, {
      name,
      retryLimit: 5,
      retryBackoff: true,
      retryDelay: 2000,
      expireInMinutes: 60,
      deadLetter: `${name}.dead-letter`,
    });
  }
}

export async function registerJobWorker<K extends keyof JobRegistry>(jobName: K, handler: WorkHandler<JobRegistry[K]>) {
  await boss.work(jobName, handler);
}

export async function publishJob<K extends keyof JobRegistry>(jobName: K, data: JobRegistry[K], options?: SendOptions) {
  return boss.send(jobName, data, options ?? {});
}
