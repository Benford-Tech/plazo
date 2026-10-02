import { PayoutSchedule } from '@/database';
import { addDays, dayBounds, localDate } from './time';

/**
 * When an operator receives its share of a booking paid online, by the schedule it chose. Every
 * date is a local calendar day of the parking; the share is due from midnight that day.
 * - AFTER_STAY (default): the day after the return.
 * - AT_DROP_OFF: the day after the arrival (free cancellation is closed by then).
 * - WEEKLY: the Monday after the week (Monday to Sunday) in which the stay ended.
 * - MONTHLY: the 1st of the month after the one in which the stay ended.
 */
export function payoutDueDate(schedule: PayoutSchedule, stay: { arrivalAt: Date; returnAt: Date }, timeZone: string): string {
  const returnDay = localDate(stay.returnAt, timeZone);
  switch (schedule) {
    case 'AT_DROP_OFF':
      return addDays(localDate(stay.arrivalAt, timeZone), 1);
    case 'WEEKLY': {
      const weekday = new Date(`${returnDay}T00:00:00Z`).getUTCDay(); // 0 = Sunday
      const daysSinceMonday = (weekday + 6) % 7;
      return addDays(returnDay, 7 - daysSinceMonday);
    }
    case 'MONTHLY': {
      const [year, month] = returnDay.split('-').map(Number);
      return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }
    case 'AFTER_STAY':
    default:
      return addDays(returnDay, 1);
  }
}

/** The instant from which the share is due (local midnight of the due date). */
export function payoutDueAt(schedule: PayoutSchedule, stay: { arrivalAt: Date; returnAt: Date }, timeZone: string): Date {
  return dayBounds(payoutDueDate(schedule, stay, timeZone), timeZone).start;
}
