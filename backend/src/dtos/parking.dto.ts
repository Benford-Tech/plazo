import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ShuttleTracking } from '@/database';
import { SHUTTLE_TRACKING_LEVELS } from '@/domain/shuttle-tracking';

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

  /** Shuttle waves (V-A): minutes before take-off the traveller must be at the terminal. */
  @IsOptional()
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'lead_range' })
  @Max(360, { message: 'lead_range' })
  public terminalLeadMinutes?: number;

  /** Minutes after the landing before the traveller reaches the meeting point. */
  @IsOptional()
  @IsInt({ message: 'integer' })
  @Min(0, { message: 'delay_range' })
  @Max(180, { message: 'delay_range' })
  public landingDelayMinutes?: number;
}

/** PUT /internal/parkings/:id/shuttle-tracking (R-B, 07/10/2026). */
export class UpdateShuttleTrackingDto {
  @IsIn(SHUTTLE_TRACKING_LEVELS as unknown as string[], { message: 'invalid_tracking' })
  public tracking: ShuttleTracking;
}
