import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StaffRole } from '@/database';

export const STAFF_ROLES = Object.values(StaffRole);
export const MIN_PASSWORD_LENGTH = 10;

// Validation messages are codes: the clients translate them.
export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public name: string;

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
