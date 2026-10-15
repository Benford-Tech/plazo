import { IsBoolean } from 'class-validator';

/** PUT /internal/test-feed: the continuous fictional travellers of the platform's test operator, on or off. */
export class SetTestFeedDto {
  @IsBoolean({ message: 'invalid' })
  public enabled!: boolean;
}
