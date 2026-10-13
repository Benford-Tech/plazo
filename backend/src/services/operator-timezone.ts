import prisma from '@/database';

export const DEFAULT_TIMEZONE = 'Europe/Paris';

/** An operator's time zone: its first parking's, for "today" (the post and vehicle of the day, the daily join code). */
export async function operatorTimezone(operatorId: string): Promise<string> {
  const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' }, select: { timezone: true } });
  return parking?.timezone ?? DEFAULT_TIMEZONE;
}
