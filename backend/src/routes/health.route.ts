import { Router } from 'express';
import prisma from '@/database';
import { Routes } from '@/interfaces/routes.interface';

/** How long the deep check waits for the database before answering "degraded". */
const DATABASE_TIMEOUT_MS = 3000;

export class HealthRoute implements Routes {
  public router = Router();

  constructor() {
    /**
     * GET /health answers without touching anything (the uptime monitor every 5 minutes, which must not keep the
     * database awake); GET /health?deep=1 also runs one query and answers 503 { status: 'degraded', database: false }
     * when it fails or takes more than 3 s (08/10/2026: a monitor that only reads "ok" misses a database outage).
     */
    this.router.get('/health', async (req, res) => {
      if (req.query.deep === undefined) {
        res.json({ status: 'ok' });
        return;
      }
      const database = await databaseReachable();
      res.status(database ? 200 : 503).json({ status: database ? 'ok' : 'degraded', database });
    });
  }
}

async function databaseReachable(): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>(resolve => {
    timer = setTimeout(() => resolve(false), DATABASE_TIMEOUT_MS);
    timer.unref?.();
  });
  try {
    return await Promise.race([
      prisma.$queryRaw`SELECT 1`.then(
        () => true,
        () => false,
      ),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
