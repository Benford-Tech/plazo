import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_CHILD_SEATS_PER_KIND } from '@/domain/child-seats';

/** Child car seats for the shuttle (24/10/2026): how many children of each age group, 0 to 4 each. */
export class ChildSeatsDto {
  @Max(MAX_CHILD_SEATS_PER_KIND, { message: 'child_seats_range' })
  @Min(0, { message: 'child_seats_range' })
  @IsInt({ message: 'child_seats_range' })
  @Type(() => Number)
  public infant: number = 0;

  @Max(MAX_CHILD_SEATS_PER_KIND, { message: 'child_seats_range' })
  @Min(0, { message: 'child_seats_range' })
  @IsInt({ message: 'child_seats_range' })
  @Type(() => Number)
  public toddler: number = 0;

  @Max(MAX_CHILD_SEATS_PER_KIND, { message: 'child_seats_range' })
  @Min(0, { message: 'child_seats_range' })
  @IsInt({ message: 'child_seats_range' })
  @Type(() => Number)
  public booster: number = 0;
}
