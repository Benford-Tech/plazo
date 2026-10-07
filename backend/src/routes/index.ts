import { ArrivalRoute } from './arrival.route';
import { AuthRoute } from './auth.route';
import { CronRoute } from './cron.route';
import { DashboardRoute } from './dashboard.route';
import { HealthRoute } from './health.route';
import { InboundEmailRoute } from './inbound-email.route';
import { ListingRoute } from './listing.route';
import { ParkingRoute } from './parking.route';
import { PaymentRoute } from './payment.route';
import { PlatformRoute } from './platform.route';
import { PublicBookingRoute } from './public-booking.route';
import { PublicRoute } from './public.route';
import { ReminderRoute } from './reminder.route';
import { ReservationRoute } from './reservation.route';
import { ReturnRoute } from './return.route';
import { SmsRoute } from './sms.route';
import { StaffRoute } from './staff.route';

const AppRoutes = [
  new HealthRoute(),
  new AuthRoute(),
  new StaffRoute(),
  new ParkingRoute(),
  new ReservationRoute(),
  new DashboardRoute(),
  new ListingRoute(),
  new PlatformRoute(),
  new PublicRoute(),
  new PublicBookingRoute(),
  new ArrivalRoute(),
  new ReturnRoute(),
  new PaymentRoute(),
  new SmsRoute(),
  new InboundEmailRoute(),
  new ReminderRoute(),
  new CronRoute(),
];

export default AppRoutes;
