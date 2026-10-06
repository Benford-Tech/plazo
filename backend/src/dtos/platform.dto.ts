import { Transform, Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateIf } from 'class-validator';

// Validation messages are codes: the pro space translates them.
const MAX_COMMISSION_BPS = 5000;

export class UpdateCommissionDto {
  /** Basis points (1200 = 12 %); null: back to the platform default. */
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'min_0' })
  @Max(MAX_COMMISSION_BPS, { message: 'commission_range' })
  public commissionBps: number | null;
}

export class InviteOperatorDto {
  /** Name of the company or parking (used for both until the operator changes it). */
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(80, { message: 'too_long' })
  public operatorName: string;

  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'too_long' })
  public managerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'too_long' })
  public managerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'too_long' })
  public managerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'too_long' })
  public managerLastName?: string;

  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  @Max(10000, { message: 'too_large' })
  public totalCapacity: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'min_0' })
  @Max(MAX_COMMISSION_BPS, { message: 'commission_range' })
  public commissionBps?: number | null;
}

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RejectListingDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(1000, { message: 'too_long' })
  public message: string;
}

export class UnpublishListingDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'too_long' })
  public message?: string;
}

/** A push from the platform (E-A, 05/10/2026): to every operator's staff, every traveller, or one operator's staff. */
export class PlatformNotificationDto {
  @IsIn(['staff', 'travellers', 'operator'], { message: 'invalid_audience' })
  public audience: 'staff' | 'travellers' | 'operator';

  /** Required with audience "operator". */
  @IsOptional()
  @IsString({ message: 'invalid' })
  @MaxLength(40, { message: 'invalid' })
  public operatorId?: string | null;

  @IsString({ message: 'required' })
  @IsNotEmpty({ message: 'required' })
  @MaxLength(50, { message: 'too_long' })
  public title: string;

  @IsString({ message: 'required' })
  @IsNotEmpty({ message: 'required' })
  @MaxLength(160, { message: 'too_long' })
  public body: string;

  /** Opened when the notification is tapped (https only). */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'invalid_url' })
  @MaxLength(300, { message: 'too_long' })
  public url?: string | null;
}
