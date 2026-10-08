import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../pro_reservations/presentation/widgets/reservation_tile.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_plan/presentation/widgets/plan_map.dart';
import '../../data/models/occupation_models.dart';
import '../bloc/pro_occupation_bloc.dart';

const _occupied = Color(0xFF6EC071);
const _leaving = Color(0xFFA3E635);
const _booked = Color(0xFF5FD3FF);

Color _tone(SpotStateModel s) {
  if (!s.active) return const Color(0xFF9A9A94);
  final o = s.occupant;
  if (o == null) return Colors.white;
  if (o.onSite) return o.leavesToday ? _leaving : _occupied;
  return _booked;
}

/// D-B (07/10/2026): the plan read by stay length, in the plan's stay-zone colours.
const _stayColours = <String, Color>{'short': Color(0xFFFFF3B0), 'medium': Color(0xFFA3E635), 'long': Color(0xFFB58900)};
const _noStay = Color(0xFF9A9A94);

Color _stayTone(SpotStateModel s) {
  if (!s.active) return _noStay;
  final key = s.occupant != null ? s.occupant!.stayClass : s.stayClass;
  return _stayColours[key] ?? (s.occupant == null ? Colors.white : _noStay);
}

/// Bloc 2, step "Occupation" in the app (04/10/2026): the plan in colours, a vehicle by its
/// plate (spot in large type, key hook), the arrivals to place with a suggested spot.
@RoutePage()
class ProOccupationPage extends StatelessWidget implements AutoRouteWrapper {
  /// `focus`: a reservation id whose vehicle card opens at once (C-B: "Placer la voiture" from the sheet).
  const ProOccupationPage({super.key, @QueryParam('focus') this.focus});

  final String? focus;

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<ProOccupationBloc>()..add(ProOccupationStarted(focus: focus)), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProOccupationBloc, ProOccupationState>(
      listenWhen: (a, b) => a.errorCode != b.errorCode || a.notice != b.notice,
      listener: (context, state) {
        final text = state.errorCode != null ? translateErrorCode(state.errorCode) : _noticeText(state.notice);
        if (text != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
          context.read<ProOccupationBloc>().add(const ProOccupationErrorDismissed());
        }
      },
      builder: (context, state) {
        final bloc = context.read<ProOccupationBloc>();
        return Scaffold(
          appBar: BrandAppBar(
            pro: true,
            title: 'pro_tabs.parking'.tr(),
            actions: [
              IconButton(
                key: const Key('occ-planning'),
                tooltip: 'planning.title'.tr(),
                icon: const Icon(Icons.view_timeline_outlined),
                onPressed: () => context.router.push(const ProSpotPlanningRoute()),
              ),
              if (can(context.watch<ProAuthBloc>().state.staff?.role, 'parking:manage'))
                IconButton(
                  key: const Key('occ-plan'),
                  tooltip: 'plan.menu'.tr(),
                  icon: const Icon(Icons.map_rounded),
                  onPressed: () => context.router.push(const ProPlanRoute()),
                ),
            ],
          ),
          body: !state.loaded
              ? Center(
                  child: state.viewState.isError
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                        )
                      : const CircularProgressIndicator(color: AppColors.accent),
                )
              : RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: () async => bloc.add(const ProOccupationRefreshed()),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                    children: [
                      _SearchField(state: state),
                      if (state.vehicle != null) ...[const SizedBox(height: 10), _VehicleCard(vehicle: state.vehicle!, state: state)],
                      if (state.vehicle == null && state.query.trim().length >= 2) ...[const SizedBox(height: 6), _Results(state: state)],
                      const SizedBox(height: 14),
                      // S-C (07/10/2026): a parking stored in files reads its occupation in files.
                      if (state.filesMode) _FilesSummary(state: state) else _MiniMap(state: state),
                      const SizedBox(height: 14),
                      Text('occupation.arrivals'.tr(args: ['${state.arrivals.length}']).toUpperCase(), style: AppText.label(size: 11)),
                      const SizedBox(height: 6),
                      if (state.arrivals.isEmpty) Text('occupation.no_arrival'.tr(), style: AppText.muted()),
                      for (final a in state.arrivals)
                        if (state.filesMode) _FileArrivalRow(arrival: a, state: state) else _ArrivalRow(arrival: a, state: state),
                      if (state.filesMode) ...[
                        const SizedBox(height: 14),
                        for (final f in state.files) _FileCard(file: f, state: state),
                      ],
                    ],
                  ),
                ),
        );
      },
    );
  }

  static String? _noticeText(String? notice) {
    if (notice == null) return null;
    final parts = notice.split(':');
    return switch (parts.first) {
      'occupation.placed' => 'occupation.placed'.tr(args: [parts[1], parts[2]]),
      'occupation.filed' => 'occupation.filed'.tr(args: [parts[1], parts[2]]),
      'occupation.prepared' => 'occupation.prepared'.tr(args: [parts[1], parts[2]]),
      'occupation.released' => 'occupation.released'.tr(args: [parts[1]]),
      _ => 'occupation.keys_saved'.tr(),
    };
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.state});
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    return TextField(
      key: const Key('occupation-search'),
      textCapitalization: TextCapitalization.characters,
      onChanged: (q) => bloc.add(ProOccupationSearched(q)),
      decoration: InputDecoration(
        hintText: 'occupation.search_hint'.tr(),
        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.accent),
        suffixIcon: state.searching
            ? const Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent)),
              )
            : null,
      ),
    );
  }
}

class _Results extends StatelessWidget {
  const _Results({required this.state});
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    if (!state.searching && state.results.isEmpty) return Text('occupation.no_result'.tr(), style: AppText.muted());
    return Column(
      children: [
        for (final r in state.results)
          ListTile(
            key: Key('result-${r.id}'),
            contentPadding: EdgeInsets.zero,
            leading: FrenchPlate(r.plate, size: 12),
            title: Text(r.customerName, style: AppText.body(size: 14)),
            trailing: Text(r.spot?.code ?? '—', style: AppText.tabular(size: 15, color: AppColors.accent)),
            onTap: () => bloc.add(ProOccupationVehicleChosen(r)),
          ),
      ],
    );
  }
}

class _VehicleCard extends StatefulWidget {
  const _VehicleCard({required this.vehicle, required this.state});
  final OccupantModel vehicle;
  final ProOccupationState state;

  @override
  State<_VehicleCard> createState() => _VehicleCardState();
}

class _VehicleCardState extends State<_VehicleCard> {
  late final _keys = TextEditingController(text: widget.vehicle.keyHook ?? '');

  @override
  void didUpdateWidget(_VehicleCard old) {
    super.didUpdateWidget(old);
    if (old.vehicle.keyHook != widget.vehicle.keyHook) _keys.text = widget.vehicle.keyHook ?? '';
  }

  @override
  void dispose() {
    _keys.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    final v = widget.vehicle;
    final busy = widget.state.actionState.isProcessing;
    return Container(
      key: const Key('vehicle-card'),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.accent, width: 1.5),
        borderRadius: AppRadius.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              FrenchPlate(v.plate, size: 13),
              const SizedBox(width: 8),
              Expanded(child: Text(v.customerName, style: AppText.strong(size: 14))),
              IconButton(
                tooltip: 'common.close'.tr(),
                icon: const Icon(Icons.close_rounded),
                onPressed: () => bloc.add(const ProOccupationVehicleChosen(null)),
              ),
            ],
          ),
          Text(
            widget.state.filesMode ? (v.file?.code ?? 'occupation.no_spot'.tr()) : (v.spot?.code ?? 'occupation.no_spot'.tr()),
            key: const Key('vehicle-spot'),
            style: AppText.big(size: 36, color: AppColors.accent),
          ),
          if (widget.state.filesMode && v.file != null && v.filePosition != null)
            Text(_positionLabel(v.filePosition!), key: const Key('vehicle-position'), style: AppText.strong(size: 13.5, color: AppColors.accentDeep)),
          const SizedBox(height: 4),
          Text(
            '${'status.${v.status}'.tr()} · ${'occupation.return_on'.tr(args: ['${localDay(v.returnAt)} ${localTime(v.returnAt)}'])}'
            '${v.returnFlight != null ? ' · ${'occupation.flight'.tr(args: [v.returnFlight!])}' : ''}',
            style: AppText.muted(size: 13),
          ),
          if (v.carLat != null && v.carLng != null && v.carLocatedAt != null) ...[
            const SizedBox(height: 4),
            Text(
              '${(v.carLocatedBy == 'staff' ? 'occupation.car_by_staff' : 'occupation.car_by_traveller').tr(args: [hhmm(v.carLocatedAt!)])}'
              '${v.carAccuracyM != null ? ' · ± ${v.carAccuracyM} m' : ''}${v.carNote != null ? ' · ${v.carNote}' : ''}',
              key: const Key('vehicle-car-position'),
              style: AppText.muted(size: 12.5),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text('occupation.key_hook'.tr(), style: AppText.body(size: 13.5)),
              const SizedBox(width: 8),
              SizedBox(
                width: 72,
                child: TextField(
                  key: const Key('key-hook'),
                  controller: _keys,
                  textCapitalization: TextCapitalization.characters,
                  maxLength: 12,
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9 -]'))],
                  decoration: InputDecoration(
                    hintText: 'occupation.key_hook_hint'.tr(),
                    counterText: '',
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                key: const Key('save-keys'),
                style: TextButton.styleFrom(foregroundColor: AppColors.accentDeep, textStyle: AppText.body(size: 14.5, weight: 700)),
                onPressed: busy
                    ? null
                    : () => bloc.add(ProOccupationKeysSaved(reservationId: v.id, keyHook: _keys.text.trim().isEmpty ? null : _keys.text.trim())),
                child: Text('occupation.save_keys'.tr()),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: GradientButton(
                  key: const Key('vehicle-place'),
                  label: widget.state.filesMode
                      ? (v.file == null ? 'occupation.files.choose_file'.tr() : 'occupation.move'.tr())
                      : (v.spot == null ? 'occupation.choose_spot'.tr() : 'occupation.move'.tr()),
                  busy: busy,
                  onPressed: () => widget.state.filesMode
                      ? showFilePicker(context, widget.state, v, keyHook: _keys.text.trim().isEmpty ? null : _keys.text.trim())
                      : showSpotPicker(context, widget.state, v, keyHook: _keys.text.trim().isEmpty ? null : _keys.text.trim()),
                ),
              ),
              if (widget.state.filesMode ? v.file != null : v.spot != null) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: OutlineAction(
                    key: const Key('vehicle-release'),
                    label: widget.state.filesMode ? 'occupation.files.take_out'.tr() : 'occupation.release'.tr(),
                    onPressed: busy
                        ? null
                        : () => bloc.add(
                            widget.state.filesMode ? ProOccupationFiled(reservationId: v.id, fileId: null) : ProOccupationPlaced(reservationId: v.id, spotId: null),
                          ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _ArrivalRow extends StatelessWidget {
  const _ArrivalRow({required this.arrival, required this.state});
  final OccupantModel arrival;
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    final best = arrival.suggestions.isEmpty ? null : arrival.suggestions.first;
    final busy = state.actionState.isProcessing;
    return Container(
      key: Key('arrival-${arrival.reference}'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.line),
        borderRadius: AppRadius.chip,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(localTime(arrival.arrivalAt), style: AppText.tabular(size: 15, color: AppColors.accent)),
              const SizedBox(width: 8),
              FrenchPlate(arrival.plate, size: 12),
              const SizedBox(width: 8),
              Expanded(
                child: Text(arrival.customerName, style: AppText.body(size: 14), overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            best == null
                ? 'occupation.no_free'.tr()
                : '${'occupation.suggested'.tr(args: [best.code])} · ${_reason(best)}${best.stayClass != null ? ' · ${'occupation.stay_zone.${best.stayClass}'.tr()}' : ''}',
            style: AppText.muted(size: 12.5),
          ),
          // O-A (06/10/2026): the file keeps its order, or cars will have to move.
          if (best != null) ...[
            const SizedBox(height: 2),
            Text(_moves(best), key: Key('moves-${arrival.reference}'), style: AppText.strong(size: 12.5, color: best.moves == 0 ? AppStatus.okText : AppStatus.warnText)),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              if (best != null)
                Expanded(
                  child: GradientButton(
                    key: Key('place-${arrival.reference}'),
                    label: 'occupation.place'.tr(),
                    busy: busy,
                    // C-B (06/10/2026): the keys are asked in the same gesture, no second search.
                    onPressed: () async {
                      final keyHook = await showKeysSheet(context, arrival, best.code);
                      if (keyHook == null || !context.mounted) return;
                      bloc.add(ProOccupationPlaced(reservationId: arrival.id, spotId: best.spotId, keyHook: keyHook.isEmpty ? null : keyHook));
                    },
                  ),
                ),
              if (best != null) const SizedBox(width: 8),
              Expanded(
                child: OutlineAction(label: 'occupation.other_spot'.tr(), onPressed: busy ? null : () => showSpotPicker(context, state, arrival)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static String _moves(SuggestionModel s) {
    if (s.moves == 0) return 'occupation.no_move'.tr();
    final parts = <String>[
      if (s.blocking.isNotEmpty) 'occupation.moves_out'.tr(args: ['${s.blocking.length}', s.blocking.first.spotCode, dayTime(s.blocking.first.returnAt)]),
      if (s.blocked.isNotEmpty) 'occupation.moves_blocked'.tr(args: ['${s.blocked.length}', s.blocked.first.spotCode]),
    ];
    return parts.join(' · ');
  }

  static String _reason(SuggestionModel s) => switch (s.reason) {
    'near_handover' => 'occupation.reason_handover'.tr(args: ['${s.distanceM ?? 0}']),
    'near_entrance' => 'occupation.reason_entrance'.tr(args: ['${s.distanceM ?? 0}']),
    _ => 'occupation.reason_free'.tr(),
  };
}

/// "Placer en A-05 · crochet des clés": the keys asked as the car is placed (C-B). Returns the hook
/// ("" when none), or null when dismissed.
Future<String?> showKeysSheet(BuildContext context, OccupantModel vehicle, String spotCode) {
  final controller = TextEditingController();
  return showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(20, 4, 20, 20 + MediaQuery.of(ctx).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('occupation.place_in'.tr(args: [spotCode]), style: AppText.title(size: 20)),
          const SizedBox(height: 4),
          Text('${vehicle.customerName} · ${vehicle.plate}', style: AppText.muted()),
          const SizedBox(height: 14),
          TextField(
            key: const Key('place-keys'),
            controller: controller,
            autofocus: true,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(labelText: 'occupation.key_hook'.tr(), hintText: 'occupation.key_hook_hint'.tr(), helperText: 'occupation.key_hook_optional'.tr()),
            onSubmitted: (v) => Navigator.of(ctx).pop(v.trim()),
          ),
          const SizedBox(height: 14),
          GradientButton(key: const Key('place-confirm'), icon: Icons.local_parking_rounded, label: 'occupation.place_confirm'.tr(), onPressed: () => Navigator.of(ctx).pop(controller.text.trim())),
        ],
      ),
    ),
  );
}

/// The free spots, suggestions first, as a bottom sheet; choosing one places the vehicle.
Future<void> showSpotPicker(BuildContext context, ProOccupationState state, OccupantModel vehicle, {String? keyHook}) {
  final bloc = context.read<ProOccupationBloc>();
  final free = state.freeSpots(first: vehicle.suggestions);
  final suggested = vehicle.suggestions.map((s) => s.spotId).toSet();
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
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('occupation.pick_title'.tr(args: [vehicle.plate]), style: AppText.title(size: 20)),
            ),
            Expanded(
              child: free.isEmpty
                  ? Center(child: Text('occupation.no_free'.tr(), style: AppText.muted()))
                  : ListView.builder(
                      itemCount: free.length,
                      itemBuilder: (_, i) {
                        final s = free[i];
                        return ListTile(
                          key: Key('pick-${s.code}'),
                          minTileHeight: 52,
                          leading: Icon(Icons.local_parking_rounded, color: suggested.contains(s.id) ? AppColors.accent : AppColors.muted),
                          title: Text(s.code, style: AppText.tabular(size: 16)),
                          subtitle: suggested.contains(s.id) ? Text('occupation.suggested_short'.tr(), style: AppText.muted(size: 12)) : null,
                          onTap: () {
                            Navigator.of(sheet).pop();
                            bloc.add(ProOccupationPlaced(reservationId: vehicle.id, spotId: s.id, keyHook: keyHook));
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

class _MiniMap extends StatefulWidget {
  const _MiniMap({required this.state});
  final ProOccupationState state;

  @override
  State<_MiniMap> createState() => _MiniMapState();
}

class _MiniMapState extends State<_MiniMap> {
  bool _byStay = false;

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final spots = state.spots;
    if (spots.isEmpty) return Text('occupation.no_plan'.tr(), style: AppText.muted());
    final all = spots.expand((s) => s.geometry).toList();
    final center = LatLng(all.map((p) => p[1]).reduce((a, b) => a + b) / all.length, all.map((p) => p[0]).reduce((a, b) => a + b) / all.length);
    final stats = state.board!.stats;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'occupation.stats'.tr(args: ['${stats.occupied}', '${stats.active}', '${stats.leavingToday}']),
          key: const Key('occupation-stats'),
          style: AppText.strong(size: 13),
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: AppRadius.card,
          child: SizedBox(
            height: 220,
            child: PlanMap(
              center: center,
              zoom: 18,
              polygons: [
                for (final s in spots)
                  Polygon(
                    points: s.geometry.map((p) => LatLng(p[1], p[0])).toList(),
                    // By stay, a free spot shows its own zone a little stronger than the see-through default.
                    color: (_byStay ? _stayTone(s) : _tone(s)).withValues(alpha: s.occupant == null && s.active ? (_byStay && s.stayClass != null ? 0.35 : 0.15) : 0.7),
                    borderColor: (_byStay ? _stayTone(s) : _tone(s)).withValues(alpha: s.occupant == null ? 0.6 : 1),
                    borderStrokeWidth: 1,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 12,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _ModeChip(label: 'occupation.mode_state'.tr(), selected: !_byStay, onTap: () => setState(() => _byStay = false)),
            _ModeChip(label: 'occupation.mode_stay'.tr(), selected: _byStay, onTap: () => setState(() => _byStay = true)),
            if (_byStay) ...[
              _Legend(color: _stayColours['short']!, label: 'occupation.stay_legend.short'.tr()),
              _Legend(color: _stayColours['medium']!, label: 'occupation.stay_legend.medium'.tr()),
              _Legend(color: _stayColours['long']!, label: 'occupation.stay_legend.long'.tr()),
              _Legend(color: _noStay, label: 'occupation.stay_legend.none'.tr()),
            ] else ...[
              _Legend(color: _occupied, label: 'occupation.legend_occupied'.tr()),
              _Legend(color: _leaving, label: 'occupation.legend_leaving'.tr()),
              _Legend(color: _booked, label: 'occupation.legend_booked'.tr()),
            ],
          ],
        ),
      ],
    );
  }
}

/// "Par état · Par durée": which reading the mini map gives.
class _ModeChip extends StatelessWidget {
  const _ModeChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: selected ? AppColors.action : Colors.transparent,
        border: Border.all(color: selected ? AppColors.accent : AppColors.line),
      ),
      child: Text(label, style: AppText.strong(size: 11.5, color: selected ? const Color(0xFF0F2A14) : AppColors.ink)),
    ),
  );
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(width: 10, height: 10, color: color),
      const SizedBox(width: 4),
      Text(label, style: AppText.muted(size: 11.5)),
    ],
  );
}

// ---- S-C (07/10/2026): the occupation read in files ----------------------------------------------

String _positionLabel(int position) => position == 1 ? 'occupation.files.position_first'.tr() : 'occupation.files.position'.tr(args: ['$position']);

String _choiceReason(FileChoiceModel c) => c.reason == 'moves' ? 'occupation.files.reason.moves'.tr(args: ['${c.moves}']) : 'occupation.files.reason.${c.reason}'.tr();

/// The figure that matters on a valet parking: cars to take out today (0 is the goal), then the room.
class _FilesSummary extends StatelessWidget {
  const _FilesSummary({required this.state});
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
    final s = state.fileBoard!.stats;
    final ok = s.movesToday == 0;
    return Container(
      key: const Key('files-summary'),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: AppRadius.card, border: Border.all(color: AppColors.line)),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${s.movesToday}', key: const Key('moves-today'), style: AppText.big(size: 34, color: ok ? AppStatus.okText : AppStatus.badText)),
              Text('occupation.files.moves_today'.tr().toUpperCase(), style: AppText.label(size: 10.5)),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('occupation.files.stats'.tr(args: ['${s.onSite}', '${s.capacity}', '${s.files}']), key: const Key('files-stats'), style: AppText.strong(size: 13.5)),
                if (s.unsound > 0) Text('occupation.files.unsound'.tr(args: ['${s.unsound}']), style: AppText.strong(size: 12.5, color: AppStatus.badText)),
                Text('occupation.files.moves_help'.tr(), style: AppText.muted(size: 12)),
                TextButton(
                  key: const Key('files-prepare'),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, foregroundColor: AppColors.accentDeep, textStyle: AppText.body(size: 13.5, weight: 700)),
                  onPressed: state.actionState.isProcessing ? null : () => context.read<ProOccupationBloc>().add(const ProOccupationFilesPrepared()),
                  child: Text('occupation.files.prepare'.tr()),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// An arrival to place, with the file the rule picks: "Ranger en F07" asks the keys in the same gesture.
class _FileArrivalRow extends StatelessWidget {
  const _FileArrivalRow({required this.arrival, required this.state});
  final OccupantModel arrival;
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    final best = arrival.suggested;
    final busy = state.actionState.isProcessing;
    return Container(
      key: Key('arrival-${arrival.reference}'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(border: Border.all(color: AppColors.line), borderRadius: AppRadius.chip),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(localTime(arrival.arrivalAt), style: AppText.tabular(size: 15, color: AppColors.accent)),
              const SizedBox(width: 8),
              FrenchPlate(arrival.plate, size: 12),
              const SizedBox(width: 8),
              Expanded(child: Text(arrival.customerName, style: AppText.body(size: 14), overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 4),
          Text('occupation.return_on'.tr(args: ['${localDay(arrival.returnAt)} ${localTime(arrival.returnAt)}']), style: AppText.muted(size: 12.5)),
          const SizedBox(height: 6),
          Text(
            best == null ? 'occupation.files.no_file'.tr() : 'occupation.files.choice'.tr(args: [best.code, '${best.cars}', '${best.capacity}', _choiceReason(best)]),
            key: Key('suggested-${arrival.reference}'),
            style: AppText.strong(size: 13, color: best == null ? AppStatus.badText : AppColors.accentDeep),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (best != null)
                Expanded(
                  child: GradientButton(
                    key: Key('place-${arrival.reference}'),
                    label: 'occupation.files.place_in'.tr(args: [best.code]),
                    busy: busy,
                    onPressed: () async {
                      final keyHook = await showKeysSheet(context, arrival, best.code);
                      if (keyHook == null || !context.mounted) return;
                      bloc.add(ProOccupationFiled(reservationId: arrival.id, fileId: best.fileId, keyHook: keyHook.isEmpty ? null : keyHook));
                    },
                  ),
                ),
              if (best != null) const SizedBox(width: 8),
              Expanded(child: OutlineAction(label: 'occupation.files.other_file'.tr(), onPressed: busy ? null : () => showFilePicker(context, state, arrival))),
            ],
          ),
        ],
      ),
    );
  }
}

/// One file as a stack, from the aisle (top) to the back: a car in red must wait for the ones in front.
class _FileCard extends StatelessWidget {
  const _FileCard({required this.file, required this.state});
  final FileViewModel file;
  final ProOccupationState state;

  String _dayLabel() {
    if (file.cars.isEmpty) return file.plannedDay != null ? 'occupation.files.kept_for'.tr(args: [localDay('${file.plannedDay}T00:00')]) : 'occupation.files.free_file'.tr();
    final day = file.day;
    if (day == null) return '';
    return 'occupation.files.returns_of'.tr(args: [day == state.fileBoard!.date ? 'occupation.files.today'.tr() : localDay('${day}T00:00')]);
  }

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ProOccupationBloc>();
    final full = file.cars.length >= file.capacity;
    return Container(
      key: Key('file-${file.code}'),
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: file.sound ? AppColors.line : AppStatus.badText, width: file.sound ? 1 : 1.5),
        borderRadius: AppRadius.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
            child: Row(
              children: [
                Text(file.code, style: AppText.tabular(size: 18, color: AppColors.accentDeep)),
                const SizedBox(width: 10),
                Expanded(child: Text(file.name ?? _dayLabel(), style: AppText.muted(size: 12.5), overflow: TextOverflow.ellipsis)),
                Text('${file.cars.length}/${file.capacity}', style: AppText.tabular(size: 13, color: full ? AppStatus.badText : AppColors.muted)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text('occupation.files.aisle'.tr().toUpperCase(), style: AppText.label(size: 9.5)),
          ),
          for (final c in file.cars)
            InkWell(
              key: Key('car-${c.reference}'),
              onTap: () => bloc.add(ProOccupationVehicleChosen(c.copyWith(file: FileRefModel(id: file.id, code: file.code, name: file.name), filePosition: c.position))),
              child: Container(
                margin: const EdgeInsets.fromLTRB(10, 3, 10, 3),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: c.blockedBy.isNotEmpty ? AppStatus.badSoft : (c.leavesToday ? AppStatus.infoSoft : Colors.transparent),
                  border: Border.all(color: c.blockedBy.isNotEmpty ? AppStatus.badText : AppColors.line),
                  borderRadius: AppRadius.chip,
                ),
                child: Row(
                  children: [
                    Text('${c.position ?? ''}', style: AppText.tabular(size: 12, color: AppColors.muted)),
                    const SizedBox(width: 8),
                    FrenchPlate(c.plate, size: 11),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.customerName, style: AppText.body(size: 13), overflow: TextOverflow.ellipsis),
                          Text('${localDay(c.returnAt)} ${localTime(c.returnAt)}', style: AppText.muted(size: 11.5)),
                          if (c.blockedBy.isNotEmpty)
                            Text('occupation.files.to_take_out'.tr(args: ['${c.blockedBy.length}']), style: AppText.strong(size: 11.5, color: AppStatus.badText)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          for (var i = file.cars.length; i < file.capacity; i++)
            Container(
              margin: const EdgeInsets.fromLTRB(10, 3, 10, 3),
              height: 18,
              decoration: BoxDecoration(border: Border.all(color: AppColors.line.withValues(alpha: 0.6)), borderRadius: AppRadius.chip),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 10),
            child: Text('occupation.files.back'.tr().toUpperCase(), style: AppText.label(size: 9.5)),
          ),
        ],
      ),
    );
  }
}

/// The files for a vehicle: the ranked choices of an arrival, else every file with room.
Future<void> showFilePicker(BuildContext context, ProOccupationState state, OccupantModel vehicle, {String? keyHook}) {
  final bloc = context.read<ProOccupationBloc>();
  final choices = vehicle.choices.isNotEmpty
      ? vehicle.choices
      : state.files
            .where((f) => f.active)
            .map((f) => FileChoiceModel(fileId: f.id, code: f.code, reason: f.cars.length >= f.capacity ? 'full' : 'empty', cars: f.cars.length, capacity: f.capacity))
            .toList();
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
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('occupation.files.pick_title'.tr(args: [vehicle.plate]), style: AppText.title(size: 20)),
            ),
            Expanded(
              child: choices.isEmpty
                  ? Center(child: Text('occupation.files.no_file_yet'.tr(), style: AppText.muted()))
                  : ListView.builder(
                      itemCount: choices.length,
                      itemBuilder: (_, i) {
                        final c = choices[i];
                        final sound = c.moves == 0 && c.reason != 'full';
                        return ListTile(
                          key: Key('pick-${c.code}'),
                          minTileHeight: 52,
                          enabled: c.reason != 'full',
                          leading: Icon(Icons.view_stream_rounded, color: sound ? AppColors.accent : AppStatus.warnText),
                          title: Text(c.code, style: AppText.tabular(size: 16)),
                          subtitle: Text('${c.cars}/${c.capacity} · ${_choiceReason(c)}', style: AppText.muted(size: 12)),
                          onTap: () {
                            Navigator.of(sheet).pop();
                            bloc.add(ProOccupationFiled(reservationId: vehicle.id, fileId: c.fileId, keyHook: keyHook));
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
