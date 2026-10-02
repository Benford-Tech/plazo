import 'reflect-metadata';
import { Container } from 'typedi';
import prisma from '@/database';
import { OperatorService } from '@/services/operator.service';

/**
 * One-time creation of the platform owner's account, run by the Vercel build after the migrations.
 *
 * Creates a "Plazo (tests)" operator whose manager is the first email of PLATFORM_ADMIN_EMAILS, with
 * the password set in PLATFORM_BOOTSTRAP_PASSWORD (typed by the owner in the Vercel dashboard, never
 * anywhere else). Does nothing when the variable is empty or the account already exists: an existing
 * password is never overwritten. Never fails the build.
 */
async function main() {
  const password = process.env.PLATFORM_BOOTSTRAP_PASSWORD?.trim() || '';
  if (!password) return;
  const email = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',')[0]?.trim().toLowerCase();
  if (!email) {
    console.warn('[bootstrap-admin] PLATFORM_ADMIN_EMAILS is empty: nothing to create');
    return;
  }
  if (password.length < 10) {
    console.warn('[bootstrap-admin] PLATFORM_BOOTSTRAP_PASSWORD must be at least 10 characters long: account not created');
    return;
  }
  if (await prisma.staff.findUnique({ where: { email } })) {
    console.log('[bootstrap-admin] The platform account already exists; PLATFORM_BOOTSTRAP_PASSWORD can be removed');
    return;
  }
  await Container.get(OperatorService).createWithManager({
    operatorName: 'Plazo (tests)',
    parkingName: 'Parking test Plazo',
    totalCapacity: 50,
    managerName: process.env.PLATFORM_BOOTSTRAP_NAME?.trim() || 'Administrateur Plazo',
    managerEmail: email,
    managerPassword: password,
  });
  console.log('[bootstrap-admin] Platform account created; remove PLATFORM_BOOTSTRAP_PASSWORD from the Vercel settings');
}

main()
  .catch(error => {
    // Prisma messages quote the source; the last line is the useful part.
    const lines = String(error?.message ?? error)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    console.error('[bootstrap-admin] Failed:', lines[lines.length - 1]);
  })
  .finally(() => prisma.$disconnect());
