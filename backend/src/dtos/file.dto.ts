import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CarLocationDto } from './public-booking.dto';

/** S-C (07/10/2026): one file of the parking, as the plan editor saves it. */
export class FileInputDto {
  @IsOptional()
  @IsString({ message: 'invalid' })
  @MaxLength(40, { message: 'too_long' })
  public id?: string;

  @IsString({ message: 'invalid' })
  @Matches(/^[A-Za-z0-9-]{1,8}$/, { message: 'invalid_code' })
  public code: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @MaxLength(40, { message: 'too_long' })
  public name?: string | null;

  @IsInt({ message: 'invalid' })
  @Min(1, { message: 'too_small' })
  @Max(200, { message: 'too_large' })
  public capacity: number;

  /** [[lon, lat], [lon, lat]] from the aisle to the back, or null without a map. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsArray({ message: 'invalid' })
  public geometry?: [number, number][] | null;

  @IsOptional()
  @IsInt({ message: 'invalid' })
  public sortOrder?: number;

  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public active?: boolean;
}

export class ReplaceFilesDto {
  @IsArray({ message: 'invalid' })
  @ArrayMaxSize(500, { message: 'too_many' })
  @ValidateNested({ each: true })
  @Type(() => FileInputDto)
  public files: FileInputDto[];
}

/** Puts a vehicle in a file (or takes it out with `fileId: null`), with where its keys hang. */
export class AssignFileDto {
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @MaxLength(40, { message: 'too_long' })
  public fileId: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @Matches(/^[A-Za-z0-9 -]{1,12}$/, { message: 'invalid_key_hook' })
  public keyHook?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CarLocationDto)
  public car?: CarLocationDto | null;
}

/** Planning des files (08/10/2026): keeps an empty file for a return day by hand, or frees it with `day: null`. */
export class KeepFileDto {
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'invalid' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_day' })
  public day: string | null;
}
