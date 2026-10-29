import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/money.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../../extras/presentation/widgets/extra_widgets.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/extras_board_data_source.dart';

/// « Services » (29/10/2026, direction C of https://claude.ai/artifact/9tmsMsH4pm8RhMTpUjviFD): the services the travellers
/// ordered, sorted by the time they must be done by (one hour before the expected return), the late ones on top. The
/// valet's tab, and Plus › Services à faire for the others. « Accepter », « Fait » and « Pas possible » each tell the
/// traveller.
@RoutePage()
class ProExtrasPage extends StatefulWidget {
  const ProExtrasPage({super.key});

  @override
  State<ProExtrasPage> createState() => _ProExtrasPageState();
}

class _ProExtrasPageState extends State<ProExtrasPage> {
  static const _poll = Duration(seconds: 60);
  static const _views = ['todo', 'done', 'refused'];
  ExtrasBoard? _data;
  bool _failed = false;
  String _view = 'todo';
  final Set<String> _busy = {};
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(_poll, (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<ExtrasBoardDataSource>()) return;
    final view = _view;
    try {
      final data = await locator<ExtrasBoardDataSource>().fetch(view);
      if (mounted && view == _view) {
        setState(() {
          _data = data;
          _failed = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  void _select(String view) {
    if (view == _view) return;
    setState(() {
      _view = view;
      _data = _data == null ? null : ExtrasBoard(view: view, timezone: _data!.timezone, now: _data!.now, counts: _data!.counts, rows: const []);
    });
    _load();
  }

  Future<void> _act(ExtrasBoardRow row, String action, {String? reason}) async {
    setState(() => _busy.add(row.id));
    try {
      await locator<ExtrasBoardDataSource>().act(row, action, reason: reason);
      if (mounted) {
        final notice = action == 'accept' ? 'accepted' : (action == 'done' ? 'done' : 'refused');
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('extras.staff_notice.$notice'.tr())));
      }
    } on DioException catch (e) {
      final body = e.response?.data;
      final code = body is Map ? body['code'] as String? : null;
      final key = 'extras.errors.${code ?? 'generic'}';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(key.tr() == key ? 'extras.board.error'.tr() : key.tr())));
      }
    } finally {
      if (mounted) setState(() => _busy.remove(row.id));
    }
    await _load();
  }

  Future<void> _refuse(ExtrasBoardRow row) async {
    final reason = await showDialog<String>(context: context, builder: (_) => _RefuseDialog(row: row));
    if (reason != null) await _act(row, 'refuse', reason: reason);
  }

  /// To do: late first, then today, tomorrow and later (days of the phone, which is at the parking).
  List<(String, List<ExtrasBoardRow>)> _groups(ExtrasBoard board) {
    if (board.view != 'todo') return [('', board.rows)];
    final now = board.now;
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final groups = <String, List<ExtrasBoardRow>>{'late': [], 'today': [], 'tomorrow': [], 'later': []};
    for (final row in board.rows) {
      final due = DateTime(row.dueAt.year, row.dueAt.month, row.dueAt.day);
      final key = row.late ? 'late' : (!due.isAfter(today) ? 'today' : (due == tomorrow ? 'tomorrow' : 'later'));
      groups[key]!.add(row);
    }
    return [for (final e in groups.entries) if (e.value.isNotEmpty) (e.key, e.value)];
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<ProAuthBloc>().state.staff?.role;
    final canAct = can(role, 'reservations:status');
    final d = _data;
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'extras.board.title'.tr()),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          key: const Key('extras-board'),
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
          children: [
            Segmented<String>(
              key: const Key('extras-views'),
              values: _views,
              labels: [for (final v in _views) 'extras.board.view_$v'.tr(args: ['${d?.counts[v] ?? 0}'])],
              selected: _view,
              onChanged: _select,
            ),
            const SizedBox(height: 12),
            if (d == null && !_failed) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
            if (_failed && d == null) Text('extras.board.error'.tr(), style: AppText.muted()),
            if (d != null && d.view == _view && d.rows.isEmpty)
              Text('extras.board.empty_$_view'.tr(), key: const Key('extras-empty'), style: AppText.muted()),
            if (d != null && d.view == _view)
              for (final (group, rows) in _groups(d)) ...[
                if (group.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(2, 6, 2, 8),
                    child: Text(
                      '${'extras.board.group_$group'.tr()} · ${rows.length}'.toUpperCase(),
                      style: AppText.label(size: 11, color: group == 'late' ? AppStatus.badText : AppColors.muted),
                    ),
                  ),
                for (final row in rows)
                  _ExtraCard(
                    row: row,
                    group: group,
                    canAct: canAct && _view == 'todo',
                    busy: _busy.contains(row.id),
                    onAccept: () => _act(row, 'accept'),
                    onDone: () => _act(row, 'done'),
                    onRefuse: () => _refuse(row),
                  ),
              ],
          ],
        ),
      ),
    );
  }
}

class _ExtraCard extends StatelessWidget {
  const _ExtraCard({
    required this.row,
    required this.group,
    required this.canAct,
    required this.busy,
    required this.onAccept,
    required this.onDone,
    required this.onRefuse,
  });

  final ExtrasBoardRow row;
  final String group;
  final bool canAct;
  final bool busy;
  final VoidCallback onAccept;
  final VoidCallback onDone;
  final VoidCallback onRefuse;

  @override
  Widget build(BuildContext context) {
    final todo = row.status == 'ordered';
    final late = todo && row.late;
    final (Color pillBg, Color pillFg, Color edge) = late
        ? (AppStatus.bad, Colors.white, AppStatus.bad)
        : group == 'today'
        ? (AppStatus.warnSoft, AppStatus.warnText, AppStatus.warn)
        : (AppColors.panel2, AppColors.ink, AppColors.line);
    final pill = !todo
        ? null
        : (late ? 'extras.board.late_pill' : 'extras.board.before_pill').tr(args: [_dueLabel(row.dueAt)]);
    final flightReturn = row.returnFlight != null && row.expectedReturnAt != row.returnAt;
    final returnLine = flightReturn
        ? 'extras.board.flight_line'.tr(args: [row.returnFlight!, hhmm(row.expectedReturnAt)])
        : 'extras.board.return_line'.tr(args: [hhmm(row.expectedReturnAt)]);
    final vehicle = [row.vehicleModel, row.vehicleColour].whereType<String>().where((s) => s.isNotEmpty).join(' ');
    final place = row.fileCode != null
        ? 'extras.board.file'.tr(args: [row.fileCode!, (row.fileRank ?? 1) == 1 ? '1re' : '${row.fileRank}e'])
        : row.spot != null
        ? 'extras.board.spot'.tr(args: [row.spot!])
        : 'extras.board.no_place'.tr();
    final status = switch (row.status) {
      'done' when row.doneAt != null => 'extras.done_by'.tr(args: [extraWhen(row.doneAt!), row.doneBy ?? '']).trim(),
      'refused' || 'refunded' when row.refusedAt != null => [
        'extras.refused_line'.tr(args: [formatEuros(row.priceCents)]),
        if (row.refusedReason != null) '« ${row.refusedReason} »',
      ].join(' · '),
      _ => row.accepted ? 'extras.board.accepted_by'.tr(args: [row.acceptedBy ?? '']).trim() : null,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        key: Key('extras-row-${row.id}'),
        decoration: BoxDecoration(
          color: late ? AppStatus.badSoft : AppColors.panel,
          borderRadius: BorderRadius.circular(14),
          border: Border(
            left: BorderSide(color: edge, width: 4),
            top: BorderSide(color: late ? AppStatus.badSoft : AppColors.line),
            right: BorderSide(color: late ? AppStatus.badSoft : AppColors.line),
            bottom: BorderSide(color: late ? AppStatus.badSoft : AppColors.line),
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.router.push(ProReservationRoute(id: row.reservationId)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    if (pill != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                        decoration: BoxDecoration(color: pillBg, borderRadius: AppRadius.pill),
                        child: Text(pill.toUpperCase(), style: AppText.body(size: 12, weight: 700, color: pillFg)),
                      ),
                    const Spacer(),
                    Text(returnLine, style: AppText.tabular(size: 12, color: AppColors.muted)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ExtraIconTile(row.kind, size: 30),
                    const SizedBox(width: 10),
                    Expanded(child: Text(row.label, style: AppText.strong(size: 16))),
                    Text(formatEuros(row.priceCents), style: AppText.tabular(size: 13)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  [row.plate, if (vehicle.isNotEmpty) vehicle, place].where((s) => s.isNotEmpty).join(' · '),
                  style: AppText.body(size: 13),
                ),
                Text(row.customerName, style: AppText.muted(size: 12.5)),
                if (status != null) ...[
                  const SizedBox(height: 4),
                  Text(status, style: AppText.body(size: 12.5, weight: 600, color: row.accepted && todo ? AppColors.accent : AppColors.muted)),
                ],
                if (canAct && todo) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (!row.accepted) ...[
                        OutlinedButton(
                          key: Key('extras-accept-${row.id}'),
                          onPressed: busy ? null : onAccept,
                          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 48)),
                          child: Text('extras.accept'.tr()),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: FilledButton(
                          key: Key('extras-done-${row.id}'),
                          onPressed: busy ? null : onDone,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(0, 48),
                            backgroundColor: AppColors.action,
                            foregroundColor: AppColors.onAccent,
                          ),
                          child: Text('extras.mark_done'.tr()),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        key: Key('extras-refuse-${row.id}'),
                        onPressed: busy ? null : onRefuse,
                        style: OutlinedButton.styleFrom(minimumSize: const Size(0, 48)),
                        child: Text('extras.refuse'.tr()),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// « 14:30 » today, « jeu. 30 · 09:00 » on another day.
  static String _dueLabel(DateTime at) {
    final now = DateTime.now();
    final sameDay = at.year == now.year && at.month == now.month && at.day == now.day;
    return sameDay ? hhmm(at) : '${DateFormat('EEE d', 'fr_FR').format(at)} · ${hhmm(at)}';
  }
}

/// « Pas possible ? »: an optional reason, then the refund. Pops the reason ('' without one), null when cancelled.
class _RefuseDialog extends StatefulWidget {
  const _RefuseDialog({required this.row});
  final ExtrasBoardRow row;

  @override
  State<_RefuseDialog> createState() => _RefuseDialogState();
}

class _RefuseDialogState extends State<_RefuseDialog> {
  final _reason = TextEditingController();

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('extras.refuse_title'.tr(args: [widget.row.label])),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('extras.refuse_text'.tr(args: [formatEuros(widget.row.priceCents)]), style: AppText.muted(size: 13)),
          const SizedBox(height: 10),
          TextField(
            key: const Key('extras-refuse-reason'),
            controller: _reason,
            maxLength: 200,
            decoration: InputDecoration(labelText: 'extras.refuse_reason'.tr()),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('extras.cancel'.tr())),
        FilledButton(
          key: const Key('extras-refuse-confirm'),
          onPressed: () => Navigator.of(context).pop(_reason.text),
          child: Text('extras.refuse_confirm'.tr()),
        ),
      ],
    );
  }
}
