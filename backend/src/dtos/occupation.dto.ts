import { IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/** Puts a vehicle on a spot (or takes it off with `spotId: null`), with where its keys hang. */
export class AssignSpotDto {
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(40, { message: 'too_long' })
  public spotId: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^[A-Za-z0-9 -]{1,12}$/, { message: 'invalid_key_hook' })
  public keyHook?: string | null;
}
