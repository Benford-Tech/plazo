import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/posts.dart';
import '../../../../shared/theme/theme.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';

/// Plazo Pro (N-A, 04/10/2026): four tabs. Since R-C (04/10/2026) they follow the post held for the
/// day (driver: Navette · Arrivées · Retours · Plus; valet: Parking · Aujourd'hui · Places · Plus;
/// agent and manager: Aujourd'hui · Réservations · Parking · Plus). The pages still hide the actions
/// a role lacks: the post changes the layout, the role keeps the permissions.
@RoutePage()
class ProShellPage extends StatelessWidget {
  const ProShellPage({super.key});

  @override
  Widget build(BuildContext context) {
    final post = context.select((ProAuthBloc b) => b.state.staff?.activePost ?? 'agent');
    final tabs = tabsFor(post);
    return AutoTabsRouter(
      // A new post is a new set of tabs: the router restarts on its first one.
      key: ValueKey('pro-tabs-$post'),
      routes: [for (final t in tabs) t.route],
      builder: (context, child) {
        final router = context.tabsRouter;
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
                selectedIndex: router.activeIndex,
                onDestinationSelected: router.setActiveIndex,
                destinations: [
                  for (final t in tabs) NavigationDestination(key: Key(t.key), icon: Icon(t.icon), label: 'pro_tabs.${t.label}'.tr()),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
