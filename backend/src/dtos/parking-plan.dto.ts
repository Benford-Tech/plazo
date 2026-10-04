import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateBy,
  ValidateNested,
  ValidationOptions,
} from 'class-validator';
import { CAPACITY_LIMITS, checkFeatureList, checkGeometry, checkObject, checkParcels, isPosition } from '@/domain/geojson';

type Check = { ok: true } | { ok: false; code: string };

export const PLAN_LIMITS = {
  maxSpots: 5000,
  maxLandmarks: 50,
  maxCodeLength: 12,
} as const;

export const LANDMARK_KINDS = ['entrance', 'exit', 'handover', 'shuttle_stop', 'key_box'] as const;
export const SPOT_KINDS = ['standard', 'large', 'covered', 'pmr', 'reserved'] as const;
export const LAYOUT_KEYS = ['selfPark', 'valet24', 'valet5'] as const;

/** Same mechanism as the capacity study DTO: the check's code becomes the field's error. */
function Checked(name: string, check: (value: unknown) => Check, options?: ValidationOptions) {
  let lastCode = 'invalid';
  return ValidateBy(
    {
      name,
      validator: {
        validate: (value: unknown) => {
          const r = check(value);
          if (!r.ok) lastCode = r.code;
          return r.ok;
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

function landmarksCheck(value: unknown): Check {
  if (!Array.isArray(value)) return { ok: false, code: 'invalid' };
  if (value.length > PLAN_LIMITS.maxLandmarks) return { ok: false, code: 'too_many_items' };
  for (const item of value) {
    if (!item || typeof item !== 'object') return { ok: false, code: 'invalid' };
    const { id, kind, geometry } = item as Record<string, unknown>;
    if (typeof id !== 'string' || id.length > 40) return { ok: false, code: 'invalid' };
    if (!LANDMARK_KINDS.includes(kind as (typeof LANDMARK_KINDS)[number])) return { ok: false, code: 'invalid_kind' };
    const g = checkGeometry(geometry, ['Point']);
    if (!g.ok) return g;
  }
  return { ok: true };
}

/** A closed ring of 5 positions (4 corners + the first again), as the layout generator emits. */
function ringCheck(value: unknown): Check {
  if (!Array.isArray(value) || value.length < 4 || value.length > 6 || !value.every(isPosition)) return { ok: false, code: 'invalid_geometry' };
  return { ok: true };
}

/** Every field is optional: the plan is saved as it is drawn (autosave). */
export class UpdateParkingPlanDto {
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
  @Checked('landmarks', landmarksCheck)
  public landmarks?: unknown;
}

export class SpotInputDto {
  @IsString()
  @MaxLength(40, { message: 'too_long' })
  public zoneId: string;

  @IsString()
  @Matches(/^[A-Z0-9][A-Z0-9-]{0,11}$/, { message: 'invalid_code' })
  public code: string;

  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  public row: number;

  @IsInt({ message: 'integer' })
  @Min(1, { message: 'min_1' })
  public index: number;

  @IsOptional()
  @IsIn(SPOT_KINDS, { message: 'invalid_kind' })
  public kind?: (typeof SPOT_KINDS)[number];

  @IsOptional()
  @IsBoolean({ message: 'boolean' })
  public active?: boolean;

  @Checked('geometry', ringCheck)
  public geometry: [number, number][];
}

/** Replaces every spot of the plan (a new generation, or the plan after manual edits). */
export class ReplaceSpotsDto {
  @IsIn(LAYOUT_KEYS, { message: 'invalid_layout' })
  public layout: (typeof LAYOUT_KEYS)[number];

  @IsArray()
  @ArrayMaxSize(PLAN_LIMITS.maxSpots, { message: 'too_many_items' })
  @ValidateNested({ each: true })
  @Type(() => SpotInputDto)
  public spots: SpotInputDto[];
}

export class UpdateSpotDto {
  @IsOptional()
  @IsBoolean({ message: 'boolean' })
  public active?: boolean;

  @IsOptional()
  @IsIn(SPOT_KINDS, { message: 'invalid_kind' })
  public kind?: (typeof SPOT_KINDS)[number];

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9][A-Z0-9-]{0,11}$/, { message: 'invalid_code' })
  public code?: string;
}

/** Server-side generation (the app): the engine runs on the stored plan. */
export class GenerateSpotsDto {
  @IsIn(LAYOUT_KEYS, { message: 'invalid_layout' })
  public layout: (typeof LAYOUT_KEYS)[number];

  @IsOptional()
  @IsBoolean({ message: 'boolean' })
  public applyCapacity?: boolean;
}
