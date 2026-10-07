import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { SEND_TIMES, TEMPLATE_MAX_LENGTH } from '@/domain/day-before-sms';
import { E164_RE } from './sms.dto';

/** PUT /internal/parkings/:id/reminders. A template of null (or empty) goes back to Plazo's text. */
export class UpdateReminderSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public enabled?: boolean;

  @IsOptional()
  @IsIn(SEND_TIMES as string[], { message: 'invalid_time' })
  public sendTime?: string;

  @IsOptional()
  @IsString({ message: 'invalid' })
  @MaxLength(TEMPLATE_MAX_LENGTH, { message: 'too_long' })
  public template?: string | null;
}

/** PUT /internal/parkings/:id/reminders/evenings/:date. A sendTime of null goes back to the usual time. */
export class UpdateReminderEveningDto {
  @IsOptional()
  @IsIn(SEND_TIMES as string[], { message: 'invalid_time' })
  public sendTime?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public paused?: boolean;
}

/** POST /internal/parkings/:id/reminders/test: to the staff member's own phone unless another is given. */
export class TestReminderDto {
  @IsOptional()
  @Matches(E164_RE, { message: 'invalid_phone' })
  public to?: string;

  /** The text being written (not saved yet); else the saved one. */
  @IsOptional()
  @IsString({ message: 'invalid' })
  @MaxLength(TEMPLATE_MAX_LENGTH, { message: 'too_long' })
  public template?: string;
}

/** PUT /internal/reservations/:id/reminder: "Ne pas envoyer" / "Rétablir". */
export class ExcludeReminderDto {
  @IsBoolean({ message: 'invalid' })
  public excluded: boolean;
}
