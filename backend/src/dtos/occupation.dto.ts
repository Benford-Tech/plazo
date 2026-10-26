import { Type } from 'class-transformer';
import { CarLocationDto } from './public-booking.dto';
import { IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested, IsBoolean } from 'class-validator';

/** Puts a vehicle on a spot (or takes it off with `spotId: null`), with where its keys hang. */
export class AssignSpotDto {
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @MaxLength(40, { message: 'too_long' })
  public spotId: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @Matches(/^[A-Za-z0-9 -]{1,12}$/, { message: 'invalid_key_hook' })
  public keyHook?: string | null;

  /** The valet's GPS fix where the car stands (06/10/2026), taken as the spot is assigned. */
  @IsOptional()
  @ValidateNested()
  @Type(() => CarLocationDto)
  public car?: CarLocationDto | null;
}

/** « Clés laissées » (26/10/2026): the keys were handed over (true) or not after all (false). */
export class KeysDto {
  @IsBoolean()
  public left: boolean;
}
