import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_dashboard/presentation/bloc/pro_dashboard_bloc.dart';
import '../../../pro_dashboard/presentation/widgets/dashboard_view.dart';
import '../../../pro_revenue/presentation/bloc/revenue_summary_bloc.dart';
import '../../../pro_shuttle/data/models/shuttle_models.dart';
import '../../../pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import '../../../pro_shuttle/presentation/bloc/shuttle_boarding.dart';
import '../../../pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import '../../../pro_shuttle/presentation/widgets/live_shuttles_card.dart';
import '../../../return_day/data/models/return_model.dart';
import '../../data/models/planning_model.dart';
import '../bloc/pro_today_bloc.dart';
import '../widgets/date_bar.dart';
import '../widgets/today_row.dart';
import '../../../../shared/tutorials/tutorial_catalog.dart';
import '../../../../shared/tutorials/tutorial_spot.dart';

/// The staff's day: one chronological list of the drop-offs and returns on a phone (direction A of
/// 27/10/2026, pills to keep one kind), two columns on a wide screen; live statuses polled every
/// 12 s, the approaching traveller first with a mini map.
@RoutePage()
class ProTodayPage extends StatelessWidget implements AutoRouteWrapper {
  const ProTodayPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => const TutorialSpot(tutorial: Tutorials.proToday, child: ProTodayView());
}

/// The day's planning and, for the live strip (P-A), the running shuttles.
Widget _withBlocs(Widget child) => MultiBlocProvider(
  providers: [
    BlocProvider(create: (_) => locator<ProTodayBloc>()..add(const ProTodayStarted())),
    BlocProvider(create: (_) => locator<LiveShuttlesBloc>()..add(const LiveShuttlesStarted())),
    BlocProvider(create: (_) => locator<ProDashboardBloc>()..add(const ProDashboardStarted())),
    // Lazy: only the managers' revenue card reads it, so nobody else asks the server.
    BlocProvider(create: (_) => locator<RevenueSummaryBloc>()..add(const RevenueSummaryStarted())),
  ],
  child: child,
);

/// The driver's "Arrivées" tab (R-C): the day's arrivals alone, « Embarquer » on the ones not gone yet (14/10/2026).
@RoutePage()
class ProArrivalsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProArrivalsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => ProTodayView(only: TodaySide.arrivals, boarding: locator<ShuttleBoardingRequests>());
}

/// The driver's "Retours" tab (R-C): the day's returns alone, « Récupérer » on the ones away (14/10/2026).
@RoutePage()
class ProReturnsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProReturnsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => _withBlocs(this);

  @override
  Widget build(BuildContext context) => ProTodayView(only: TodaySide.returns, boarding: locator<ShuttleBoardingRequests>());
}

/// Statuses a return can be fetched from at the airport (the server's PICKUP_STATUSES).
const _fetchable = {'arrived', 'shuttled_out', 'return_requested'};

enum TodaySide { arrivals, returns }

enum TodayMode { dashboard, planning }

/// The pills over the merged list of the day: everything, the drop-offs or the returns.
enum TodayFilter { all, arrivals, returns }

/// A line of the merged list: the booking and its side.
class DayEntry {
  const DayEntry(this.row, this.isReturn);
  final TodayRow row;
  final bool isReturn;

  DateTime get at => isReturn ? row.booking.returnAt : row.booking.arrivalAt;

  /// Already done: a drop-off once the traveller came, a return once the car is back or the stay closed.
  bool get done => isReturn ? _closedReturns.contains(row.booking.status) : row.booking.status != 'upcoming';

  static const _closedReturns = {'back_at_parking', 'returned', 'cancelled', 'no_show'};
}

/// Both sides in one list: the travellers at the meeting point, then those sharing their position (by
/// ETA), then everyone in time order.
List<DayEntry> mergeDay(List<TodayRow> arrivals, List<TodayRow> returns) {
  final all = [for (final r in arrivals) DayEntry(r, false), for (final r in returns) DayEntry(r, true)];
  int rank(TodayRow r) => r.atMeetingPoint ? 0 : (r.approaching ? 1 : 2);
  all.sort((a, b) {
    final byRank = rank(a.row).compareTo(rank(b.row));
    if (byRank != 0) return byRank;
    if (rank(a.row) == 1) return (a.row.signal!.etaMinutes ?? 999).compareTo(b.row.signal!.etaMinutes ?? 999);
    return a.at.compareTo(b.at);
  });
  return all;
}

/// The day's planning: both sides (tabs on a phone, two columns on a tablet), or one side only.
class ProTodayView extends StatefulWidget {
  const ProTodayView({super.key, this.only, this.boarding, this.onBoard, this.initialMode = TodayMode.dashboard, this.clock = DateTime.now});

  final TodaySide? only;

  /// Where the view opens when both sides are shown: the dashboard, or straight on the planning.
  final TodayMode initialMode;

  /// The driver's tabs (14/10/2026): « Embarquer » / « Récupérer » on today's rows, for the Navette tab.
  final ShuttleBoardingRequests? boarding;

  /// Hands a traveller over; by default to the shell's Navette tab ([openShuttleTab]).
  final ValueChanged<ShuttleBoarding>? onBoard;

  /// The phone's clock; the tests pass a fixed one (the planning was dated by the real day).
  final DateTime Function() clock;

  @override
  State<ProTodayView> createState() => _ProTodayViewState();
}

class _ProTodayViewState extends State<ProTodayView> {
  Timer? _clock;

  /// Direction A: the merged list shows everything until a pill keeps one kind.
  TodayFilter _filter = TodayFilter.all;

  /// « Déjà passés · N » unfolded.
  bool _showPast = false;
  late DateTime _now = widget.clock();

  /// The web's home is the dashboard; the planning is one tap away. Only when both sides are shown.
  late TodayMode _mode = widget.initialMode;

  @override
  void initState() {
    super.initState();
    // "Position mise à jour il y a 20 s" keeps counting between two polls.
    _clock = Timer.periodic(const Duration(seconds: 5), (_) => setState(() => _now = widget.clock()));
  }

  @override
  void dispose() {
    _clock?.cancel();
    super.dispose();
  }

  /// The day shown: the chosen one, else today (the phone's clock).
  DateTime _shownDay(ProTodayState state) {
    final d = state.date;
    if (d == null) return _now;
    return DateTime.tryParse(d) ?? _now;
  }

  /// « Planning prévisionnel » (28/10/2026): a day tapped in the calendar comes back as the day shown.
  Future<void> _openForecast(ProTodayState state) async {
    final bloc = context.read<ProTodayBloc>();
    final picked = await context.router.push<String>(ProForecastRoute(anchor: isoDay(_shownDay(state))));
    if (picked == null || !mounted) return;
    bloc.add(ProTodayDateChanged(picked == isoDay(widget.clock()) ? null : picked));
  }

  void _see(ProTodayState state) {
    final banner = state.banner;
    if (banner == null) return;
    setState(() => _filter = banner.kind.name == 'outbound' ? TodayFilter.arrivals : TodayFilter.returns);
    context.read<ProTodayBloc>().add(const ProTodayBannerDismissed());
  }

  /// Nobody on a trip, for the views that offer no boarding.
  static final _noTrips = ValueNotifier<Set<String>>(const {});
  static final _notRunning = ValueNotifier<bool>(false);

  /// Hands a traveller to the Navette tab (14/10/2026); null when this view offers no « Embarquer » / « Récupérer ».
  ValueChanged<ShuttleBoarding>? get _onBoard {
    final requests = widget.boarding;
    if (requests == null) return null;
    return widget.onBoard ?? (b) => openShuttleTab(context, requests, b);
  }

  /// Today's travellers not gone yet: expected within a day (checked in at boarding) or on site, not on a running trip;
  /// for the returns, the ones away or waiting at the airport. None while the driver's own trip runs (no second one).
  ShuttleBoarding? Function(PlanningRowModel)? _boardAction(ProTodayState state, Set<String> onTrip, bool running, bool isReturn) {
    if (_onBoard == null || state.date != null || running) return null;
    return (b) {
      if (onTrip.contains(b.id)) return null;
      if (isReturn) {
        if (!_fetchable.contains(b.status)) return null;
        return ShuttleBoarding.pickup(
          PickupRowModel(
            reservationId: b.id,
            reference: b.reference,
            customerName: b.customerName,
            passengers: b.passengers,
            plate: b.plate,
            status: b.status,
            returnAt: b.returnAt,
            flight: FlightViewModel(number: b.returnFlight),
            stopId: b.stopId,
          ),
        );
      }
      if (b.status != 'arrived' && !(b.status == 'upcoming' && boardableUpcoming(b.arrivalAt, _now))) return null;
      return ShuttleBoarding.dropoff(
        DepartureRowModel(
          reservationId: b.id,
          reference: b.reference,
          customerName: b.customerName,
          passengers: b.passengers,
          plate: b.plate,
          status: b.status,
          arrivalAt: b.arrivalAt,
          arrivedAt: b.arrivedAt,
          stopId: b.stopId,
          expected: b.status == 'upcoming',
        ),
      );
    };
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
              if (widget.only == null)
                KeyedSubtree(
                  key: const Key('today-modes'),
                  child: _ModeBar(mode: _mode, onChanged: (m) => setState(() => _mode = m)),
                ),
              if (dashboard)
                Expanded(child: DashboardView(revenue: can(context.watch<ProAuthBloc>().state.staff?.role, 'revenue:view')))
              else ...[
                PlanningDateBar(
                  selected: _shownDay(state),
                  today: _now,
                  onSelected: (day) => context.read<ProTodayBloc>().add(ProTodayDateChanged(day == null ? null : isoDay(day))),
                  onForecast: () => _openForecast(state),
                ),
                // P-A: the shuttles on the road, one line each; tap to open the Navette screen.
                if (state.date == null) LiveShuttlesStrip(onTap: () => context.router.push(ProShuttleRoute())),
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
                    child: Builder(
                      builder: (context) {
                        final onTrip = widget.boarding?.onTrip ?? _noTrips;
                        final running = widget.boarding?.running ?? _notRunning;
                        return ListenableBuilder(
                          listenable: Listenable.merge([onTrip, running]),
                          builder: (context, _) => widget.only == TodaySide.arrivals
                              ? _Column(
                                  title: 'pro.arrivals'.tr(),
                                  rows: state.arrivals,
                                  isReturn: false,
                                  state: state,
                                  now: _now,
                                  board: _boardAction(state, onTrip.value, running.value, false),
                                  onBoard: _onBoard,
                                )
                              : _Column(
                                  title: 'pro.returns'.tr(),
                                  rows: state.returns,
                                  isReturn: true,
                                  state: state,
                                  now: _now,
                                  board: _boardAction(state, onTrip.value, running.value, true),
                                  onBoard: _onBoard,
                                ),
                        );
                      },
                    ),
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
                  _FilterPills(
                    filter: _filter,
                    arrivals: state.arrivals.length,
                    returns: state.returns.length,
                    onChanged: (f) => setState(() => _filter = f),
                  ),
                  Expanded(
                    child: _DayList(
                      entries: mergeDay(state.arrivals, state.returns).where((e) {
                        return switch (_filter) {
                          TodayFilter.all => true,
                          TodayFilter.arrivals => !e.isReturn,
                          TodayFilter.returns => e.isReturn,
                        };
                      }).toList(),
                      state: state,
                      now: _now,
                      showPast: _showPast,
                      onTogglePast: () => setState(() => _showPast = !_showPast),
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
  const _Column({this.title, required this.rows, required this.isReturn, required this.state, required this.now, this.board, this.onBoard});
  final String? title;
  final List<TodayRow> rows;
  final bool isReturn;
  final ProTodayState state;
  final DateTime now;

  /// The traveller a row can hand to the Navette tab (14/10/2026), null for none.
  final ShuttleBoarding? Function(PlanningRowModel)? board;
  final ValueChanged<ShuttleBoarding>? onBoard;

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
          for (final row in rows) _tile(context, row),
        ],
      ),
    );
  }

  Widget _tile(BuildContext context, TodayRow row) {
    // A valet booking never rides the shuttle: no « Embarquer » / « Récupérer » (27/10/2026).
    final boarding = row.booking.handover == 'valet' ? null : board?.call(row.booking);
    final hand = onBoard;
    return TodayRowTile(
      row: row,
      isReturn: isReturn,
      positionAge: row.signal == null ? null : state.positionAge(row.signal!, now),
      onTap: () => context.router.push(ProReservationRoute(id: row.booking.id)),
      actionLabel: boarding == null ? null : (isReturn ? 'pro.fetch' : 'pro.board').tr(),
      onAction: boarding == null || hand == null ? null : () => hand(boarding),
    );
  }
}


/// « Tout · 22 · ● Dépôts · 9 · ● Retours · 13 »: the chosen pill on the action colour, the other two with
/// the dot of their kind (green drop-offs, indigo returns).
class _FilterPills extends StatelessWidget {
  const _FilterPills({required this.filter, required this.arrivals, required this.returns, required this.onChanged});
  final TodayFilter filter;
  final int arrivals;
  final int returns;
  final ValueChanged<TodayFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    // Scrolls sideways on a narrow phone or with large text rather than overflowing.
    return Container(
      color: AppColors.canvas,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
        child: Row(
          children: [
            _pill(TodayFilter.all, 'pro.filter_all'.tr(), arrivals + returns, null),
            const SizedBox(width: 6),
            _pill(TodayFilter.arrivals, 'pro.dropoffs'.tr(), arrivals, AppStatus.ok),
            const SizedBox(width: 6),
            _pill(TodayFilter.returns, 'pro.departures'.tr(), returns, AppStatus.info),
          ],
        ),
      ),
    );
  }

  Widget _pill(TodayFilter f, String label, int count, Color? dot) {
    final on = f == filter;
    return Semantics(
      selected: on,
      button: true,
      inMutuallyExclusiveGroup: true,
      child: InkWell(
        key: Key('planning-filter-${f.name}'),
        borderRadius: AppRadius.pill,
        onTap: () => onChanged(f),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
          decoration: BoxDecoration(
            color: on ? AppColors.action : AppColors.surface,
            borderRadius: AppRadius.pill,
            border: Border.all(color: on ? AppColors.action : AppColors.line),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (dot != null) ...[
                Container(width: 8, height: 8, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
                const SizedBox(width: 6),
              ],
              Text('$label · $count', style: AppText.strong(size: 12.5, color: on ? AppColors.onAccent : AppColors.muted)),
            ],
          ),
        ),
      ),
    );
  }
}

/// The merged list of the day: what is already done folded under « Déjà passés · N » at the top, then
/// what comes, each card tagged with its kind.
class _DayList extends StatelessWidget {
  const _DayList({required this.entries, required this.state, required this.now, required this.showPast, required this.onTogglePast});
  final List<DayEntry> entries;
  final ProTodayState state;
  final DateTime now;
  final bool showPast;
  final VoidCallback onTogglePast;

  @override
  Widget build(BuildContext context) {
    final past = entries.where((e) => e.done).toList();
    final coming = entries.where((e) => !e.done).toList();
    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () async => context.read<ProTodayBloc>().add(const ProTodayPolled(full: true)),
      child: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          if (past.isNotEmpty) ...[
            InkWell(
              key: const Key('planning-past'),
              borderRadius: AppRadius.chip,
              onTap: onTogglePast,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(2, 4, 2, 10),
                child: Row(
                  children: [
                    Expanded(child: Text('pro.past_rows'.tr(args: ['${past.length}']).toUpperCase(), style: AppText.label(size: 12))),
                    Icon(showPast ? Icons.expand_less_rounded : Icons.expand_more_rounded, color: AppColors.muted, size: 20),
                  ],
                ),
              ),
            ),
            if (showPast) for (final e in past) _tile(context, e, dimmed: true),
          ],
          if (entries.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(state.date == null ? 'pro.no_row'.tr() : 'pro.no_row_day'.tr(), style: AppText.muted()),
            ),
          for (final e in coming) _tile(context, e),
        ],
      ),
    );
  }

  Widget _tile(BuildContext context, DayEntry e, {bool dimmed = false}) {
    final row = e.row;
    return TodayRowTile(
      row: row,
      isReturn: e.isReturn,
      tagged: true,
      dimmed: dimmed,
      positionAge: row.signal == null ? null : state.positionAge(row.signal!, now),
      onTap: () => context.router.push(ProReservationRoute(id: row.booking.id)),
    );
  }
}
