import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ReservationChannel, ReservationStatus } from '@/database';

export const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
export const PHONE_RE = /^\+?[0-9 .()-]{6,20}$/;
export const PLATE_RE = /^[A-Za-z0-9 -]{2,15}$/;
// "plazo" bookings are made by travellers on the site only.
const STAFF_CHANNELS = Object.values(ReservationChannel).filter(c => c !== 'plazo');
const CHANNELS = Object.values(ReservationChannel);
const STATUSES = Object.values(ReservationStatus);

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

  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public customerName: string;

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

  /** The stop serving this traveller (D-A): a stop of the parking; absent or null: the airport. */
  @IsOptional()
  @IsString({ message: 'invalid_stop' })
  @MaxLength(40, { message: 'invalid_stop' })
  public stopId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'too_long' })
  public notes?: string;

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

  @IsOptional()
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
  @IsString({ message: 'invalid_stop' })
  @MaxLength(40, { message: 'invalid_stop' })
  public stopId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'too_long' })
  public notes?: string | null;

  @IsOptional()
  @IsBoolean()
  public force?: boolean;
}

export class ChangeStatusDto {
  @IsIn(STATUSES, { message: 'invalid_status' })
  public status: ReservationStatus;
}
