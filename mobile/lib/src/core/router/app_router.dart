import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';

import '../../features/booking/presentation/pages/my_booking_page.dart';
import '../../features/booking/presentation/pages/open_booking_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/pro_auth/presentation/pages/pro_login_page.dart';
import '../../features/pro_notifications/presentation/pages/pro_notifications_page.dart';
import '../../features/pro_today/presentation/pages/pro_today_page.dart';
import 'pro_auth_guard.dart';

part 'app_router.gr.dart';

/// Two clearly separate flows: the traveller's (/ma-reservation...) and the staff's (/pro...).
/// The traveller's paths are the site's, so the links of the confirmation emails and SMS open the
/// app (Android App Links, iOS universal links; the web build reads them from the address bar).
@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends RootStackRouter {
  AppRouter({required this.proGuard});

  final ProAuthGuard proGuard;

  @override
  List<AutoRoute> get routes => [
    AutoRoute(page: HomeRoute.page, path: '/', initial: true),
    // Traveller
    AutoRoute(page: OpenBookingRoute.page, path: '/ma-reservation'),
    AutoRoute(page: MyBookingRoute.page, path: '/ma-reservation/:reference'),
    // Staff
    AutoRoute(page: ProLoginRoute.page, path: '/pro/connexion'),
    AutoRoute(page: ProTodayRoute.page, path: '/pro', guards: [proGuard]),
    AutoRoute(page: ProNotificationsRoute.page, path: '/pro/notifications', guards: [proGuard]),
    RedirectRoute(path: '*', redirectTo: '/'),
  ];
}
