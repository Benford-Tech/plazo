import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../trips/presentation/bloc/trips_bloc.dart';

/// One app (decision): three tabs, Rechercher / Mes réservations / Plus. The staff's space opens
/// from "Plus" (or /pro links), unchanged.
@RoutePage()
class AppShellPage extends StatelessWidget {
  const AppShellPage({super.key});

  @override
  Widget build(BuildContext context) {
    final trips = locator<TripsBloc>();
    if (trips.state.loadState.index == 0) trips.add(const TripsLoaded());
    return BlocProvider.value(
      value: trips,
      child: AutoTabsRouter(
        routes: const [SearchTabRoute(), TripsTabRoute(), MoreTabRoute()],
        builder: (context, child) {
          final tabs = context.tabsRouter;
          return Scaffold(
            body: child,
            bottomNavigationBar: NavigationBarTheme(
              data: NavigationBarThemeData(
                backgroundColor: Colors.white,
                indicatorColor: const Color(0xFFF6EAF9),
                height: 64,
                labelTextStyle: WidgetStateProperty.resolveWith(
                  (s) => AppText.body(size: 11.5, weight: s.contains(WidgetState.selected) ? 700 : 500, color: s.contains(WidgetState.selected) ? AppColors.violet : AppColors.muted),
                ),
                iconTheme: WidgetStateProperty.resolveWith(
                  (s) => IconThemeData(color: s.contains(WidgetState.selected) ? AppColors.violet : AppColors.muted),
                ),
              ),
              child: DecoratedBox(
                decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.line))),
                child: NavigationBar(
                  selectedIndex: tabs.activeIndex,
                  onDestinationSelected: (i) {
                    // Back to a tab: its bookings are read again.
                    if (i == 1) trips.add(const TripsLoaded(quiet: true));
                    tabs.setActiveIndex(i);
                  },
                  destinations: [
                    NavigationDestination(key: const Key('tab-search'), icon: const Icon(Icons.search_rounded), label: 'tabs.search'.tr()),
                    NavigationDestination(key: const Key('tab-trips'), icon: const Icon(Icons.confirmation_number_rounded), label: 'tabs.trips'.tr()),
                    NavigationDestination(key: const Key('tab-more'), icon: const Icon(Icons.more_horiz_rounded), label: 'tabs.more'.tr()),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
