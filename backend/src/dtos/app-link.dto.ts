import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** The platform of the phone, as the site's rebound page or the app reads it. */
export class AppLinkClaimDto {
  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}

export class AppLinkResumeDto {
  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';

  /** The short code, when the store passed it to the app (Android install referrer). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;
}
