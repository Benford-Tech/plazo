import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CancellationPolicy } from '@/database';
import { SERVICES, SLUG_RE } from '@/domain/listing';
import { PHONE_RE } from './reservation.dto';

export class UpdateListingDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'invalid_airport' })
  public airportCode: string;

  @IsString()
  @Matches(SLUG_RE, { message: 'invalid_slug' })
  @MaxLength(60, { message: 'too_long' })
  public slug: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(80, { message: 'too_long' })
  public title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'too_long' })
  public description?: string | null;

  @IsArray({ message: 'invalid' })
  @ArrayMaxSize(SERVICES.length, { message: 'too_many_items' })
  @IsIn(SERVICES, { each: true, message: 'invalid_service' })
  public services: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  @Max(60, { message: 'too_large' })
  public shuttleMinutes?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'number' })
  @Min(0, { message: 'min_0' })
  @Max(50, { message: 'too_large' })
  public distanceKm?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'too_long' })
  public openingHours?: string | null;

  /** Phone travellers can call; left unchanged when absent, cleared with null or "". */
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @Matches(PHONE_RE, { message: 'invalid_phone' })
  @IsString({ message: 'invalid_phone' })
  public contactPhone?: string | null;

  @IsIn(Object.values(CancellationPolicy), { message: 'invalid_policy' })
  public cancellationPolicy: CancellationPolicy;

  @IsArray({ message: 'invalid' })
  @ArrayMaxSize(12, { message: 'too_many_items' })
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true, message: 'invalid_url' })
  public photos: string[];
}

export class PricingTierDto {
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  @Max(90, { message: 'too_large' })
  public days: number;

  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'min_0' })
  @Max(1000000, { message: 'too_large' })
  public priceCents: number;
}

export class UpdatePricingDto {
  @IsArray({ message: 'invalid' })
  @ArrayMaxSize(90, { message: 'too_many_items' })
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  public tiers: PricingTierDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'min_0' })
  @Max(100000, { message: 'too_large' })
  public extraDayPriceCents?: number | null;
}
