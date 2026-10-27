import { DemoRoute } from './demo.route';
import { MorningEmailRoute } from './morning-email.route';
import { ArrivalRoute } from './arrival.route';
import { AuthRoute } from './auth.route';
import { ContactRoute } from './contact.route';
import { CronRoute } from './cron.route';
import { DashboardRoute } from './dashboard.route';
import { HealthRoute } from './health.route';
import { IdentityRoute } from './identity.route';
import { InboundEmailRoute } from './inbound-email.route';
import { ListingRoute } from './listing.route';
import { ParkingRoute } from './parking.route';
import { PaperworkRoute } from './paperwork.route';
import { ExtraRoute } from './extra.route';
import { ContractTemplateRoute } from './contract-template.route';
import { GettingStartedRoute } from './getting-started.route';
import { ValetRoute } from './valet.route';
import { PartnerContractRoute } from './partner-contract.route';
import { PaymentRoute } from './payment.route';
import { PlatformRoute } from './platform.route';
import { ProspectingRoute } from './prospecting.route';
import { PublicBookingRoute } from './public-booking.route';
import { AppLinkRoute } from './app-link.route';
import { PublicRoute } from './public.route';
import { ReminderRoute } from './reminder.route';
import { ReservationRoute } from './reservation.route';
import { ReturnRoute } from './return.route';
import { RevenueRoute } from './revenue.route';
import { SmsRoute } from './sms.route';
import { StaffRoute } from './staff.route';
import { TestFeedRoute } from './test-feed.route';

const AppRoutes = [
  new HealthRoute(),
  new AuthRoute(),
  new IdentityRoute(),
  new StaffRoute(),
  new ParkingRoute(),
  new ReservationRoute(),
  new PaperworkRoute(),
  new ExtraRoute(),
  new PartnerContractRoute(),
  new ContractTemplateRoute(),
  new GettingStartedRoute(),
  new ValetRoute(),
  new DashboardRoute(),
  new RevenueRoute(),
  new ListingRoute(),
  new PlatformRoute(),
  new ProspectingRoute(),
  new DemoRoute(),
  new MorningEmailRoute(),
  new PublicRoute(),
  new PublicBookingRoute(),
  new AppLinkRoute(),
  new ContactRoute(),
  new ArrivalRoute(),
  new ReturnRoute(),
  new PaymentRoute(),
  new SmsRoute(),
  new InboundEmailRoute(),
  new ReminderRoute(),
  new TestFeedRoute(),
  new CronRoute(),
];

export default AppRoutes;
