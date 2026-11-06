import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** POST /public/visits (06/11/2026, SEO local M1): the first page of a visit and where the visitor came from. */
export class VisitDto {
  @IsIn(['search', 'direct', 'referral', 'social', 'campaign'], { message: 'invalid' })
  public source: string;

  @IsOptional()
  @IsString({ message: 'invalid' })
  @MaxLength(60, { message: 'too_long' })
  public detail?: string;

  @IsString({ message: 'invalid' })
  @MaxLength(200, { message: 'too_long' })
  public landing: string;
}
