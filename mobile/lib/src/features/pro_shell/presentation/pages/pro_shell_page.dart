import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';

/// Plazo Pro (N-A, 04/10/2026): four tabs, Aujourd'hui · Réservations · Parking · Plus. Every
/// role sees the same tabs; the pages hide the actions a role lacks.
@RoutePage()
class ProShellPage extends StatelessWidget {
  const ProShellPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AutoTabsRouter(
      routes: const [ProTodayRoute(), ProReservationsRoute(), ProOccupationRoute(), ProMoreTabRoute()],
      builder: (context, child) {
        final tabs = context.tabsRouter;
        return Scaffold(
          body: child,
          bottomNavigationBar: NavigationBarTheme(
            data: NavigationBarThemeData(
              backgroundColor: AppColors.surface,
              indicatorColor: AppColors.tint,
              height: 64,
              labelTextStyle: WidgetStateProperty.resolveWith(
                (s) => AppText.body(
                  size: 11.5,
                  weight: s.contains(WidgetState.selected) ? 700 : 500,
                  color: s.contains(WidgetState.selected) ? AppColors.accent : AppColors.muted,
                ),
              ),
              iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(color: s.contains(WidgetState.selected) ? AppColors.accent : AppColors.muted)),
            ),
            child: DecoratedBox(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.line)),
              ),
              child: NavigationBar(
                selectedIndex: tabs.activeIndex,
                onDestinationSelected: tabs.setActiveIndex,
                destinations: [
                  NavigationDestination(key: const Key('ptab-today'), icon: const Icon(Icons.today_rounded), label: 'pro_tabs.today'.tr()),
                  NavigationDestination(key: const Key('ptab-reservations'), icon: const Icon(Icons.list_alt_rounded), label: 'pro_tabs.reservations'.tr()),
                  NavigationDestination(key: const Key('ptab-parking'), icon: const Icon(Icons.local_parking_rounded), label: 'pro_tabs.parking'.tr()),
                  NavigationDestination(key: const Key('ptab-more'), icon: const Icon(Icons.more_horiz_rounded), label: 'pro_tabs.more'.tr()),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
