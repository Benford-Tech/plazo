import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateBy, ValidationOptions } from 'class-validator';
import { CAPACITY_LIMITS, checkFeatureList, checkGeometry, checkMarkers, checkObject, checkParcels } from '@/domain/geojson';

type Check = { ok: true } | { ok: false; code: string };

/**
 * Runs a structural check and reports its code (e.g. `too_many_vertices`) as the field's error.
 * `ValidationMiddleware` keeps the first message of each field: the code is the message.
 */
function Checked(name: string, check: (value: unknown) => Check, options?: ValidationOptions) {
  let lastCode = 'invalid';
  return ValidateBy(
    {
      name,
      validator: {
        validate: (value: unknown) => {
          const result = check(value);
          if (!result.ok) lastCode = result.code;
          return result.ok;
        },
        defaultMessage: () => lastCode,
      },
    },
    options,
  );
}

const outlineCheck = (value: unknown) => (value === null ? ({ ok: true } as const) : checkGeometry(value, ['Polygon']));
const zonesCheck = (value: unknown) => checkFeatureList(value, { maxItems: CAPACITY_LIMITS.maxZones, geometry: ['Polygon'] });
const exclusionsCheck = (value: unknown) =>
  checkFeatureList(value, { maxItems: CAPACITY_LIMITS.maxExclusions, geometry: ['Polygon', 'LineString', 'Point'], withKind: true });
const settingsCheck = (value: unknown) => checkObject(value, CAPACITY_LIMITS.maxSettingsBytes);
const resultsCheck = (value: unknown) => checkObject(value, CAPACITY_LIMITS.maxResultsBytes);

/** Every field is optional: a study starts empty and is saved as it is drawn (autosave). */
abstract class CapacityStudyFieldsDto {
  @IsOptional()
  @Checked('outline', outlineCheck)
  public outline?: unknown;

  @IsOptional()
  @Checked('parcels', checkParcels)
  public parcels?: unknown;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'number' })
  @Min(0.5, { message: 'scale_range' })
  @Max(2, { message: 'scale_range' })
  public scaleFactor?: number;

  @IsOptional()
  @Checked('zones', zonesCheck)
  public zones?: unknown;

  @IsOptional()
  @Checked('exclusions', exclusionsCheck)
  public exclusions?: unknown;

  @IsOptional()
  @Checked('settings', settingsCheck)
  public settings?: unknown;

  @IsOptional()
  @Checked('results', resultsCheck)
  public results?: unknown;

  @IsOptional()
  @Checked('carMarkers', checkMarkers)
  public carMarkers?: unknown;
}

export class CreateCapacityStudyDto extends CapacityStudyFieldsDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(CAPACITY_LIMITS.maxNameLength, { message: 'too_long' })
  public name: string;
}

export class UpdateCapacityStudyDto extends CapacityStudyFieldsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'required' })
  @MaxLength(CAPACITY_LIMITS.maxNameLength, { message: 'too_long' })
  public name?: string;
}
