import { AuthRoute } from './auth.route';
import { HealthRoute } from './health.route';
import { ParkingRoute } from './parking.route';
import { StaffRoute } from './staff.route';

const AppRoutes = [new HealthRoute(), new AuthRoute(), new StaffRoute(), new ParkingRoute()];

export default AppRoutes;
