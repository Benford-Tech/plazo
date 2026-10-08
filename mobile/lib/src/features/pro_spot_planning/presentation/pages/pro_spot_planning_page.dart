import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_reservations/presentation/widgets/reservation_tile.dart';
import '../../data/models/files_planning_models.dart';
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
/// Planning des files (08/10/2026): a parking stored in files shows, day by day, its returns to
/// come against the room of the files serving or kept for that day, and keeps a file by hand.
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
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: (state.filesMode ? 'spot_planning.files.title' : 'planning.title').tr()),
          body: !state.loaded
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
      'planning.kept' => 'spot_planning.files.kept_notice'.tr(args: [parts[1], localDay('${parts[2]}T00:00')]),
      'planning.freed' => 'spot_planning.files.freed_notice'.tr(args: [parts[1]]),
      'occupation.prepared' => 'occupation.prepared'.tr(args: [parts[1], parts[2]]),
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
    if (state.filesMode) {
      return Column(
        children: [
          _Toolbar(state: state),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.accent,
              onRefresh: () async => bloc.add(const ProSpotPlanningRefreshed()),
              child: _FilesPlanningView(state: state),
            ),
          ),
        ],
      );
    }
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

// ---- Planning des files (08/10/2026) -----------------------------------------------------------

/// "aujourd'hui" or "sam. 4 oct." for a local day of the API.
String _dayText(String date, String today) => date == today ? 'occupation.files.today'.tr() : localDay('${date}T00:00');

/// What a file is doing: the returns it serves, the day it is kept for, or free.
String _fileDayLabel(FilesPlanningFileModel f, String today) {
  if (f.cars == 0) return f.plannedDay != null ? 'occupation.files.kept_for'.tr(args: [_dayText(f.plannedDay!, today)]) : 'occupation.files.free_file'.tr();
  final day = f.day;
  return day == null ? '' : 'occupation.files.returns_of'.tr(args: [_dayText(day, today)]);
}

/// The files planning: the room of the files, the alerts, one card per day with its returns and its
/// files, then the files with their day.
class _FilesPlanningView extends StatelessWidget {
  const _FilesPlanningView({required this.state});
  final ProSpotPlanningState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSpotPlanningBloc>();
    final p = state.filesPlanning!;
    final role = context.watch<ProAuthBloc>().state.staff?.role;
    final canKeep = can(role, 'reservations:status');
    final busy = state.actionState.isProcessing;
    // Today is the parking's local day as the planning starts (never the phone's clock).
    final today = p.today ?? p.from;
    final active = p.files.where((f) => f.active).length;
    return ListView(
      key: const Key('files-planning'),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('spot_planning.files.capacity'.tr(args: ['${p.capacity}', '$active']), key: const Key('files-capacity'), style: AppText.strong(size: 14)),
              Text('spot_planning.files.intro'.tr(), style: AppText.muted(size: 12)),
              if (canKeep)
                TextButton(
                  key: const Key('files-prepare'),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, foregroundColor: AppColors.accentDeep, textStyle: AppText.body(size: 13.5, weight: 700)),
                  onPressed: busy ? null : () => bloc.add(const ProSpotPlanningFilesPrepared()),
                  child: Text('occupation.files.prepare'.tr()),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _FilesAlerts(alerts: p.alerts),
        const SizedBox(height: 14),
        for (final d in p.load) _DayCard(day: d, state: state, canKeep: canKeep && d.date.compareTo(today) >= 0, busy: busy, today: today),
        const SizedBox(height: 6),
        Text('spot_planning.files.list'.tr(args: ['${p.files.length}']).toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 6),
        for (final f in p.files) _FileRow(file: f, today: today),
      ],
    );
  }
}

class _FilesAlerts extends StatelessWidget {
  const _FilesAlerts({required this.alerts});
  final List<FilesPlanningAlertModel> alerts;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('planning.alerts'.tr().toUpperCase(), style: AppText.label(size: 11)),
        const SizedBox(height: 6),
        if (alerts.isEmpty) Text('planning.no_alert'.tr(), style: AppText.muted()),
        for (final a in alerts)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              switch (a.kind) {
                'missing_room' => 'spot_planning.files.missing_room'.tr(args: [localDay('${a.date}T00:00'), '${a.count}']),
                'over_capacity' => 'spot_planning.files.over_capacity'.tr(args: [localDay('${a.date}T00:00'), '${a.count}']),
                _ => 'spot_planning.files.unsound'.tr(args: [a.fileCode ?? '', '${a.count}']),
              },
              key: Key('files-alert-${a.kind}'),
              style: AppText.body(size: 13.5, color: a.kind == 'unsound' ? AppColors.ink : AppStatus.badText),
            ),
          ),
      ],
    );
  }
}

/// One day: "N retours · M à venir", the files serving it and those kept for it, what is missing,
/// and "Réserver une file" for the staff allowed to.
class _DayCard extends StatelessWidget {
  const _DayCard({required this.day, required this.state, required this.canKeep, required this.busy, required this.today});
  final FilesPlanningDayModel day;
  final ProSpotPlanningState state;
  final bool canKeep;
  final bool busy;
  final String today;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProSpotPlanningBloc>();
    final d = day;
    final isToday = d.date == today;
    final short = d.missing > 0;
    return Container(
      key: Key('day-${d.date}'),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      decoration: BoxDecoration(
        color: isToday ? AppColors.tintSoft : AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: short ? AppStatus.badText : AppColors.line, width: short ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(planningDay(DateTime.parse(d.date)), style: AppText.label(size: 11, color: isToday ? AppColors.accent : AppColors.muted))),
              if (short)
                Text('spot_planning.files.missing'.tr(args: ['${d.missing}']), key: Key('missing-${d.date}'), style: AppText.strong(size: 13, color: AppStatus.badText))
              else
                Text('spot_planning.files.room'.tr(args: ['${d.room}']), style: AppText.muted(size: 12)),
            ],
          ),
          const SizedBox(height: 4),
          Text('spot_planning.files.day_returns'.tr(args: ['${d.returns}', '${d.toCome}']), style: AppText.strong(size: 14)),
          Text('spot_planning.files.on_site'.tr(args: ['${d.onSite}']), style: AppText.muted(size: 12)),
          const SizedBox(height: 8),
          if (d.filesServing.isEmpty && d.filesKept.isEmpty)
            Text('spot_planning.files.no_file_for_day'.tr(), style: AppText.muted(size: 12.5))
          else
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final code in d.filesServing) _FileChip(code: code, file: state.fileByCode(code)),
                for (final code in d.filesKept)
                  _FileChip(
                    code: code,
                    file: state.fileByCode(code),
                    kept: true,
                    onFree: canKeep && !busy && (state.fileByCode(code)?.keptByHand ?? false)
                        ? () => bloc.add(ProSpotPlanningFileKept(fileId: state.fileByCode(code)!.id, day: null))
                        : null,
                  ),
              ],
            ),
          if (canKeep && state.keepableFilesFor(d.date).isNotEmpty)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                key: Key('keep-day-${d.date}'),
                style: TextButton.styleFrom(foregroundColor: AppColors.accentDeep, textStyle: AppText.body(size: 13, weight: 700)),
                icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                label: Text('spot_planning.files.keep'.tr()),
                onPressed: busy ? null : () => showKeepFileSheet(context, state, d.date),
              ),
            ),
        ],
      ),
    );
  }
}

/// A file on a day: serving it (tinted), or kept for it (outlined; by hand: lime, with a cross to free it).
class _FileChip extends StatelessWidget {
  const _FileChip({required this.code, required this.file, this.kept = false, this.onFree});
  final String code;
  final FilesPlanningFileModel? file;
  final bool kept;
  final VoidCallback? onFree;

  @override
  Widget build(BuildContext context) {
    final byHand = kept && (file?.keptByHand ?? false);
    final fill = byHand ? AppColors.action : (kept ? AppColors.surface : AppColors.tint);
    final ink = byHand ? AppColors.onAccent : AppColors.accentDeep;
    final count = file == null ? '' : '${file!.cars}/${file!.capacity}';
    return Container(
      key: Key('chip-$code'),
      padding: EdgeInsets.fromLTRB(10, 5, onFree == null ? 10 : 4, 5),
      decoration: BoxDecoration(color: fill, borderRadius: AppRadius.chip, border: Border.all(color: byHand ? AppColors.action : AppColors.line)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (kept) ...[Icon(byHand ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, size: 14, color: ink), const SizedBox(width: 4)],
          Text(code, style: AppText.tabular(size: 12.5, color: ink)),
          if (count.isNotEmpty) ...[const SizedBox(width: 6), Text(count, style: AppText.tabular(size: 11, weight: 500, color: ink))],
          if (onFree != null)
            InkWell(
              key: Key('free-$code'),
              onTap: onFree,
              borderRadius: AppRadius.chip,
              child: Tooltip(
                message: 'spot_planning.files.free'.tr(args: [code]),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.close_rounded, size: 16, color: ink),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// A file of the list: code, its day, cars over capacity, and its badges (by hand, unsound, closed).
class _FileRow extends StatelessWidget {
  const _FileRow({required this.file, required this.today});
  final FilesPlanningFileModel file;
  final String today;

  @override
  Widget build(BuildContext context) {
    final f = file;
    final full = f.cars >= f.capacity;
    return Container(
      key: Key('file-${f.code}'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        border: Border.all(color: f.sound ? AppColors.line : AppStatus.badText, width: f.sound ? 1 : 1.5),
      ),
      child: Row(
        children: [
          Text(f.code, style: AppText.tabular(size: 16, color: f.active ? AppColors.accentDeep : AppColors.muted)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(f.name ?? _fileDayLabel(f, today), style: AppText.muted(size: 12.5), overflow: TextOverflow.ellipsis),
                if (f.keptByHand || !f.sound || !f.active)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        if (f.keptByHand) _Badge(key: Key('by-hand-${f.code}'), label: 'spot_planning.files.by_hand'.tr(), fill: AppColors.tint, ink: AppColors.accentDeep),
                        if (!f.sound) _Badge(key: Key('unsound-${f.code}'), label: 'spot_planning.files.unsound_badge'.tr(), fill: AppStatus.badSoft, ink: AppStatus.badText),
                        if (!f.active) _Badge(label: 'spot_planning.files.inactive'.tr(), fill: AppColors.canvas, ink: AppColors.muted),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          Text('${f.cars}/${f.capacity}', style: AppText.tabular(size: 13, color: full ? AppStatus.badText : AppColors.muted)),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({super.key, required this.label, required this.fill, required this.ink});
  final String label;
  final Color fill;
  final Color ink;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: fill, borderRadius: AppRadius.pill),
      child: Text(label, style: AppText.strong(size: 11, color: ink)),
    );
  }
}

/// The empty files to keep for the return [day] by hand: one kept for another day can be moved,
/// one the night preparation kept for that day can be locked by hand, one already kept by hand
/// for it is greyed out.
Future<void> showKeepFileSheet(BuildContext context, ProSpotPlanningState state, String day) {
  final bloc = context.read<ProSpotPlanningBloc>();
  final files = state.emptyFiles;
  // Today is the parking's local day as the planning starts (never the phone's clock).
  final today = state.filesPlanning!.today ?? state.filesPlanning!.from;
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheet) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(sheet).height * 0.6,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: Text('spot_planning.files.keep_title'.tr(args: [localDay('${day}T00:00')]), style: AppText.title(size: 20)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('spot_planning.files.keep_help'.tr(), style: AppText.muted(size: 12.5)),
            ),
            Expanded(
              child: files.isEmpty
                  ? Center(child: Text('spot_planning.files.no_empty_file'.tr(), style: AppText.muted()))
                  : ListView.builder(
                      itemCount: files.length,
                      itemBuilder: (_, i) {
                        final f = files[i];
                        final forDay = f.plannedDay == day;
                        // Kept by hand for this day already: nothing to do. Kept by the preparation: lock it.
                        final locked = forDay && f.keptByHand;
                        final what = locked
                            ? 'spot_planning.files.already_kept'.tr()
                            : forDay
                            ? 'spot_planning.files.kept_by_plan'.tr()
                            : _fileDayLabel(f, today);
                        return ListTile(
                          key: Key('keep-${f.code}'),
                          minTileHeight: 52,
                          enabled: !locked,
                          leading: Icon(Icons.view_stream_rounded, color: locked ? AppColors.muted : AppColors.accent),
                          title: Text(f.code, style: AppText.tabular(size: 16)),
                          subtitle: Text('${f.capacity} · $what', style: AppText.muted(size: 12)),
                          onTap: () {
                            Navigator.of(sheet).pop();
                            bloc.add(ProSpotPlanningFileKept(fileId: f.id, day: day));
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
