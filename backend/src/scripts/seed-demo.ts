import 'reflect-metadata';
import { Container } from 'typedi';
import prisma from '@/database';
import { DEMO_PASSWORD_MIN_LENGTH, DemoSeedService, NotDemoOperatorError } from '@/services/demo-seed.service';

/**
 * Demo data for trying the site and the apps: five fictional operators around Lyon Saint-Exupéry
 * with a published listing each, and a few bookings for the first one (src/domain/demo-data.ts).
 *
 *   npm run seed:demo -- --apply     creates or refreshes them (DEMO_SEED_PASSWORD required, 10+ chars)
 *   npm run seed:demo -- --archive   suspends then archives every operator flagged as demo: hidden from the site,
 *                                    the apps, the platform's lists and the crons, kept in the database (--apply
 *                                    restores them)
 *   npm run seed:demo -- --remove    deletes every operator flagged as demo, nothing else
 *
 * Run by the Vercel build after bootstrap-platform-admin, driven by DEMO_LISTINGS: "true" applies,
 * "archive" archives, "remove" removes, anything else does nothing. Idempotent; never fails the build;
 * logs counts only.
 */
type Mode = 'apply' | 'archive' | 'remove' | 'none';

function mode(argv: string[], env: NodeJS.ProcessEnv): Mode {
  if (argv.includes('--apply')) return 'apply';
  if (argv.includes('--archive')) return 'archive';
  if (argv.includes('--remove')) return 'remove';
  const flag = (env.DEMO_LISTINGS || '').trim().toLowerCase();
  if (flag === 'true' || flag === '1') return 'apply';
  if (flag === 'archive') return 'archive';
  if (flag === 'remove') return 'remove';
  return 'none';
}

async function main() {
  const selected = mode(process.argv.slice(2), process.env);
  if (selected === 'none') return;
  const seed = Container.get(DemoSeedService);

  if (selected === 'archive') {
    const r = await seed.archive();
    console.log(
      `[seed-demo] Archived ${r.operators} demo operator(s): suspended and archived, hidden from the site, kept in the database (DEMO_LISTINGS=true restores them)`,
    );
    return;
  }

  if (selected === 'remove') {
    const r = await seed.remove();
    console.log(
      `[seed-demo] Removed ${r.operators} demo operator(s) (${r.parkings} parking(s), ${r.reservations} booking(s), ${r.staff} account(s))`,
    );
    return;
  }

  const password = process.env.DEMO_SEED_PASSWORD?.trim() || '';
  if (password.length < DEMO_PASSWORD_MIN_LENGTH) {
    console.warn(`[seed-demo] DEMO_SEED_PASSWORD must be set (${DEMO_PASSWORD_MIN_LENGTH} characters at least): nothing created`);
    process.exitCode = process.argv.includes('--apply') ? 1 : 0;
    return;
  }
  const r = await seed.apply(password);
  console.log(
    `[seed-demo] Demo operators: ${r.operatorsCreated} created, ${r.operatorsUpdated} refreshed; ` +
      `demo bookings: ${r.bookingsCreated} created, ${r.bookingsUpdated} refreshed`,
  );
}

main()
  .catch(error => {
    if (error instanceof NotDemoOperatorError) {
      console.error('[seed-demo] Refused: an operator in the way is not a demo operator');
    } else {
      // Prisma messages quote the source; the last line is the useful part.
      const lines = String(error?.message ?? error)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      console.error('[seed-demo] Failed:', lines[lines.length - 1]);
    }
    // A manual run reports the failure; the Vercel build (DEMO_LISTINGS) never fails because of it.
    if (['--apply', '--archive', '--remove'].some(flag => process.argv.includes(flag))) process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
