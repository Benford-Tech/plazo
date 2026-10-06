import { Type } from 'class-transformer';
import {
  Equals,
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DATETIME, PHONE_RE, PLATE_RE } from './reservation.dto';

/** Letters (any alphabet, accents), spaces, apostrophes, hyphens and periods: "Jean-Luc O’Neil", "J. Dupont". */
export const PERSON_NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;

/** A random key from the site's form (UUID or similar). */
export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9-]{16,64}$/;

/** Refuses names that read as a web address ("www.example", "example.com"): a period directly followed by two letters. */
@ValidatorConstraint({ name: 'noDomainLike' })
class NoDomainLike implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value !== 'string' || !/\.\p{L}{2,}/u.test(value);
  }
}

// class-validator reports a field's failed constraints from the lowest decorator up, and the API
// returns the first one: the most basic check ("required") goes last.

/** A booking made by a traveller on the site. Dates are local to the parking ("2026-10-04T06:30"). */
export class CreatePublicBookingDto {
  @MaxLength(80, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public airport: string;

  @MaxLength(80, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public parking: string;

  @Matches(DATETIME, { message: 'invalid_datetime' })
  @IsString({ message: 'required' })
  public arrivalAt: string;

  @Matches(DATETIME, { message: 'invalid_datetime' })
  @IsString({ message: 'required' })
  public returnAt: string;

  // Shown in the emails sent from the platform's address: a person's name only, no links or
  // control characters (the form is anonymous, the name must not carry a message).
  @Matches(PERSON_NAME_RE, { message: 'invalid_name' })
  @Validate(NoDomainLike, { message: 'invalid_name' })
  @MaxLength(120, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerName: string;

  @Matches(PHONE_RE, { message: 'invalid_phone' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerPhone: string;

  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerEmail: string;

  @Matches(PLATE_RE, { message: 'invalid_plate' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public plate: string;

  @IsOptional()
  @MaxLength(10, { message: 'invalid_flight' })
  @IsString({ message: 'invalid_flight' })
  public returnFlight?: string | null;

  /** Outbound flight (V-A, 05/10/2026): the shuttle to the terminal is planned before its take-off. */
  @IsOptional()
  @MaxLength(10, { message: 'invalid_flight' })
  @IsString({ message: 'invalid_flight' })
  public departureFlight?: string | null;

  @Max(9, { message: 'passengers_range' })
  @Min(1, { message: 'passengers_range' })
  @IsInt({ message: 'integer' })
  @IsDefined({ message: 'required' })
  @Type(() => Number)
  public passengers: number;

  /** The traveller ticked "I accept the terms of sale". */
  @Equals(true, { message: 'terms_required' })
  public acceptTerms: boolean;

  /**
   * Random key of the booking form (one per page shown): sending the same form twice (retry after
   * a timeout, double submit) returns the booking already made instead of creating another.
   */
  @IsOptional()
  @Matches(IDEMPOTENCY_KEY_RE, { message: 'invalid_idempotency_key' })
  @IsString({ message: 'invalid_idempotency_key' })
  public idempotencyKey?: string;
}

/** Finding a booking again: its reference and the email given when booking. */
export class LookupBookingDto {
  @MaxLength(20, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public reference: string;

  @MaxLength(254, { message: 'invalid_email' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public email: string;
}

/** New return flight; empty or null clears it (the field itself is required). The outbound flight may come along. */
export class UpdateBookingFlightDto {
  @ValidateIf((_, value) => value !== null)
  @MaxLength(10, { message: 'invalid_flight' })
  @IsString({ message: 'invalid_flight' })
  @IsDefined({ message: 'required' })
  public returnFlight: string | null;

  @IsOptional()
  @MaxLength(10, { message: 'invalid_flight' })
  @IsString({ message: 'invalid_flight' })
  public departureFlight?: string | null;
}

/** The car's position after parking (06/10/2026): the phone's GPS fix, with an optional short note. */
export class CarLocationDto {
  @Max(90, { message: 'invalid_position' })
  @Min(-90, { message: 'invalid_position' })
  @IsNumber({}, { message: 'invalid_position' })
  @IsDefined({ message: 'required' })
  @Type(() => Number)
  public lat: number;

  @Max(180, { message: 'invalid_position' })
  @Min(-180, { message: 'invalid_position' })
  @IsNumber({}, { message: 'invalid_position' })
  @IsDefined({ message: 'required' })
  @Type(() => Number)
  public lng: number;

  @IsOptional()
  @Max(10000, { message: 'invalid_accuracy' })
  @Min(0, { message: 'invalid_accuracy' })
  @IsInt({ message: 'invalid_accuracy' })
  @Type(() => Number)
  public accuracyM?: number | null;

  @IsOptional()
  @MaxLength(120, { message: 'too_long' })
  @IsString({ message: 'too_long' })
  public note?: string | null;
}
