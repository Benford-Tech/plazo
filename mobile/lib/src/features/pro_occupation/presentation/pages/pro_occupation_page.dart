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
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_plan/presentation/widgets/plan_map.dart';
import '../../data/models/occupation_models.dart';
import '../bloc/pro_occupation_bloc.dart';

const _occupied = Color(0xFF6EC071);
const _leaving = Color(0xFFF5C400);
const _booked = Color(0xFF5FD3FF);

Color _tone(SpotStateModel s) {
  if (!s.active) return const Color(0xFF9A9A94);
  final o = s.occupant;
  if (o == null) return Colors.white;
  if (o.onSite) return o.leavesToday ? _leaving : _occupied;
  return _booked;
}

/// Bloc 2, step "Occupation" in the app (04/10/2026): the plan in colours, a vehicle by its
/// plate (spot in large type, key hook), the arrivals to place with a suggested spot.
@RoutePage()
class ProOccupationPage extends StatelessWidget implements AutoRouteWrapper {
  const ProOccupationPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ProOccupationBloc>()..add(const ProOccupationStarted()), child: this);

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
          body: state.board == null
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
                      _MiniMap(state: state),
                      const SizedBox(height: 14),
                      Text('occupation.arrivals'.tr(args: ['${state.arrivals.length}']).toUpperCase(), style: AppText.label(size: 11)),
                      const SizedBox(height: 6),
                      if (state.arrivals.isEmpty) Text('occupation.no_arrival'.tr(), style: AppText.muted()),
                      for (final a in state.arrivals) _ArrivalRow(arrival: a, state: state),
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
            v.spot?.code ?? 'occupation.no_spot'.tr(),
            key: const Key('vehicle-spot'),
            style: AppText.big(size: 36, color: AppColors.accent),
          ),
          const SizedBox(height: 4),
          Text(
            '${'status.${v.status}'.tr()} · ${'occupation.return_on'.tr(args: ['${localDay(v.returnAt)} ${localTime(v.returnAt)}'])}'
            '${v.returnFlight != null ? ' · ${'occupation.flight'.tr(args: [v.returnFlight!])}' : ''}',
            style: AppText.muted(size: 13),
          ),
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
                  label: v.spot == null ? 'occupation.choose_spot'.tr() : 'occupation.move'.tr(),
                  busy: busy,
                  onPressed: () => showSpotPicker(context, widget.state, v, keyHook: _keys.text.trim().isEmpty ? null : _keys.text.trim()),
                ),
              ),
              if (v.spot != null) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: OutlineAction(
                    key: const Key('vehicle-release'),
                    label: 'occupation.release'.tr(),
                    onPressed: busy ? null : () => bloc.add(ProOccupationPlaced(reservationId: v.id, spotId: null)),
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
          const SizedBox(height: 8),
          Row(
            children: [
              if (best != null)
                Expanded(
                  child: GradientButton(
                    key: Key('place-${arrival.reference}'),
                    label: 'occupation.place'.tr(),
                    busy: busy,
                    onPressed: () => bloc.add(ProOccupationPlaced(reservationId: arrival.id, spotId: best.spotId)),
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

  static String _reason(SuggestionModel s) => switch (s.reason) {
    'near_handover' => 'occupation.reason_handover'.tr(args: ['${s.distanceM ?? 0}']),
    'near_entrance' => 'occupation.reason_entrance'.tr(args: ['${s.distanceM ?? 0}']),
    _ => 'occupation.reason_free'.tr(),
  };
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

class _MiniMap extends StatelessWidget {
  const _MiniMap({required this.state});
  final ProOccupationState state;

  @override
  Widget build(BuildContext context) {
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
                    color: _tone(s).withValues(alpha: s.occupant == null && s.active ? 0.15 : 0.7),
                    borderColor: _tone(s).withValues(alpha: s.occupant == null ? 0.6 : 1),
                    borderStrokeWidth: 1,
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 12,
          children: [
            _Legend(color: _occupied, label: 'occupation.legend_occupied'.tr()),
            _Legend(color: _leaving, label: 'occupation.legend_leaving'.tr()),
            _Legend(color: _booked, label: 'occupation.legend_booked'.tr()),
          ],
        ),
      ],
    );
  }
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
