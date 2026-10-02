import { AuthRoute } from './auth.route';
import { CronRoute } from './cron.route';
import { HealthRoute } from './health.route';
import { ListingRoute } from './listing.route';
import { ParkingRoute } from './parking.route';
import { PlatformRoute } from './platform.route';
import { PublicBookingRoute } from './public-booking.route';
import { PublicRoute } from './public.route';
import { ReservationRoute } from './reservation.route';
import { StaffRoute } from './staff.route';

const AppRoutes = [
  new HealthRoute(),
  new AuthRoute(),
  new StaffRoute(),
  new ParkingRoute(),
  new ReservationRoute(),
  new ListingRoute(),
  new PlatformRoute(),
  new PublicRoute(),
  new PublicBookingRoute(),
  new CronRoute(),
];

export default AppRoutes;
