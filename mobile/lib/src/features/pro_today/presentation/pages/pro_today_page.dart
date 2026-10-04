import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../bloc/pro_today_bloc.dart';
import '../widgets/today_row.dart';

/// The staff's day: Arrivées / Retours (tabs on a phone, two columns on a wide screen), live
/// statuses polled every 12 s, the approaching traveller first with a mini map.
@RoutePage()
class ProTodayPage extends StatelessWidget implements AutoRouteWrapper {
  const ProTodayPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProTodayBloc>()..add(const ProTodayStarted()), child: this);

  @override
  Widget build(BuildContext context) => const _ProTodayView();
}

class _ProTodayView extends StatefulWidget {
  const _ProTodayView();

  @override
  State<_ProTodayView> createState() => _ProTodayViewState();
}

class _ProTodayViewState extends State<_ProTodayView> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  Timer? _clock;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    // "Position mise à jour il y a 20 s" keeps counting between two polls.
    _clock = Timer.periodic(const Duration(seconds: 5), (_) => setState(() => _now = DateTime.now()));
  }

  @override
  void dispose() {
    _clock?.cancel();
    _tabs.dispose();
    super.dispose();
  }

  void _see(ProTodayState state) {
    final banner = state.banner;
    if (banner == null) return;
    _tabs.animateTo(banner.kind.name == 'outbound' ? 0 : 1);
    context.read<ProTodayBloc>().add(const ProTodayBannerDismissed());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(
        pro: true,
        actions: [
          if (context.watch<ProAuthBloc>().state.staff?.role == 'manager')
            IconButton(
              key: const Key('pro-plan'),
              tooltip: 'plan.menu'.tr(),
              icon: const Icon(Icons.map_rounded),
              onPressed: () => context.router.push(const ProPlanRoute()),
            ),
          IconButton(
            key: const Key('pro-shuttle'),
            tooltip: 'shuttle.title'.tr(),
            icon: const Icon(Icons.directions_bus_rounded),
            onPressed: () => context.router.push(const ProShuttleRoute()),
          ),
          IconButton(
            tooltip: 'pro.notifications'.tr(),
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => context.router.push(const ProNotificationsRoute()),
          ),
          IconButton(
            tooltip: 'pro.logout'.tr(),
            icon: const Icon(Icons.logout_rounded),
            onPressed: () {
              context.read<ProAuthBloc>().add(const ProAuthLogoutRequested());
              context.router.replaceAll([const AppShellRoute()]);
            },
          ),
        ],
      ),
      body: BlocBuilder<ProTodayBloc, ProTodayState>(
        builder: (context, state) {
          final wide = MediaQuery.sizeOf(context).width >= 760;
          return Column(
            children: [
              if (state.banner != null)
                ArrivalBanner(
                  signal: state.banner!,
                  onSee: () => _see(state),
                  onClose: () => context.read<ProTodayBloc>().add(const ProTodayBannerDismissed()),
                ),
              Container(
                color: AppColors.canvas,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'pro.today_title'.tr(args: [planningDay(_now)]),
                        style: AppText.label(size: 14, color: AppColors.dark).copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                    Text(hhmm(_now), style: AppText.tabular(size: 16, color: AppColors.accent)),
                  ],
                ),
              ),
              if (state.planning == null)
                Expanded(
                  child: Center(
                    child: state.viewState.isError
                        ? Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center)
                        : const CircularProgressIndicator(color: AppColors.accent),
                  ),
                )
              else if (wide)
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _Column(title: 'pro.arrivals'.tr(), rows: state.arrivals, isReturn: false, state: state, now: _now)),
                      const VerticalDivider(width: 1, color: AppColors.line),
                      Expanded(child: _Column(title: 'pro.returns'.tr(), rows: state.returns, isReturn: true, state: state, now: _now)),
                    ],
                  ),
                )
              else ...[
                TabBar(
                  controller: _tabs,
                  tabs: [
                    Tab(text: '${'pro.arrivals'.tr().toUpperCase()} · ${state.arrivals.length}'),
                    Tab(text: '${'pro.returns'.tr().toUpperCase()} · ${state.returns.length}'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _Column(rows: state.arrivals, isReturn: false, state: state, now: _now),
                      _Column(rows: state.returns, isReturn: true, state: state, now: _now),
                    ],
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _Column extends StatelessWidget {
  const _Column({this.title, required this.rows, required this.isReturn, required this.state, required this.now});
  final String? title;
  final List<TodayRow> rows;
  final bool isReturn;
  final ProTodayState state;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () async => context.read<ProTodayBloc>().add(const ProTodayPolled(full: true)),
      child: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          if (title != null) ...[Text(title!.toUpperCase(), style: AppText.label(size: 13)), const SizedBox(height: 10)],
          if (rows.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(isReturn ? 'pro.no_return'.tr() : 'pro.no_arrival'.tr(), style: AppText.muted()),
            ),
          for (final row in rows)
            TodayRowTile(row: row, isReturn: isReturn, positionAge: row.signal == null ? null : state.positionAge(row.signal!, now)),
        ],
      ),
    );
  }
}
