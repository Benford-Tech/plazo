import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ReservationChannel, ReservationStatus } from '@/database';

export const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
export const PHONE_RE = /^\+?[0-9 .()-]{6,20}$/;
export const PLATE_RE = /^[A-Za-z0-9 -]{2,15}$/;
// "plazo" bookings are made by travellers on the site only.
const STAFF_CHANNELS = Object.values(ReservationChannel).filter(c => c !== 'plazo');
const CHANNELS = Object.values(ReservationChannel);
const STATUSES = Object.values(ReservationStatus);

/** Trims a string field before it is checked (a blank name is "required"). */
export const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * 09/10/2026: a body with a single `customerName` and neither `customerFirstName` nor `customerLastName` comes from an older
 * app version still in the stores: accepted, and split at the first space (first name / the rest).
 */
export const isLegacyName = (body: { customerFirstName?: unknown; customerLastName?: unknown; customerName?: unknown }) =>
  body.customerFirstName == null && body.customerLastName == null && body.customerName != null;

// Dates: "2026-10-04T06:30" (local to the parking) or an ISO instant with offset.
export class CreateReservationDto {
  @IsIn(STAFF_CHANNELS, { message: 'invalid_channel' })
  public channel: ReservationChannel;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'too_long' })
  public channelDetail?: string;

  @Matches(DATETIME, { message: 'invalid_datetime' })
  public arrivalAt: string;

  @Matches(DATETIME, { message: 'invalid_datetime' })
  public returnAt: string;

  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'passengers_range' })
  @Max(9, { message: 'passengers_range' })
  public passengers: number;

  /** 09/10/2026: the traveller's first and last name, both required; the server stores "Prénom Nom" as `customerName`. */
  @ValidateIf(body => !isLegacyName(body))
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerFirstName?: string;

  @ValidateIf(body => !isLegacyName(body))
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerLastName?: string;

  /** Older app versions: the whole name in one field, split at the first space; ignored when the two fields above are sent. */
  @ValidateIf(body => isLegacyName(body))
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public customerName?: string;

  @IsString()
  @Matches(PHONE_RE, { message: 'invalid_phone' })
  public customerPhone: string;

  @IsOptional()
  @IsEmail({}, { message: 'invalid_email' })
  public customerEmail?: string;

  @IsString()
  @Matches(PLATE_RE, { message: 'invalid_plate' })
  public plate: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'invalid_flight' })
  public returnFlight?: string;

  /** Outbound flight (V-A): sets when the shuttle to the terminal must leave. */
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'invalid_flight' })
  public departureFlight?: string;

  /** The stop serving this traveller (D-A): a stop of the parking; absent or null: the airport. */
  @IsOptional()
  @IsString({ message: 'invalid_stop' })
  @MaxLength(40, { message: 'invalid_stop' })
  public stopId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'too_long' })
  public notes?: string;

  /** E (06/10/2026): the traveller's message and vehicle, as typed at the counter or on the phone. */
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'too_long' })
  public customerNote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'too_long' })
  public vehicleModel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'too_long' })
  public vehicleColour?: string | null;

  /** Booking number on the source channel (imports), unique per operator. */
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'too_long' })
  public externalReference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'min_0' })
  @Max(10000000, { message: 'too_large' })
  public priceCents?: number;

  /** Save even if a night is full (staff only, audited). */
  @IsOptional()
  @IsBoolean()
  public force?: boolean;
}

export class ParseEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(100000, { message: 'too_long' })
  public text: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsIn(CHANNELS, { message: 'invalid_channel' })
  public channel?: ReservationChannel;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'too_long' })
  public channelDetail?: string | null;

  @IsOptional()
  @Matches(DATETIME, { message: 'invalid_datetime' })
  public arrivalAt?: string;

  @IsOptional()
  @Matches(DATETIME, { message: 'invalid_datetime' })
  public returnAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'passengers_range' })
  @Max(9, { message: 'passengers_range' })
  public passengers?: number;

  /** 09/10/2026: either or both, merged with the stored name; a blank one is refused ("required"). */
  @IsOptional()
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerFirstName?: string;

  @IsOptional()
  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public customerLastName?: string;

  /** Older app versions: the whole name, split at the first space; ignored when a first or last name is sent. */
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public customerName?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_RE, { message: 'invalid_phone' })
  public customerPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'invalid_email' })
  public customerEmail?: string | null;

  @IsOptional()
  @IsString()
  @Matches(PLATE_RE, { message: 'invalid_plate' })
  public plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'invalid_flight' })
  public returnFlight?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'invalid_flight' })
  public departureFlight?: string | null;

  @IsOptional()
  @IsString({ message: 'invalid_stop' })
  @MaxLength(40, { message: 'invalid_stop' })
  public stopId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'too_long' })
  public notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'too_long' })
  public customerNote?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'too_long' })
  public vehicleModel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'too_long' })
  public vehicleColour?: string | null;

  @IsOptional()
  @IsBoolean()
  public force?: boolean;
}

export class ChangeStatusDto {
  @IsIn(STATUSES, { message: 'invalid_status' })
  public status: ReservationStatus;

  /** A remark saved with the change (06/10/2026): damage noticed at the handover, a dispute… */
  @IsOptional()
  @MaxLength(500, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public note?: string;
}

/** CA-B (09/10/2026): the amount of a booking, in euro cents; null clears it. */
export class SetPriceDto {
  // Required: an integer, or null to clear it (the decorator listed last reports first: « integer » for a missing value).
  @ValidateIf((dto: SetPriceDto) => dto.priceCents !== null)
  @Min(0, { message: 'min_0' })
  @Max(10000000, { message: 'too_large' })
  @IsInt({ message: 'integer' })
  public priceCents!: number | null;
}
