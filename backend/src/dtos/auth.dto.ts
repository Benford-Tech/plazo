import { Type } from 'class-transformer';
import { Equals, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PHONE_RE } from './reservation.dto';
import { MIN_PASSWORD_LENGTH } from './staff.dto';

export class LoginDto {
  @IsEmail({}, { message: 'invalid_email' })
  public email: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  public password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  public refreshToken: string;
}

/** Self sign-up of an operator (public). Validation messages are codes translated by the pro space. */
export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(80, { message: 'too_long' })
  public parkingName: string;

  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  @Max(10000, { message: 'too_large' })
  public totalCapacity: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'unknown_airport' })
  public airportCode: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(60, { message: 'too_long' })
  public firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(60, { message: 'too_long' })
  public lastName: string;

  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'too_long' })
  public email: string;

  @IsString()
  @Matches(PHONE_RE, { message: 'invalid_phone' })
  public phone: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'password_too_short' })
  @MaxLength(200, { message: 'too_long' })
  public password: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  public passwordConfirmation: string;

  @Equals(true, { message: 'terms_required' })
  public acceptTerms: boolean;

  /** Honeypot: hidden from people, filled by bots. Anything in it and nothing is created. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public website?: string;
}

/** A single-use link's token (email verification, invitation). */
export class AccountTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(200, { message: 'invalid_link' })
  public token: string;
}

export class AcceptInvitationDto extends AccountTokenDto {
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'password_too_short' })
  @MaxLength(200, { message: 'too_long' })
  public password: string;
}
