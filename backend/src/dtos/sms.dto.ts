import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { SmsMode } from '@/database';

/** E.164: "+" then 7 to 15 digits (the pro space lets the manager type spaces; they are removed before). */
export const E164_RE = /^\+[1-9]\d{6,14}$/;

/** PUT /internal/sms/settings. The gateway fields are checked by the service (password optional when already stored). */
export class UpdateSmsSettingsDto {
  @IsEnum(SmsMode, { message: 'invalid_sms_mode' })
  public mode: SmsMode;

  @ValidateIf(o => o.mode === 'gateway')
  @IsOptional()
  @IsString({ message: 'required' })
  @MaxLength(100, { message: 'too_long' })
  public login?: string;

  @ValidateIf(o => o.mode === 'gateway')
  @IsOptional()
  @IsString({ message: 'required' })
  @MaxLength(200, { message: 'too_long' })
  public password?: string;

  @ValidateIf(o => o.mode === 'gateway')
  @IsOptional()
  @Matches(E164_RE, { message: 'invalid_phone' })
  public senderPhone?: string;

  /** Private server (advanced): https://… ; empty or absent = the public cloud server. */
  @ValidateIf(o => o.mode === 'gateway' && !!o.baseUrl)
  @IsOptional()
  @Matches(/^https:\/\/[^\s/]+(\/[^\s]*)?$/, { message: 'invalid_url' })
  @MaxLength(200, { message: 'too_long' })
  public baseUrl?: string | null;
}

/** POST /internal/sms/test */
export class TestSmsDto {
  @Matches(E164_RE, { message: 'invalid_phone' })
  public to: string;
}
