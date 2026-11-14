import { IsBoolean, IsIn, IsOptional } from 'class-validator';

/** PUT /public/app-devices/:subscriptionId (13/11/2026): a Plazo app phone and its « Offres et bons plans » switch. */
export class AppDeviceDto {
  /** Absent: unchanged (a new phone starts without the offers). */
  @IsOptional()
  @IsBoolean({ message: 'invalid' })
  public offers?: boolean;

  @IsOptional()
  @IsIn(['ios', 'android'], { message: 'invalid' })
  public platform?: 'ios' | 'android';
}
