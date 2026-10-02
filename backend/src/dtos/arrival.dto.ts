import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const KINDS = ['outbound', 'return'];

// class-validator reports a field's failed constraints from the lowest decorator up, and the API
// returns the first one: the most basic check ("required") goes last.

export class StartArrivalDto {
  @IsIn(KINDS, { message: 'invalid_kind' })
  public kind: 'outbound' | 'return';

  // The traveller ticked / tapped the explicit consent: nothing is shared without it.
  @Equals(true, { message: 'consent_required' })
  public consent: boolean;
}

export class ArrivalPositionDto {
  @IsLatitude({ message: 'invalid_lat' })
  @IsNumber({}, { message: 'required' })
  public lat: number;

  @IsLongitude({ message: 'invalid_lng' })
  @IsNumber({}, { message: 'required' })
  public lng: number;

  /** Accuracy radius in metres, as given by the phone. */
  @IsOptional()
  @Max(100000, { message: 'invalid_accuracy' })
  @Min(0, { message: 'invalid_accuracy' })
  @IsNumber({}, { message: 'invalid_accuracy' })
  public accuracy?: number | null;

  @IsISO8601({ strict: true }, { message: 'invalid_datetime' })
  @IsString({ message: 'required' })
  public recordedAt: string;
}

export class AnnounceArrivalDto {
  @IsIn(KINDS, { message: 'invalid_kind' })
  public kind: 'outbound' | 'return';

  @IsIn([10, 20, 30], { message: 'invalid_minutes' })
  @Type(() => Number)
  public minutes: number;
}

export class AtMeetingPointDto {
  @IsIn(KINDS, { message: 'invalid_kind' })
  public kind: 'outbound' | 'return';

  @ValidateIf(o => o.lng !== undefined && o.lng !== null)
  @IsLatitude({ message: 'invalid_lat' })
  @IsNumber({}, { message: 'required' })
  public lat?: number | null;

  @ValidateIf(o => o.lat !== undefined && o.lat !== null)
  @IsLongitude({ message: 'invalid_lng' })
  @IsNumber({}, { message: 'required' })
  public lng?: number | null;
}

export class StopArrivalDto {
  @IsOptional()
  @IsIn(KINDS, { message: 'invalid_kind' })
  public kind?: 'outbound' | 'return';
}

export class ReturnMeetingPointDto {
  /** null clears the point (the airport is used). */
  @ValidateIf(o => o.lat !== null)
  @IsLatitude({ message: 'invalid_lat' })
  @IsNumber({}, { message: 'required' })
  public lat: number | null;

  @ValidateIf(o => o.lat !== null)
  @IsLongitude({ message: 'invalid_lng' })
  @IsNumber({}, { message: 'required' })
  public lng: number | null;

  @IsOptional()
  @MaxLength(80, { message: 'too_long' })
  @IsString()
  public label?: string | null;
}

export class RegisterDeviceDto {
  @MaxLength(100, { message: 'too_long' })
  @IsString({ message: 'required' })
  public subscriptionId: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'], { message: 'invalid_platform' })
  public platform?: 'ios' | 'android' | 'web';
}

export class NotificationPreferencesDto {
  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public arrivals?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public returns?: boolean;
}
