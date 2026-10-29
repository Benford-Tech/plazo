import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import '../constants/app_constants.dart';

import '../../features/booking/presentation/pages/app_link_page.dart';
import '../../features/booking/presentation/pages/my_booking_page.dart';
import '../../features/checkout/presentation/pages/booking_form_page.dart';
import '../../features/checkout/presentation/pages/payment_page.dart';
import '../../features/more/presentation/pages/more_tab_page.dart';
import '../../features/paperwork/presentation/pages/contract_pages.dart';
import '../../features/paperwork/presentation/pages/pro_inspection_page.dart';
import '../../features/paperwork/presentation/pages/traveller_inspection_page.dart';
import '../../features/paperwork/presentation/pages/traveller_photos_page.dart';
import '../../features/pro_auth/presentation/pages/pro_join_page.dart';
import '../../features/pro_auth/presentation/pages/pro_login_page.dart';
import '../../features/pro_auth/presentation/pages/pro_post_page.dart';
import '../../features/pro_auth/presentation/pages/pro_vehicle_page.dart';
import '../../features/pro_notifications/presentation/pages/pro_notifications_page.dart';
import '../../features/pro_occupation/presentation/pages/pro_occupation_page.dart';
import '../../features/pro_plan/presentation/pages/pro_plan_page.dart';
import '../../features/pro_reservations/data/models/reservation_models.dart';
import '../../features/pro_reservations/presentation/pages/pro_reservation_form_page.dart';
import '../../features/pro_reservations/presentation/pages/pro_reservation_page.dart';
import '../../features/pro_reservations/presentation/pages/pro_reservations_page.dart';
import '../../features/pro_revenue/presentation/bloc/pro_revenue_bloc.dart';
import '../../features/pro_revenue/presentation/pages/pro_revenue_missing_page.dart';
import '../../features/pro_revenue/presentation/pages/pro_revenue_page.dart';
import '../../features/pro_forecast/presentation/pages/pro_forecast_page.dart';
import '../../features/pro_start/presentation/pages/pro_getting_started_page.dart';
import '../../features/pro_valet/presentation/pages/pro_valet_page.dart';
import '../../features/pro_extras/presentation/pages/pro_extras_page.dart';
import '../../features/pro_settings/presentation/pages/pro_account_page.dart';
import '../../features/pro_settings/presentation/pages/pro_parking_settings_page.dart';
import '../../features/pro_settings/presentation/pages/pro_team_page.dart';
import '../../features/pro_shell/presentation/pages/pro_more_tab_page.dart';
import '../../features/pro_shell/presentation/pages/pro_shell_page.dart';
import '../../features/pro_shuttle/presentation/bloc/shuttle_boarding.dart';
import '../../features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import '../../features/pro_shuttle/presentation/pages/pro_vehicles_page.dart';
import '../../features/pro_spot_planning/presentation/pages/pro_spot_planning_page.dart';
import '../../features/pro_today/presentation/pages/pro_today_page.dart';
import '../../features/return_day/presentation/pages/find_car_page.dart';
import '../../features/return_day/presentation/pages/meeting_point_route_page.dart';
import '../../features/search/presentation/pages/parking_page.dart';
import '../../features/search/presentation/pages/results_page.dart';
import '../../features/search/presentation/pages/search_tab_page.dart';
import '../../features/shell/presentation/pages/app_shell_page.dart';
import '../../features/trips/presentation/pages/trips_tab_page.dart';
import 'pro_auth_guard.dart';

part 'app_router.gr.dart';

/// Two apps on one project (A-B, 04/10/2026): Plazo (traveller's tabs under "/") and Plazo Pro
/// (staff's tabs under "/pro"), chosen by APP_FLAVOR; the other flow stays reachable by its paths. The traveller's paths are the site's, so the links of the
/// confirmation emails and SMS open the app (Android App Links, iOS universal links; the web build
/// reads them from the address bar). Order matters: fixed paths before the /:airport ones.
@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends RootStackRouter {
  AppRouter({required this.proGuard, ProJoinGuard? joinGuard}) : joinGuard = joinGuard ?? ProJoinGuard(proGuard.auth);

  final ProAuthGuard proGuard;

  /// « Rejoindre un parking » (13/10/2026): the onboarding session only.
  final ProJoinGuard joinGuard;

  @override
  List<AutoRoute> get routes => [
    // Traveller app (Plazo only, decision of 04/10/2026: Plazo Pro carries no traveller flow): three tabs under "/".
    if (!AppConstants.isPro)
      AutoRoute(
        page: AppShellRoute.page,
        path: '/',
        initial: true,
        children: [
          AutoRoute(page: SearchTabRoute.page, path: '', initial: true),
          AutoRoute(page: TripsTabRoute.page, path: 'ma-reservation'),
          AutoRoute(page: MoreTabRoute.page, path: 'plus'),
        ],
      ),
    if (AppConstants.isPro) RedirectRoute(path: '/', redirectTo: '/pro'),
    // Staff: four tabs under /pro (N-A), the other screens pushed above them. Plazo Pro only: the
    // traveller app carries no pro space (decision of 04/10/2026).
    if (AppConstants.isPro) ...[
      AutoRoute(page: ProLoginRoute.page, path: '/pro/connexion'),
      // Signed in with Apple or Google, no parking yet: the code du jour, then the wait for a manager (13/10/2026).
      AutoRoute(page: ProJoinRoute.page, path: '/pro/rejoindre', guards: [joinGuard]),
      AutoRoute(
        page: ProShellRoute.page,
        path: '/pro',
        initial: AppConstants.isPro,
        guards: [proGuard],
        children: [
          AutoRoute(page: ProTodayRoute.page, path: '', initial: true),
          AutoRoute(page: ProReservationsRoute.page, path: 'reservations'),
          AutoRoute(page: ProOccupationRoute.page, path: 'parking'),
          AutoRoute(page: ProMoreTabRoute.page, path: 'plus'),
          // Tabs of the driver's and the valet's posts (R-C).
          AutoRoute(page: ProShuttleRoute.page, path: 'navette'),
          AutoRoute(page: ProArrivalsRoute.page, path: 'arrivees'),
          AutoRoute(page: ProReturnsRoute.page, path: 'retours'),
          AutoRoute(page: ProSpotPlanningRoute.page, path: 'places'),
          // « Voiturier au terminal » (27/10/2026): the valet's runs.
          AutoRoute(page: ProValetRoute.page, path: 'terminal'),
          // « Services à faire » (29/10/2026, direction C): the valet's services before the returns.
          AutoRoute(page: ProExtrasRoute.page, path: 'services'),
        ],
      ),
      AutoRoute(page: ProPostRoute.page, path: '/pro/poste', guards: [proGuard]),
      AutoRoute(page: ProVehicleRoute.page, path: '/pro/vehicule', guards: [proGuard]),
      AutoRoute(page: ProNotificationsRoute.page, path: '/pro/notifications', guards: [proGuard]),
      AutoRoute(page: ProShuttleRoute.page, path: '/pro/navette', guards: [proGuard]),
      AutoRoute(page: ProExtrasRoute.page, path: '/pro/services', guards: [proGuard]),
      AutoRoute(page: ProOccupationRoute.page, path: '/pro/occupation', guards: [proGuard]),
      AutoRoute(page: ProVehiclesRoute.page, path: '/pro/navettes', guards: [proGuard]),
      AutoRoute(page: ProPlanRoute.page, path: '/pro/plan', guards: [proGuard]),
      AutoRoute(page: ProSpotPlanningRoute.page, path: '/pro/planning-places', guards: [proGuard]),
      AutoRoute(page: ProTeamRoute.page, path: '/pro/equipe', guards: [proGuard]),
      AutoRoute(page: ProAccountRoute.page, path: '/pro/compte', guards: [proGuard]),
      AutoRoute(page: ProParkingSettingsRoute.page, path: '/pro/reglages', guards: [proGuard]),
      AutoRoute(page: ProRevenueRoute.page, path: '/pro/chiffre-affaires', guards: [proGuard]),
      AutoRoute(page: ProRevenueMissingRoute.page, path: '/pro/chiffre-affaires/a-completer', guards: [proGuard]),
      AutoRoute(page: ProGettingStartedRoute.page, path: '/pro/bien-demarrer', guards: [proGuard]),
      AutoRoute(page: ProForecastRoute.page, path: '/pro/previsionnel', guards: [proGuard]),
      AutoRoute(page: ProReservationFormRoute.page, path: '/pro/reservations/formulaire', guards: [proGuard]),
      // « Contrat signé et état des lieux » (19/10/2026).
      AutoRoute(page: ProContractRoute.page, path: '/pro/reservations/:id/contrat', guards: [proGuard]),
      AutoRoute(page: ProInspectionRoute.page, path: '/pro/reservations/:id/etat-des-lieux/:kind', guards: [proGuard]),
      AutoRoute(page: ProReservationRoute.page, path: '/pro/reservations/:id', guards: [proGuard]),
    ],
    if (!AppConstants.isPro) ...[
      // « Lien court Plazo » (27/10/2026): https://www.plazo.fr/a/<code> and plazo://a/<code> open the booking
      AutoRoute(page: AppLinkRoute.page, path: '/a/:code'),
      // Traveller: a booking (A5 detail, confirmation) and its payment step (A4)
      AutoRoute(page: MyBookingRoute.page, path: '/ma-reservation/:reference'),
      AutoRoute(page: PaymentRoute.page, path: '/ma-reservation/:reference/paiement'),
      // Traveller: the return day (R2, walking route to the meeting point)
      AutoRoute(page: MeetingPointRouteRoute.page, path: '/ma-reservation/:reference/point-de-rendez-vous'),
      AutoRoute(page: FindCarRoute.page, path: '/ma-reservation/:reference/ma-voiture'),
      AutoRoute(page: TravellerContractRoute.page, path: '/ma-reservation/:reference/contrat'),
      AutoRoute(page: TravellerInspectionRoute.page, path: '/ma-reservation/:reference/etat-des-lieux/:kind'),
      AutoRoute(page: TravellerPhotosRoute.page, path: '/ma-reservation/:reference/mes-photos/:kind'),
      // Traveller: results (A2), booking form (A4), parking page (A3), as on the site
      AutoRoute(page: ResultsRoute.page, path: '/:airport/recherche'),
      AutoRoute(page: BookingFormRoute.page, path: '/:airport/:parking/reserver'),
      AutoRoute(page: ParkingRoute.page, path: '/:airport/:parking'),
    ],
    RedirectRoute(path: '*', redirectTo: AppConstants.isPro ? '/pro' : '/'),
  ];
}
