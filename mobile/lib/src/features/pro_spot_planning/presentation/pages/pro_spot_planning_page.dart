import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_reservations/presentation/widgets/reservation_tile.dart';
import '../../data/models/spot_planning_models.dart';
import '../bloc/pro_spot_planning_bloc.dart';

const _dayPx = 44.0;
const _labelPx = 64.0;
const _rowPx = 30.0;
const _onSite = Color(0xFF6EC071);
const _upcoming = Color(0xFF5FD3FF);
const _leaving = Color(0xFFA3E635);

/// Where an instant falls in the window, in days from its first midnight (phone time), clamped.
double _offsetDays(DateTime instant, DateTime from, int days) {
  final local = instant.toLocal();
  final v = local.difference(from).inMinutes / 1440;
  return v.clamp(0, days.toDouble());
}

/// App pro, step 3: one line per spot on 7 or 14 days, the bars of the stays, the need per day
/// against the spots, the alerts, the bookings without a spot, pre-assignment and moves.
@RoutePage()
class ProSpotPlanningPage extends StatelessWidget implements AutoRouteWrapper {
  const ProSpotPlanningPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProSpotPlanningBloc>()..add(const ProSpotPlanningStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProSpotPlanningBloc, ProSpotPlanningState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        final text = state.errorCode != null ? translateErrorCode(state.errorCode) : _noticeText(state.notice);
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProSpotPlanningBloc>().add(const ProSpotPlanningNoticeShown());
        }
      },
      builder: (context, state) {
        final p = state.planning;
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'planning.title'.tr()),
          body: p == null
              ? Center(
                  child: state.viewState.isError
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                        )
                      : const CircularProgressIndicator(color: AppColors.accent),
                )
              : _Body(state: state),
        );
      },
    );
  }

  static String? _noticeText(String? notice) {
    if (notice == null) return null;
    final parts = notice.split(':');
    return switch (parts.first) {
      'planning.preassigned' => 'planning.preassigned'.tr(args: [parts[1], parts[2]]),
      'planning.moved' => 'planning.moved'.tr(args: [parts[1], parts[2]]),
      _ => 'planning.released'.tr(args: [parts[1]]),
    };
  }
}

class _Body extends StatefulWidget {
  const _Body({required this.state});
  final ProSpotPlanningState state;
  @override
  State<_Body> createState() => _BodyState();
}

class _BodyState extends State<_Body> {
  /// A phone shows the spots with a stay first; the switch shows them all.
  bool _all = false;

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final bloc = context.read<ProSpotPlanningBloc>();
    final p = state.planning!;
    final busyRows = p.spots.where((s) => s.stays.isNotEmpty).length;
    return Column(
      children: [
        _Toolbar(state: state),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.accent,
            onRefresh: () async => bloc.add(const ProSpotPlanningRefreshed()),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                _Alerts(planning: p),
                const SizedBox(height: 14),
                _Unplaced(state: state),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(child: Text('planning.grid'.tr().toUpperCase(), style: AppText.label(size: 11))),
                    Text(
                      _all ? 'planning.all_spots'.tr(args: ['${p.spots.length}']) : 'planning.busy_spots'.tr(args: ['$busyRows']),
                      style: AppText.muted(size: 12),
                    ),
                    Switch(key: const Key('planning-all'), value: _all, activeTrackColor: AppColors.accent, onChanged: (v) => setState(() => _all = v)),
                  ],
                ),
                if (p.spots.isEmpty)
                  Text('occupation.no_plan'.tr(), style: AppText.muted())
                else if (!_all && busyRows == 0)
                  Text('planning.no_busy'.tr(), style: AppText.muted())
                else
                  _Gantt(state: state, all: _all),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Toolbar extends StatelessWidget {
  const _Toolbar({required this.state});
  final ProSpotPlanningState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSpotPlanningBloc>();
    final from = DateTime.parse(state.from);
    final to = from.add(Duration(days: state.days - 1));
    return Container(
      color: AppColors.canvas,
      padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
      child: Row(
        children: [
          IconButton(
            key: const Key('planning-prev'),
            tooltip: 'planning.prev'.tr(),
            icon: const Icon(Icons.chevron_left_rounded),
            onPressed: () => bloc.add(const ProSpotPlanningWindowMoved(-1)),
          ),
          Expanded(
            child: InkWell(
              key: const Key('planning-today'),
              onTap: () => bloc.add(const ProSpotPlanningWindowMoved(0)),
              child: Text(
                '${dayOf(from)} → ${dayOf(to)}',
                textAlign: TextAlign.center,
                style: AppText.label(size: 13, color: AppColors.dark).copyWith(fontWeight: FontWeight.w800),
              ),
            ),
          ),
          IconButton(
            key: const Key('planning-next'),
            tooltip: 'planning.next'.tr(),
            icon: const Icon(Icons.chevron_right_rounded),
            onPressed: () => bloc.add(const ProSpotPlanningWindowMoved(1)),
          ),
          TextButton(
            key: const Key('planning-days'),
            onPressed: () => bloc.add(ProSpotPlanningDaysChanged(state.days == 7 ? 14 : 7)),
            child: Text(
              'planning.days'.tr(args: ['${state.days}']),
              style: AppText.strong(size: 13, color: AppColors.accentDeep),
            ),
          ),
        ],
      ),
    );
  }
}

class _Gantt extends StatelessWidget {
  const _Gantt({required this.state, required this.all});
  final ProSpotPlanningState state;
  final bool all;

  @override
  Widget build(BuildContext context) {
    final p = state.planning!;
    final from = DateTime.parse(state.from);
    final today = DateTime.now();
    final todayKey = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final width = _labelPx + state.days * _dayPx;
    final nowX = _offsetDays(today, from, state.days);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SizedBox(
        width: width,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Day header: need / spots.
                Row(
                  children: [
                    SizedBox(
                      width: _labelPx,
                      child: Text('planning.load'.tr().toUpperCase(), style: AppText.label(size: 9)),
                    ),
                    for (var i = 0; i < state.days; i++)
                      SizedBox(
                        width: _dayPx,
                        child: _DayHead(
                          load: i < p.load.length ? p.load[i] : null,
                          capacity: p.capacity,
                          isToday: i < p.load.length && p.load[i].date == todayKey,
                        ),
                      ),
                  ],
                ),
                const Divider(height: 8, color: AppColors.line),
                for (final s in p.spots.where((s) => all || s.stays.isNotEmpty))
                  SizedBox(
                    key: Key('row-${s.code}'),
                    height: _rowPx,
                    child: Row(
                      children: [
                        SizedBox(
                          width: _labelPx,
                          child: Text(s.code, style: AppText.tabular(size: 11.5, color: s.active ? AppColors.ink : AppColors.muted)),
                        ),
                        Expanded(
                          child: Stack(
                            children: [
                              for (var i = 0; i < state.days; i++)
                                Positioned(
                                  left: i * _dayPx,
                                  top: 0,
                                  bottom: 0,
                                  child: Container(width: 1, color: AppColors.line),
                                ),
                              for (final st in s.stays) _Bar(stay: st, from: from, days: state.days, onTap: () => showStaySheet(context, state, st, s)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            if (nowX > 0 && nowX < state.days)
              Positioned(
                left: _labelPx + nowX * _dayPx,
                top: 0,
                bottom: 0,
                child: Container(width: 1.5, color: AppColors.accent),
              ),
          ],
        ),
      ),
    );
  }
}

class _DayHead extends StatelessWidget {
  const _DayHead({required this.load, required this.capacity, required this.isToday});
  final DayLoadModel? load;
  final int capacity;
  final bool isToday;

  @override
  Widget build(BuildContext context) {
    final need = load == null ? 0 : load!.placed + load!.unplaced;
    final cap = load?.capacity ?? capacity;
    final over = need > cap;
    final d = load == null ? null : DateTime.parse(load!.date);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(d == null ? '' : DateFormat('EEE d', 'fr_FR').format(d), style: AppText.label(size: 9, color: isToday ? AppColors.accent : AppColors.muted)),
        Text(
          '$need/$cap',
          key: Key('load-${load?.date}'),
          style: AppText.tabular(size: 11, color: over ? AppColors.danger : AppColors.ink),
        ),
      ],
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.stay, required this.from, required this.days, required this.onTap});
  final PlannedStayModel stay;
  final DateTime from;
  final int days;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final x0 = _offsetDays(stay.arrivalAt, from, days);
    final x1 = _offsetDays(stay.returnAt, from, days);
    if (x1 <= x0) return const SizedBox.shrink();
    final today = DateTime.now();
    final leaves = stay.onSite && stay.returnAt.toLocal().day == today.day && stay.returnAt.toLocal().month == today.month;
    final color = stay.onSite ? (leaves ? _leaving : _onSite) : _upcoming;
    return Positioned(
      left: x0 * _dayPx,
      top: 4,
      height: _rowPx - 8,
      width: ((x1 - x0) * _dayPx - 1).clamp(6, double.infinity),
      child: GestureDetector(
        key: Key('bar-${stay.reference}'),
        onTap: onTap,
        child: Container(
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(color: color, borderRadius: AppRadius.small),
          child: Text(
            stay.plate,
            maxLines: 1,
            overflow: TextOverflow.clip,
            softWrap: false,
            style: AppText.tabular(size: 10, color: Colors.black),
          ),
        ),
      ),
    );
  }
}

class _Alerts extends StatelessWidget {
  const _Alerts({required this.planning});
  final SpotPlanningModel planning;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('planning.alerts'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 6),
        if (planning.alerts.isEmpty) Text('planning.no_alert'.tr(), style: AppText.muted()),
        for (final a in planning.alerts)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              switch (a.kind) {
                'over_capacity' => 'planning.over_capacity'.tr(args: [dayOf(DateTime.parse(a.date!)), '${a.count}']),
                'unplaced' => 'planning.unplaced_alert'.tr(args: ['${a.count}']),
                'blocked' => 'planning.blocked_alert'.tr(args: ['${a.count}']),
                _ => 'planning.inactive_used'.tr(args: [a.spotCode ?? '', a.reference ?? '']),
              },
              key: Key('alert-${a.kind}'),
              style: AppText.body(size: 13.5, color: a.kind == 'over_capacity' ? AppColors.danger : AppColors.ink),
            ),
          ),
      ],
    );
  }
}

class _Unplaced extends StatelessWidget {
  const _Unplaced({required this.state});
  final ProSpotPlanningState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSpotPlanningBloc>();
    final p = state.planning!;
    final role = context.watch<ProAuthBloc>().state.staff?.role;
    final canPlace = can(role, 'reservations:status');
    final busy = state.actionState.isProcessing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('planning.unplaced'.tr(args: ['${p.unplaced.length}']).toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 6),
        if (p.unplaced.isEmpty) Text('planning.all_placed'.tr(), style: AppText.muted()),
        if (p.unplaced.isNotEmpty && canPlace) ...[
          GradientButton(
            key: const Key('planning-preassign'),
            label: 'planning.preassign'.tr(),
            busy: busy,
            onPressed: () => bloc.add(const ProSpotPlanningPreassignRequested()),
          ),
          const SizedBox(height: 4),
          Text('planning.preassign_help'.tr(), style: AppText.muted(size: 12)),
          const SizedBox(height: 6),
        ],
        for (final r in p.unplaced)
          ListTile(
            key: Key('unplaced-${r.reference}'),
            contentPadding: EdgeInsets.zero,
            leading: Text(dayOf(r.arrivalAt), style: AppText.tabular(size: 12, color: AppColors.accent)),
            title: Row(
              children: [
                FrenchPlate(r.plate, size: 12),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(r.customerName, style: AppText.body(size: 14), overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            onTap: canPlace ? () => showStaySheet(context, state, r, null) : null,
          ),
      ],
    );
  }
}

/// The stay, and the free spots over its dates to move it to (or release it).
Future<void> showStaySheet(BuildContext context, ProSpotPlanningState state, PlannedStayModel stay, PlannedSpotModel? spot) {
  final bloc = context.read<ProSpotPlanningBloc>();
  final free = state.freeSpotsFor(stay);
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheet) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(sheet).height * 0.7,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: Row(
                children: [
                  FrenchPlate(stay.plate, size: 13),
                  const SizedBox(width: 8),
                  Expanded(child: Text(stay.customerName, style: AppText.strong(size: 15))),
                  Text(
                    spot?.code ?? 'occupation.no_spot'.tr(),
                    key: const Key('sheet-spot'),
                    style: AppText.tabular(size: 18, color: AppColors.accent),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('${'pro.status.${stay.status}'.tr()} · ${dayTime(stay.arrivalAt)} → ${dayTime(stay.returnAt)}', style: AppText.muted(size: 12.5)),
            ),
            // O-A (06/10/2026): who must be taken out before this car can leave.
            if (stay.blockedBy.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Text(
                  'occupation.blocked_by'.tr(args: [stay.blockedBy.first.spotCode, dayTime(stay.blockedBy.first.returnAt)]) + (stay.blockedBy.length > 1 ? ' (+${stay.blockedBy.length - 1})' : ''),
                  key: const Key('sheet-blocked'),
                  style: AppText.strong(size: 12.5, color: AppStatus.warnText),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: Row(
                children: [
                  Expanded(child: Text((spot == null ? 'planning.place_in' : 'planning.move_to').tr(), style: AppText.label(size: 11))),
                  if (spot != null)
                    TextButton(
                      key: const Key('sheet-release'),
                      onPressed: () {
                        Navigator.of(sheet).pop();
                        bloc.add(ProSpotPlanningMoved(stay: stay, spotId: null));
                      },
                      child: Text('planning.release'.tr(), style: AppText.strong(size: 13, color: AppColors.accentDeep)),
                    ),
                  TextButton(
                    key: const Key('sheet-open'),
                    onPressed: () {
                      Navigator.of(sheet).pop();
                      context.router.push(ProReservationRoute(id: stay.id));
                    },
                    child: Text('res.one'.tr(), style: AppText.strong(size: 13, color: AppColors.accentDeep)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: free.isEmpty
                  ? Center(child: Text('planning.no_free'.tr(), style: AppText.muted()))
                  : ListView.builder(
                      itemCount: free.length,
                      itemBuilder: (_, i) {
                        final s = free[i];
                        return ListTile(
                          key: Key('pick-${s.code}'),
                          minTileHeight: 48,
                          leading: const Icon(Icons.local_parking_rounded, color: AppColors.muted),
                          title: Text(s.code, style: AppText.tabular(size: 15)),
                          subtitle: s.stayClass == null ? null : Text('occupation.stay_zone.${s.stayClass}'.tr(), style: AppText.muted(size: 11.5)),
                          onTap: () {
                            Navigator.of(sheet).pop();
                            bloc.add(ProSpotPlanningMoved(stay: stay, spotId: s.id));
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    ),
  );
}
