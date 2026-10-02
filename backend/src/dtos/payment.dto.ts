import { IsEnum } from 'class-validator';
import { PayoutSchedule } from '@/database';

/** When the operator receives its share of the online payments. */
export class UpdatePayoutSettingsDto {
  @IsEnum(PayoutSchedule, { message: 'invalid_payout_schedule' })
  public payoutSchedule: PayoutSchedule;
}
