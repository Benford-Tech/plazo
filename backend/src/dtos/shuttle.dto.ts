import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** The vehicle sheet (V-A "Fiche complète", 04/10/2026). */
export class ShuttleVehicleDto {
  @MaxLength(60, { message: 'too_long' })
  @MinLength(1, { message: 'required' })
  @IsString({ message: 'required' })
  public model: string;

  @IsOptional()
  @MaxLength(30, { message: 'too_long' })
  @IsString()
  public colour?: string | null;

  @IsOptional()
  @MaxLength(15, { message: 'too_long' })
  @IsString()
  public plate?: string | null;

  /** Passenger seats, the driver's excluded. */
  @IsOptional()
  @Max(60, { message: 'invalid_seats' })
  @Min(1, { message: 'invalid_seats' })
  @IsInt({ message: 'invalid_seats' })
  public seats?: number | null;

  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public inService?: boolean;

  /** The usual driver (a member of the team), preselected in their app. */
  @IsOptional()
  @MaxLength(40, { message: 'invalid_driver' })
  @IsString({ message: 'invalid_driver' })
  public driverId?: string | null;
}

/** Same sheet, every field optional (PATCH). */
export class UpdateShuttleVehicleDto {
  @IsOptional()
  @MaxLength(60, { message: 'too_long' })
  @MinLength(1, { message: 'required' })
  @IsString({ message: 'required' })
  public model?: string;

  @IsOptional()
  @MaxLength(30, { message: 'too_long' })
  @IsString()
  public colour?: string | null;

  @IsOptional()
  @MaxLength(15, { message: 'too_long' })
  @IsString()
  public plate?: string | null;

  @IsOptional()
  @Max(60, { message: 'invalid_seats' })
  @Min(1, { message: 'invalid_seats' })
  @IsInt({ message: 'invalid_seats' })
  public seats?: number | null;

  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public inService?: boolean;

  @IsOptional()
  @MaxLength(40, { message: 'invalid_driver' })
  @IsString({ message: 'invalid_driver' })
  public driverId?: string | null;
}

/** The vehicle typed by the driver when the operator has none on file. */
export class FreeVehicleDto {
  @IsOptional()
  @MaxLength(60, { message: 'too_long' })
  @IsString()
  public model?: string | null;

  @IsOptional()
  @MaxLength(30, { message: 'too_long' })
  @IsString()
  public colour?: string | null;

  @IsOptional()
  @MaxLength(15, { message: 'too_long' })
  @IsString()
  public plate?: string | null;
}

export class StartTripDto {
  @ArrayMaxSize(30, { message: 'too_many' })
  @ArrayMinSize(1, { message: 'required' })
  @IsString({ each: true, message: 'invalid' })
  @IsArray({ message: 'required' })
  public reservationIds: string[];

  @IsOptional()
  @IsString()
  public vehicleId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => FreeVehicleDto)
  public vehicle?: FreeVehicleDto | null;

  /** `pickup` (default): to the airport for returning travellers; `dropoff`: to the terminal with arrived ones. */
  @IsOptional()
  @IsIn(['pickup', 'dropoff'], { message: 'invalid_direction' })
  public direction?: 'pickup' | 'dropoff';
}

export class TripPositionDto {
  @IsLatitude({ message: 'invalid_lat' })
  @IsNumber({}, { message: 'required' })
  public lat: number;

  @IsLongitude({ message: 'invalid_lng' })
  @IsNumber({}, { message: 'required' })
  public lng: number;

  @IsOptional()
  @Max(100000, { message: 'invalid_accuracy' })
  @Min(0, { message: 'invalid_accuracy' })
  @IsNumber({}, { message: 'invalid_accuracy' })
  public accuracy?: number | null;

  @IsISO8601({ strict: true }, { message: 'invalid_datetime' })
  @IsString({ message: 'required' })
  public recordedAt: string;
}
