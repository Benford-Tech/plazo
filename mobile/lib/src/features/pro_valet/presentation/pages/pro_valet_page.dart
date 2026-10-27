import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/segmented.dart';
import '../../../../shared/widgets/valet_icon.dart';
import '../../data/valet_runs_data_source.dart';

/// « Terminal » (27/10/2026, direction B of https://claude.ai/artifact/5Xu8o9kZgNxKTjfpG3HxqP): the valet's tab. Each
/// valet booking gives two runs (arrival, departure); a valet takes one (« Je prends »), the team sees who went, and
/// one gesture ends it (« Voiture récupérée au terminal » → Sur place, « Voiture rendue au client » → Rendu).
@RoutePage()
class ProValetPage extends StatefulWidget {
  const ProValetPage({super.key});

  @override
  State<ProValetPage> createState() => _ProValetPageState();
}

class _ProValetPageState extends State<ProValetPage> {
  static const _poll = Duration(seconds: 30);
  ValetRunsModel? _data;
  bool _failed = false;
  String _band = 'todo';
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
    if (!locator.isRegistered<ValetRunsDataSource>()) return;
    try {
      final data = await locator<ValetRunsDataSource>().fetch();
      if (mounted) {
        setState(() {
          _data = data;
          _failed = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _act(ValetRun run, String action) async {
    setState(() => _busy.add(run.id));
    try {
      await locator<ValetRunsDataSource>().act(run, action);
    } on DioException catch (e) {
      final body = e.response?.data;
      final code = body is Map ? body['code'] as String? : null;
      final key = 'valet.errors.${code ?? 'generic'}';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(key.tr() == key ? 'valet.errors.generic'.tr() : key.tr())));
      }
    } finally {
      if (mounted) setState(() => _busy.remove(run.id));
    }
    await _load();
  }

  /// « En cours » shows the runs taken (mine first), « À faire » the others still open.
  List<ValetRun> _runs(String band) {
    final runs = (_data?.runs ?? const <ValetRun>[]).where((r) => r.state == band).toList();
    if (band == 'taken') runs.sort((a, b) => (a.mine == b.mine ? 0 : (a.mine ? -1 : 1)));
    return runs;
  }

  @override
  Widget build(BuildContext context) {
    final d = _data;
    final counts = {for (final b in const ['todo', 'taken', 'done']) b: _runs(b).length};
    final runs = _runs(_band);
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'valet.title'.tr()),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          key: const Key('valet-runs'),
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
          children: [
            if (d != null && d.meetingPoint.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    const ValetIcon(size: 18),
                    const SizedBox(width: 6),
                    Expanded(child: Text('valet.meeting_point'.tr(args: [d.meetingPoint]), style: AppText.muted())),
                  ],
                ),
              ),
            Segmented<String>(
              key: const Key('valet-bands'),
              values: const ['todo', 'taken', 'done'],
              labels: [for (final b in const ['todo', 'taken', 'done']) 'valet.band_$b'.tr(args: ['${counts[b]}'])],
              selected: _band,
              onChanged: (b) => setState(() => _band = b),
            ),
            const SizedBox(height: 12),
            if (d == null && !_failed) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
            if (_failed && d == null) Text('valet.error'.tr(), style: AppText.muted()),
            if (d != null && runs.isEmpty) Text('valet.empty_$_band'.tr(), key: const Key('valet-empty'), style: AppText.muted()),
            for (final run in runs) _RunCard(run: run, point: d!.meetingPoint, busy: _busy.contains(run.id), onAct: (a) => _act(run, a)),
          ],
        ),
      ),
    );
  }
}

class _RunCard extends StatelessWidget {
  const _RunCard({required this.run, required this.point, required this.busy, required this.onAct});

  final ValetRun run;
  final String point;
  final bool busy;
  final ValueChanged<String> onAct;

  @override
  Widget build(BuildContext context) {
    final kind = run.arrival ? 'valet.kind_arrival'.tr() : 'valet.kind_departure'.tr();
    final what = (run.arrival ? 'valet.take_at' : 'valet.bring_to').tr(args: [point]);
    final details = [
      formatPhone(run.customerPhone),
      if (run.arrival && run.departureFlight != null) 'valet.flight_out'.tr(args: [run.departureFlight!]),
      if (!run.arrival && run.flightLandedAt != null) 'valet.landed'.tr(args: [hhmm(run.flightLandedAt!)]),
      if (!run.arrival && run.flightLandedAt == null && run.flight != null) 'valet.flight_back'.tr(args: [run.flight!]),
      if (!run.arrival && run.file != null) 'valet.file'.tr(args: [run.file!]),
      if (!run.arrival && run.file == null && run.spot != null) 'valet.spot'.tr(args: [run.spot!]),
      if (!run.arrival && run.keyHook != null) 'valet.hook'.tr(args: [run.keyHook!]),
    ];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        key: Key('valet-run-${run.id}'),
        borderColor: run.state == 'taken' ? AppStatus.info : null,
        child: InkWell(
          onTap: () => context.router.push(ProReservationRoute(id: run.reservationId)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(hhmm(run.meetAt), style: AppText.tabular(size: 17, color: AppColors.accent)),
                  const SizedBox(width: 8),
                  Text(kind.toUpperCase(), style: AppText.label(size: 11, color: AppStatus.info).copyWith(fontWeight: FontWeight.w800)),
                  const Spacer(),
                  if (run.state == 'taken')
                    Text(
                      run.mine ? 'valet.mine'.tr() : 'valet.taken_by'.tr(args: [run.takenBy ?? '']),
                      style: AppText.body(size: 12.5, weight: 700, color: AppStatus.info),
                    ),
                  if (run.state == 'done') Text('valet.done'.tr(), style: AppText.body(size: 12.5, weight: 700, color: AppStatus.ok)),
                ],
              ),
              const SizedBox(height: 4),
              Text(what, style: AppText.strong(size: 14)),
              const SizedBox(height: 8),
              Row(
                children: [
                  FrenchPlate(run.plate),
                  const SizedBox(width: 10),
                  Expanded(child: Text(run.customerName, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.body(size: 14.5))),
                ],
              ),
              const SizedBox(height: 6),
              Text(details.join(' · '), style: AppText.muted(size: 12.5)),
              if (run.state != 'done') ...[const SizedBox(height: 10), _actions(context)],
            ],
          ),
        ),
      ),
    );
  }

  Widget _actions(BuildContext context) {
    final call = OutlinedButton.icon(
      key: Key('valet-call-${run.id}'),
      onPressed: () => locator<LinkService>().open(Uri(scheme: 'tel', path: run.customerPhone.replaceAll(RegExp(r'[\s.()-]'), ''))),
      icon: const Icon(Icons.call_rounded, size: 18),
      label: Text('valet.call'.tr()),
    );
    final primary = run.state == 'todo'
        ? FilledButton(
            key: Key('valet-take-${run.id}'),
            onPressed: busy ? null : () => onAct('take'),
            style: FilledButton.styleFrom(backgroundColor: AppColors.action, foregroundColor: AppColors.onAccent),
            child: Text('valet.take'.tr()),
          )
        : run.mine
        ? FilledButton(
            key: Key('valet-done-${run.id}'),
            onPressed: busy ? null : () => onAct('done'),
            style: FilledButton.styleFrom(backgroundColor: AppColors.action, foregroundColor: AppColors.onAccent),
            child: Text((run.arrival ? 'valet.done_arrival' : 'valet.done_departure').tr(), textAlign: TextAlign.center),
          )
        : null;
    return Row(
      children: [
        if (primary != null) Expanded(child: primary),
        if (primary != null) const SizedBox(width: 8),
        call,
        if (run.state == 'taken' && run.mine)
          IconButton(
            key: Key('valet-release-${run.id}'),
            tooltip: 'valet.release'.tr(),
            onPressed: busy ? null : () => onAct('release'),
            icon: const Icon(Icons.undo_rounded),
          ),
      ],
    );
  }
}
