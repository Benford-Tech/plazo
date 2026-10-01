import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateParkingDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(120, { message: 'too_long' })
  public name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'too_long' })
  public address?: string | null;

  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  @Max(20000, { message: 'too_large' })
  public totalCapacity: number;

  @IsInt({ message: 'integer' })
  @Min(0, { message: 'margin_range' })
  @Max(50, { message: 'margin_range' })
  public safetyMarginPct: number;

  @IsInt({ message: 'integer' })
  @Min(1, { message: 'shuttle_range' })
  @Max(120, { message: 'shuttle_range' })
  public shuttleTravelMinutes: number;
}
