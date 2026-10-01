import { AuthRoute } from './auth.route';
import { CronRoute } from './cron.route';
import { HealthRoute } from './health.route';
import { ListingRoute } from './listing.route';
import { ParkingRoute } from './parking.route';
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
  new PublicRoute(),
  new CronRoute(),
];

export default AppRoutes;
