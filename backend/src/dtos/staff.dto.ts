import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StaffRole } from '@/database';
import { trimString } from './reservation.dto';

export const STAFF_ROLES = Object.values(StaffRole);
export const MIN_PASSWORD_LENGTH = 10;

// Validation messages are codes: the clients translate them. Names are trimmed first (09/10/2026): a blank one is "required".
export class CreateStaffDto {
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public firstName: string;

  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public lastName: string;

  @IsEmail({}, { message: 'invalid_email' })
  public email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'too_long' })
  public phone?: string;

  @IsIn(STAFF_ROLES, { message: 'invalid_role' })
  public role: StaffRole;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'password_too_short' })
  @MaxLength(200, { message: 'too_long' })
  public password: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsIn(STAFF_ROLES, { message: 'invalid_role' })
  public role?: StaffRole;

  @IsOptional()
  @IsBoolean()
  public isActive?: boolean;

  /** « Modifier le nom » (09/10/2026): either or both; a blank one is refused ("required"). */
  @IsOptional()
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public firstName?: string;

  @IsOptional()
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public lastName?: string;
}

/** « Votre nom » (09/10/2026): one's own first and last name, both required. */
export class UpdateMeDto {
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public firstName: string;

  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public lastName: string;
}

/** "Aujourd'hui, je suis…" (R-C): the post held for the day. */
export class SetPostDto {
  @IsIn(STAFF_ROLES, { message: 'invalid_post' })
  public post: StaffRole;
}

/** "Mon véhicule aujourd'hui" (V-A): a vehicle of the operator, or null to hand it back. */
export class SetVehicleDto {
  @IsOptional()
  @MaxLength(40, { message: 'invalid' })
  @IsString({ message: 'invalid' })
  public vehicleId?: string | null;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'password_too_short' })
  @MaxLength(200, { message: 'too_long' })
  public password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  public currentPassword: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'password_too_short' })
  @MaxLength(200, { message: 'too_long' })
  public newPassword: string;
}
