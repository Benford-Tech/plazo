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
import '../../../pro_dashboard/presentation/bloc/pro_dashboard_bloc.dart';
import '../../../pro_dashboard/presentation/widgets/dashboard_view.dart';
import '../../../pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import '../../../pro_shuttle/presentation/widgets/live_shuttles_card.dart';
import '../bloc/pro_today_bloc.dart';
import '../widgets/date_strip.dart';
import '../widgets/today_row.dart';

/// The staff's day: Arrivées / Retours (tabs on a phone, two columns on a wide screen), live
/// statuses polled every 12 s, the approaching traveller first with a mini map.
@RoutePage()
class ProTodayPage extends StatelessWidget implements AutoRouteWrapper {
  const ProTodayPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => const ProTodayView();
}

/// The day's planning and, for the live strip (P-A), the running shuttles.
Widget _withBlocs(Widget child) => MultiBlocProvider(
  providers: [
    BlocProvider(create: (_) => locator<ProTodayBloc>()..add(const ProTodayStarted())),
    BlocProvider(create: (_) => locator<LiveShuttlesBloc>()..add(const LiveShuttlesStarted())),
    BlocProvider(create: (_) => locator<ProDashboardBloc>()..add(const ProDashboardStarted())),
  ],
  child: child,
);

/// The driver's "Arrivées" tab (R-C): the day's arrivals alone.
@RoutePage()
class ProArrivalsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProArrivalsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => const ProTodayView(only: TodaySide.arrivals);
}

/// The driver's "Retours" tab (R-C): the day's returns alone.
@RoutePage()
class ProReturnsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProReturnsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => const ProTodayView(only: TodaySide.returns);
}

enum TodaySide { arrivals, returns }

enum TodayMode { dashboard, planning }

/// The day's planning: both sides (tabs on a phone, two columns on a tablet), or one side only.
class ProTodayView extends StatefulWidget {
  const ProTodayView({super.key, this.only});

  final TodaySide? only;

  @override
  State<ProTodayView> createState() => _ProTodayViewState();
}

class _ProTodayViewState extends State<ProTodayView> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  Timer? _clock;
  DateTime _now = DateTime.now();

  /// The web's home is the dashboard; the planning is one tap away. Only when both sides are shown.
  TodayMode _mode = TodayMode.dashboard;

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

  /// The day shown: the chosen one, else today (the phone's clock).
  DateTime _shownDay(ProTodayState state) {
    final d = state.date;
    if (d == null) return _now;
    return DateTime.tryParse(d) ?? _now;
  }

  static bool _isSameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

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
          IconButton(
            tooltip: 'pro.notifications'.tr(),
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => context.router.push(const ProNotificationsRoute()),
          ),
        ],
      ),
      body: BlocBuilder<ProTodayBloc, ProTodayState>(
        builder: (context, state) {
          final wide = MediaQuery.sizeOf(context).width >= 760;
          final dashboard = widget.only == null && _mode == TodayMode.dashboard;
          return Column(
            children: [
              if (state.banner != null)
                ArrivalBanner(
                  signal: state.banner!,
                  onSee: () => _see(state),
                  onClose: () => context.read<ProTodayBloc>().add(const ProTodayBannerDismissed()),
                ),
              if (widget.only == null) _ModeBar(mode: _mode, onChanged: (m) => setState(() => _mode = m)),
              if (dashboard)
                const Expanded(child: DashboardView())
              else ...[
                Container(
                  color: AppColors.canvas,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'pro.today_title'.tr(args: [planningDay(_shownDay(state))]),
                              style: AppText.label(size: 14, color: AppColors.dark).copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          if (state.date != null)
                            TextButton(
                              key: const Key('today-back'),
                              onPressed: () => context.read<ProTodayBloc>().add(const ProTodayDateChanged(null)),
                              child: Text('pro.back_to_today'.tr(), style: AppText.strong(size: 13, color: AppColors.accent)),
                            )
                          else
                            Text(hhmm(_now), style: AppText.tabular(size: 16, color: AppColors.accent)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      DateStrip(
                        selected: _shownDay(state),
                        today: _now,
                        onSelected: (day) => context.read<ProTodayBloc>().add(ProTodayDateChanged(_isSameDay(day, _now) ? null : isoDay(day))),
                      ),
                    ],
                  ),
                ),
                // P-A: the shuttles on the road, one line each; tap to open the Navette screen.
                if (state.date == null) LiveShuttlesStrip(onTap: () => context.router.push(const ProShuttleRoute())),
                if (state.planning == null)
                  Expanded(
                    child: Center(
                      child: state.viewState.isError
                          ? Text(state.errorMessage ?? 'errors.generic'.tr(), textAlign: TextAlign.center)
                          : const CircularProgressIndicator(color: AppColors.accent),
                    ),
                  )
                else if (widget.only != null)
                  Expanded(
                    child: widget.only == TodaySide.arrivals
                        ? _Column(title: 'pro.arrivals'.tr(), rows: state.arrivals, isReturn: false, state: state, now: _now)
                        : _Column(title: 'pro.returns'.tr(), rows: state.returns, isReturn: true, state: state, now: _now),
                  )
                else if (wide)
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _Column(title: 'pro.arrivals'.tr(), rows: state.arrivals, isReturn: false, state: state, now: _now),
                        ),
                        const VerticalDivider(width: 1, color: AppColors.line),
                        Expanded(
                          child: _Column(title: 'pro.returns'.tr(), rows: state.returns, isReturn: true, state: state, now: _now),
                        ),
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
            ],
          );
        },
      ),
    );
  }
}

/// « Tableau de bord · Planning » in capitals, the current one underlined in yellow (direction B).
class _ModeBar extends StatelessWidget {
  const _ModeBar({required this.mode, required this.onChanged});
  final TodayMode mode;
  final ValueChanged<TodayMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.canvas,
      child: Row(
        children: [
          for (final m in TodayMode.values)
            Expanded(
              child: Semantics(
                selected: m == mode,
                button: true,
                inMutuallyExclusiveGroup: true,
                child: InkWell(
                  key: Key('today-mode-${m.name}'),
                  onTap: () => onChanged(m),
                  child: Container(
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: m == mode ? AppColors.accent : AppColors.line, width: m == mode ? 3 : 1),
                      ),
                    ),
                    child: Text(
                      (m == TodayMode.dashboard ? 'dashboard.tab'.tr() : 'dashboard.planning'.tr()).toUpperCase(),
                      style: AppText.label(size: 13, color: m == mode ? AppColors.accent : AppColors.muted),
                    ),
                  ),
                ),
              ),
            ),
        ],
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
              child: Text(
                state.date == null
                    ? (isReturn ? 'pro.no_return'.tr() : 'pro.no_arrival'.tr())
                    : (isReturn ? 'pro.no_return_day'.tr() : 'pro.no_arrival_day'.tr()),
                style: AppText.muted(),
              ),
            ),
          for (final row in rows)
            TodayRowTile(
              row: row,
              isReturn: isReturn,
              positionAge: row.signal == null ? null : state.positionAge(row.signal!, now),
              onTap: () => context.router.push(ProReservationRoute(id: row.booking.id)),
            ),
        ],
      ),
    );
  }
}
