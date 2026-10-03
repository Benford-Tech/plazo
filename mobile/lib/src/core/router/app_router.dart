import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import '../../features/booking/presentation/pages/my_booking_page.dart';
import '../../features/checkout/presentation/pages/booking_form_page.dart';
import '../../features/checkout/presentation/pages/payment_page.dart';
import '../../features/more/presentation/pages/more_tab_page.dart';
import '../../features/pro_auth/presentation/pages/pro_login_page.dart';
import '../../features/pro_notifications/presentation/pages/pro_notifications_page.dart';
import '../../features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import '../../features/pro_today/presentation/pages/pro_today_page.dart';
import '../../features/return_day/presentation/pages/meeting_point_route_page.dart';
import '../../features/search/presentation/pages/parking_page.dart';
import '../../features/search/presentation/pages/results_page.dart';
import '../../features/search/presentation/pages/search_tab_page.dart';
import '../../features/shell/presentation/pages/app_shell_page.dart';
import '../../features/trips/presentation/pages/trips_tab_page.dart';
import 'pro_auth_guard.dart';

part 'app_router.gr.dart';

/// One app: the traveller's tabs (Rechercher / Mes réservations / Plus) and, from "Plus", the
/// staff's flow (/pro…), unchanged. The traveller's paths are the site's, so the links of the
/// confirmation emails and SMS open the app (Android App Links, iOS universal links; the web build
/// reads them from the address bar). Order matters: fixed paths before the /:airport ones.
@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends RootStackRouter {
  AppRouter({required this.proGuard});

  final ProAuthGuard proGuard;

  @override
  List<AutoRoute> get routes => [
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
    // Staff
    AutoRoute(page: ProLoginRoute.page, path: '/pro/connexion'),
    AutoRoute(page: ProTodayRoute.page, path: '/pro', guards: [proGuard]),
    AutoRoute(page: ProNotificationsRoute.page, path: '/pro/notifications', guards: [proGuard]),
    AutoRoute(page: ProShuttleRoute.page, path: '/pro/navette', guards: [proGuard]),
    // Traveller: a booking (A5 detail, confirmation) and its payment step (A4)
    AutoRoute(page: MyBookingRoute.page, path: '/ma-reservation/:reference'),
    AutoRoute(page: PaymentRoute.page, path: '/ma-reservation/:reference/paiement'),
    // Traveller: the return day (R2, walking route to the meeting point)
    AutoRoute(page: MeetingPointRouteRoute.page, path: '/ma-reservation/:reference/point-de-rendez-vous'),
    // Traveller: results (A2), booking form (A4), parking page (A3), as on the site
    AutoRoute(page: ResultsRoute.page, path: '/:airport/recherche'),
    AutoRoute(page: BookingFormRoute.page, path: '/:airport/:parking/reserver'),
    AutoRoute(page: ParkingRoute.page, path: '/:airport/:parking'),
    RedirectRoute(path: '*', redirectTo: '/'),
  ];
}
