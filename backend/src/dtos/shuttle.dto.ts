import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
