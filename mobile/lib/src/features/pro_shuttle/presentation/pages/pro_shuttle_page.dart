import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../pro_reservations/presentation/widgets/reservation_tile.dart';
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../bloc/live_shuttles_bloc.dart';
import '../bloc/shuttle_bloc.dart';
import '../bloc/shuttle_waves_bloc.dart';
import '../widgets/live_shuttles_card.dart';
import '../widgets/shuttle_waves_card.dart';
import '../widgets/vehicle_sheet.dart';

/// R4, the driver's "Navette" screen: the trip in progress (position shared), two sides (T-A,
/// 04/10/2026): the returns to pick up at the airport grouped by terminal with their flight status,
/// or the arrived travellers to drop off at the terminal; "Démarrer le trajet (N clients)" and
/// "Clients récupérés · retour parking" / "Clients déposés au terminal".
@RoutePage()
class ProShuttlePage extends StatelessWidget implements AutoRouteWrapper {
  /// `direction` / `reservationId` (C-B, 06/10/2026): opened from a booking's sheet, that side and traveller are preselected.
  const ProShuttlePage({super.key, @QueryParam('sens') this.direction, @QueryParam('reservation') this.reservationId});

  final String? direction;
  final String? reservationId;

  @override
  Widget wrappedRoute(BuildContext context) {
    // The vehicle taken for the day (V-A), else the driver's usual one, is preselected.
    final staff = context.read<ProAuthBloc?>()?.state.staff;
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => locator<ShuttleBloc>()
            ..add(ShuttleStarted(staffId: staff?.id, vehicleId: staff?.vehicle?.id, direction: direction == 'dropoff' || direction == 'pickup' ? direction : null, reservationId: reservationId)),
        ),
        BlocProvider(create: (_) => locator<LiveShuttlesBloc>()..add(const LiveShuttlesStarted())),
        BlocProvider(create: (_) => locator<ShuttleWavesBloc>()..add(const ShuttleWavesStarted())),
      ],
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: '${Product.proName} · ${'shuttle.tour_title'.tr()}'),
      body: BlocBuilder<ShuttleBloc, ShuttleState>(
        builder: (context, state) {
          final bloc = context.read<ShuttleBloc>();
          if (!state.loaded) {
            return Center(
              child: state.viewState.isError
                  ? Padding(padding: const EdgeInsets.all(24), child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center))
                  : const CircularProgressIndicator(color: AppColors.accent),
            );
          }
          return Column(
            children: [
              // F-A: three bands that the travellers move through as the driver ticks them.
              _BandBar(state: state, onChanged: (b) => bloc.add(ShuttleBandChanged(b))),
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.accent,
                  onRefresh: () async {
                    bloc.add(const ShuttlePolled());
                    context.read<LiveShuttlesBloc>().add(const LiveShuttlesPolled());
                    context.read<ShuttleWavesBloc>().add(const ShuttleWavesPolled());
                  },
                  child: ListView(
                    key: ValueKey('band-list-${state.band}'),
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                    children: switch (state.band) {
                      1 => _routeBand(context, state),
                      2 => _stayBand(state),
                      _ => _tourBand(context, state),
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Band 1, "À emmener" / "À récupérer": the travellers to take, grouped by stop with the advised leave time.
  List<Widget> _tourBand(BuildContext context, ShuttleState state) {
    final bloc = context.read<ShuttleBloc>();
    final meeting = state.meetingPoint;
    final empty = state.dropoff ? state.departures!.rows.isEmpty : state.pickups!.rows.isEmpty;
    return [
      // V-A: the day's waves; "Démarrer ce trajet" preselects the wave's travellers below.
      ShuttleWavesCard(
        running: state.running,
        onStart: (wave) => bloc.add(ShuttleWaveChosen(direction: wave.direction, stopId: wave.stopId, reservationIds: wave.members.map((m) => m.reservationId).toList())),
      ),
      const SizedBox(height: 12),
      if (!state.running)
        Text(
          state.sharePosition
              ? (state.dropoff ? 'shuttle.intro_dropoff'.tr() : 'shuttle.intro'.tr())
              : (state.dropoff ? 'shuttle.intro_dropoff_no_share'.tr() : 'shuttle.intro_no_share'.tr()),
          style: AppText.muted(),
        ),
      const SizedBox(height: 10),
      _DirectionToggle(direction: state.direction, enabled: !state.running, onChanged: (d) => bloc.add(ShuttleDirectionChanged(d))),
      const SizedBox(height: 10),
      if (state.hasStopChoice) ...[
        _StopChoice(stops: state.stops, stopId: state.stopId, enabled: !state.running, onChanged: (id) => bloc.add(ShuttleStopChanged(id))),
        const SizedBox(height: 10),
      ],
      if (!state.dropoff && state.chosenStop == null) _MeetingPoint(meeting: meeting),
      if (state.chosenStop != null) _StopPoint(stop: state.chosenStop!),
      ..._notices(context, state),
      const SizedBox(height: 14),
      if (empty) Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Text(state.dropoff ? 'shuttle.empty_dropoff'.tr() : 'shuttle.empty'.tr(), style: AppText.muted())),
      for (final group in state.tourGroups) ...[
        _GroupHeader(
          title: state.dropoff
              ? (group.stop.isEmpty ? 'shuttle.to_drop_off'.tr() : 'shuttle.to_drop_off_stop'.tr(args: [group.stop]))
              : 'shuttle.to_pick_up'.tr(args: [group.stop.isEmpty ? 'shuttle.no_terminal'.tr() : group.stop]),
          leaveAt: group.leaveAt,
        ),
        const SizedBox(height: 8),
        for (final row in group.departures) ...[
          _DepartureTile(
            row: row,
            selected: state.selected.contains(row.reservationId),
            onTrip: state.running && state.trip!.passengers.any((p) => p.reservationId == row.reservationId),
            selectable: !state.running && row.tripId == null && !row.expected,
            onTap: () => bloc.add(ShuttlePassengerToggled(row.reservationId)),
          ),
          const SizedBox(height: 8),
        ],
        for (final row in group.pickups) ...[
          _PickupTile(
            row: row,
            selected: state.selected.contains(row.reservationId),
            onTrip: state.running && state.trip!.passengers.any((p) => p.reservationId == row.reservationId),
            selectable: !state.running && row.tripId == null,
            onTap: () => bloc.add(ShuttlePassengerToggled(row.reservationId)),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 6),
      ],
      const SizedBox(height: 8),
      if (!state.running) ...[
        if (state.selected.isNotEmpty) ...[
          Text(
            state.selected.length == 1
                ? 'shuttle.selected_one'.tr(args: ['${state.selectedPassengers}'])
                : 'shuttle.selected_summary'.tr(args: ['${state.selected.length}', '${state.selectedPassengers}']),
            key: const Key('selected-summary'),
            textAlign: TextAlign.center,
            style: AppText.muted(size: 12.5),
          ),
          const SizedBox(height: 8),
        ],
        GradientButton(
          key: const Key('start-trip'),
          icon: Icons.directions_bus_rounded,
          label: state.selected.isEmpty
              ? 'shuttle.start_none'.tr()
              : state.selected.length == 1
              ? (state.dropoff ? 'shuttle.start_one_dropoff' : 'shuttle.start_one').tr()
              : (state.dropoff ? 'shuttle.start_dropoff' : 'shuttle.start').tr(args: ['${state.selected.length}']),
          busy: state.actionState.isProcessing,
          onPressed: state.selected.isEmpty ? null : () => _confirmVehicle(context, state),
        ),
      ] else
        OutlineAction(key: const Key('go-route'), icon: Icons.directions_bus_rounded, label: 'shuttle.band_route'.tr(), onPressed: () => bloc.add(const ShuttleBandChanged(1))),
    ];
  }

  /// Band 2, "En route": the team's shuttles on the map, my trip with its passengers, "Clients déposés".
  List<Widget> _routeBand(BuildContext context, ShuttleState state) {
    final bloc = context.read<ShuttleBloc>();
    return [
      // P-A: the team's shuttles on the road (the driver's own included).
      const LiveShuttlesCard(),
      const SizedBox(height: 12),
      ..._notices(context, state),
      if (state.running) ...[
        _RunningCard(state: state),
        const SizedBox(height: 12),
        Semantics(header: true, child: Text('shuttle.route_passengers'.tr(), style: AppText.title(size: 18))),
        const SizedBox(height: 8),
        for (final p in state.trip!.passengers) ...[
          AppCard(
            key: Key('route-${p.reservationId}'),
            child: Row(
              children: [
                const Icon(Icons.person_rounded, size: 18, color: AppColors.accent),
                const SizedBox(width: 8),
                Expanded(child: Text('${p.customerName} · ${'shuttle.pax'.tr(args: ['${p.passengers}'])}', style: AppText.strong(size: 14.5))),
                if (p.terminal != null) ...[Text(p.terminal!, style: AppText.muted(size: 12.5)), const SizedBox(width: 8)],
                FrenchPlate(p.plate, size: 11),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 8),
        GradientButton(
          key: const Key('end-trip'),
          icon: Icons.check_rounded,
          label: state.trip!.dropoff ? 'shuttle.end_dropoff'.tr() : 'shuttle.end'.tr(),
          busy: state.actionState.isProcessing,
          onPressed: state.actionState.isProcessing ? null : () => bloc.add(const ShuttleEndRequested()),
        ),
      ] else
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Text('shuttle.route_none'.tr(args: [(state.dropoff ? 'shuttle.band_take' : 'shuttle.band_fetch').tr()]), key: const Key('route-none'), textAlign: TextAlign.center, style: AppText.muted()),
        ),
    ];
  }

  /// Band 3: "En séjour" by return day on the drop-off side, "Rendus" today on the pick-up side.
  List<Widget> _stayBand(ShuttleState state) {
    final staying = state.staying;
    if (state.dropoff) {
      final days = staying?.days ?? const <StayingDayModel>[];
      return [
        if (days.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Text('shuttle.stay_none'.tr(), key: const Key('stay-none'), textAlign: TextAlign.center, style: AppText.muted())),
        for (final day in days) ...[
          Text(
            day.rows.length == 1 ? 'shuttle.stay_day_one'.tr(args: [planningDay(DateTime.parse(day.date))]) : 'shuttle.stay_day'.tr(args: [planningDay(DateTime.parse(day.date)), '${day.rows.length}']),
            style: AppText.label(size: 12),
          ),
          const SizedBox(height: 6),
          for (final row in day.rows) ...[_StayingTile(row: row), const SizedBox(height: 6)],
          const SizedBox(height: 8),
        ],
      ];
    }
    final back = staying?.returnedToday ?? const <StayingRowModel>[];
    return [
      Semantics(header: true, child: Text('shuttle.back_today'.tr(), style: AppText.title(size: 18))),
      const SizedBox(height: 8),
      if (back.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Text('shuttle.back_none'.tr(), key: const Key('back-none'), textAlign: TextAlign.center, style: AppText.muted())),
      for (final row in back) ...[_StayingTile(row: row), const SizedBox(height: 6)],
    ];
  }

  List<Widget> _notices(BuildContext context, ShuttleState state) {
    final bloc = context.read<ShuttleBloc>();
    return [
      if (state.endedNotice) ...[
        const SizedBox(height: 10),
        AppCard(
          color: AppColors.canvas,
          child: Row(
            children: [
              Expanded(child: Text('shuttle.ended'.tr(), key: const Key('trip-ended'), style: AppText.body(size: 14))),
              IconButton(icon: const Icon(Icons.close_rounded, size: 18), onPressed: () => bloc.add(const ShuttleErrorDismissed())),
            ],
          ),
        ),
      ],
      if (state.locationProblem != null) ...[
        const SizedBox(height: 10),
        AppCard(color: const Color(0xFFFDF1F0), borderColor: const Color(0xFFF2C9C5), child: Text('shuttle.location_denied'.tr(), style: AppText.body(size: 14, color: AppColors.danger))),
      ],
      if (state.errorCode != null && state.actionState.isError) ...[
        const SizedBox(height: 10),
        AppCard(color: const Color(0xFFFDF1F0), borderColor: const Color(0xFFF2C9C5), child: Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, color: AppColors.danger))),
      ],
    ];
  }

  Future<void> _confirmVehicle(BuildContext context, ShuttleState state) async {
    final bloc = context.read<ShuttleBloc>();
    final choice = await showVehicleSheet(context, vehicles: state.availableVehicles, current: state.vehicle, passengers: state.selectedPassengers);
    if (choice == null) return;
    bloc
      ..add(ShuttleVehicleChosen(choice))
      ..add(const ShuttleStartRequested());
  }
}

/// F-A: the three bands with their counts ("À emmener · 5", "En route · 1", "En séjour · 12").
class _BandBar extends StatelessWidget {
  const _BandBar({required this.state, required this.onChanged});
  final ShuttleState state;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final labels = [
      (state.dropoff ? 'shuttle.band_take' : 'shuttle.band_fetch').tr(),
      'shuttle.band_route'.tr(),
      (state.dropoff ? 'shuttle.band_stay' : 'shuttle.band_back').tr(),
    ];
    final counts = [state.bandCount1, state.bandCount2, state.bandCount3];
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: Row(
        children: [
          for (var i = 0; i < 3; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: Material(
                color: state.band == i ? AppColors.action : AppColors.canvas,
                borderRadius: AppRadius.pill,
                child: InkWell(
                  key: Key('band-$i'),
                  borderRadius: AppRadius.pill,
                  onTap: () => onChanged(i),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      '${labels[i]} · ${counts[i]}',
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.body(size: 12.5, weight: state.band == i ? 700 : 600, color: state.band == i ? AppColors.onAccent : AppColors.muted),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// "Terminal 1" and, under it, "Départ conseillé 10:05" (the earliest leave time of the group).
class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.title, this.leaveAt});
  final String title;
  final DateTime? leaveAt;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(header: true, child: Text(title, style: AppText.title(size: 20))),
        if (leaveAt != null)
          Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 14, color: AppColors.accent),
              const SizedBox(width: 4),
              Text('shuttle.group_leave'.tr(args: [hhmm(leaveAt!)]), style: AppText.strong(size: 12.5, color: AppColors.accent)),
            ],
          ),
      ],
    );
  }
}

/// A traveller away (band "En séjour") or back today (band "Rendus"): spot, name, return flight and time, status.
class _StayingTile extends StatelessWidget {
  const _StayingTile({required this.row});
  final StayingRowModel row;

  @override
  Widget build(BuildContext context) {
    final details = [if (row.returnFlight != null) row.returnFlight! else if (row.stopName != null) row.stopName!, hhmm(row.returnedAt ?? row.returnAt)].join(' · ');
    return AppCard(
      key: Key('staying-${row.reservationId}'),
      padding: const EdgeInsets.fromLTRB(12, 9, 12, 9),
      child: Row(
        children: [
          if (row.spot != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(color: AppColors.canvas, borderRadius: BorderRadius.circular(6)),
              child: Text(row.spot!, style: AppText.tabular(size: 12)),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text.rich(
              TextSpan(children: [TextSpan(text: row.customerName, style: AppText.strong(size: 14)), TextSpan(text: ' · $details', style: AppText.muted(size: 13))]),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          proStatusBadge(row.status),
        ],
      ),
    );
  }
}

/// "Trajet en cours · ma position est partagée" (peach border, as the approved frame).
class _RunningCard extends StatelessWidget {
  const _RunningCard({required this.state});
  final ShuttleState state;

  @override
  Widget build(BuildContext context) {
    final trip = state.trip!;
    final v = trip.vehicle;
    final vehicle = [v.model, v.colour, if (v.plate != null) formatPlate(v.plate!)].whereType<String>().join(' ');
    return AppCard(
      key: const Key('trip-running'),
      borderColor: AppColors.peach,
      borderWidth: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const LiveDot(color: AppColors.peach),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  trip.sharePosition
                      ? (trip.dropoff ? 'shuttle.running_dropoff'.tr() : 'shuttle.running'.tr())
                      : (trip.dropoff ? 'shuttle.running_dropoff_no_share'.tr() : 'shuttle.running_no_share'.tr()),
                  style: AppText.strong(size: 15, color: AppColors.peach),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (trip.stop != null && !trip.stop!.builtIn) Text('shuttle.running_stop'.tr(args: [trip.stop!.name]), key: const Key('trip-stop'), style: AppText.muted()),
          if (vehicle.isNotEmpty) Text('shuttle.running_vehicle'.tr(args: [vehicle]), style: AppText.muted()),
          Text(
            '${'shuttle.running_passengers'.tr(args: ['${trip.passengers.length}'])} · ${'shuttle.running_left'.tr(args: [durationLabel(state.remaining)])}',
            style: AppText.muted(),
          ),
        ],
      ),
    );
  }
}

/// "Retours · aéroport" / "Départs · terminal" (T-A "Deux sens").
class _DirectionToggle extends StatelessWidget {
  const _DirectionToggle({required this.direction, required this.enabled, required this.onChanged});
  final String direction;
  final bool enabled;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<String>(
      key: const Key('direction-toggle'),
      segments: [
        ButtonSegment(value: 'pickup', icon: const Icon(Icons.flight_land_rounded, size: 18), label: Text('shuttle.direction_pickup'.tr())),
        ButtonSegment(value: 'dropoff', icon: const Icon(Icons.flight_takeoff_rounded, size: 18), label: Text('shuttle.direction_dropoff'.tr())),
      ],
      selected: {direction},
      showSelectedIcon: false,
      style: ButtonStyle(
        shape: const WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: AppRadius.chip)),
        side: const WidgetStatePropertyAll(BorderSide(color: AppColors.line)),
        backgroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.accent : AppColors.surface),
        foregroundColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.onAccent : AppColors.ink),
        textStyle: WidgetStatePropertyAll(AppText.body(size: 13, weight: 600)),
      ),
      onSelectionChanged: enabled ? (set) => onChanged(set.first) : null,
    );
  }
}

/// "Desserte" (D-A): the airport, or one of the parking's stops (the station…), for the next trip.
class _StopChoice extends StatelessWidget {
  const _StopChoice({required this.stops, required this.stopId, required this.enabled, required this.onChanged});
  final List<ShuttleStopModel> stops;
  final String? stopId;
  final bool enabled;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      key: const Key('stop-choice'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.only(top: 9, right: 8), child: Text('shuttle.stop_label'.tr(), style: AppText.label(size: 11))),
        Expanded(
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final s in stops)
                ChoiceChip(
                  key: Key('stop-${s.id ?? 'airport'}'),
                  label: Text(s.builtIn ? 'shuttle.stop_airport'.tr() : s.name),
                  avatar: Icon(s.kind == 'station' ? Icons.train_rounded : (s.isAirport ? Icons.flight_rounded : Icons.place_rounded), size: 16),
                  selected: s.id == stopId,
                  onSelected: enabled ? (_) => onChanged(s.id) : null,
                  showCheckmark: false,
                  selectedColor: AppColors.accent,
                  labelStyle: AppText.body(size: 13, weight: 600, color: s.id == stopId ? AppColors.onAccent : AppColors.ink),
                  shape: const RoundedRectangleBorder(borderRadius: AppRadius.chip, side: BorderSide(color: AppColors.line)),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Read-only: the stop chosen for the next trip (name and directions).
class _StopPoint extends StatelessWidget {
  const _StopPoint({required this.stop});
  final ShuttleStopModel stop;

  @override
  Widget build(BuildContext context) {
    final instructions = stop.instructions;
    return Row(
      key: const Key('stop-point'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.only(top: 2), child: Icon(stop.kind == 'station' ? Icons.train_rounded : Icons.place_rounded, size: 16, color: AppColors.accent)),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('shuttle.stop_point'.tr(args: [stop.name]), style: AppText.body(size: 13.5, weight: 600)),
              if (instructions != null && instructions.isNotEmpty) Text(instructions, maxLines: 3, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 12.5)),
            ],
          ),
        ),
      ],
    );
  }
}

/// Read-only: the meeting point set in the pro space (label and directions).
class _MeetingPoint extends StatelessWidget {
  const _MeetingPoint({required this.meeting});
  final MeetingPointModel? meeting;

  @override
  Widget build(BuildContext context) {
    final label = meeting?.label;
    final instructions = meeting?.instructions;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(padding: EdgeInsets.only(top: 2), child: Icon(Icons.place_rounded, size: 16, color: AppColors.accent)),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label != null && label.isNotEmpty ? 'shuttle.meeting_point'.tr(args: [label]) : 'shuttle.meeting_point_none'.tr(), style: AppText.body(size: 13.5, weight: 600)),
              if (instructions != null && instructions.isNotEmpty) Text(instructions, maxLines: 3, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 12.5)),
            ],
          ),
        ),
      ],
    );
  }
}

class _PickupTile extends StatelessWidget {
  const _PickupTile({required this.row, required this.selected, required this.onTrip, required this.selectable, required this.onTap});
  final PickupRowModel row;
  final bool selected;
  final bool onTrip;
  final bool selectable;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final f = row.flight;
    final details = [
      if (f.gate != null) 'shuttle.gate'.tr(args: [f.gate!]),
      if (f.number != null) f.landed ? '${'shuttle.flight'.tr(args: [f.number!])} ${'shuttle.badge_landed'.tr(args: [hhmm(f.landedAt ?? f.expectedAt!)]).toLowerCase()}' : 'shuttle.flight'.tr(args: [f.number!]),
    ].join(' · ');
    final highlighted = selected || onTrip;
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.card,
        side: BorderSide(color: highlighted ? AppColors.accent : AppColors.line, width: highlighted ? 2 : 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('pickup-${row.reservationId}'),
        onTap: selectable ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (selectable) ...[
                    Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: selected ? AppColors.accent : AppColors.line),
                    const SizedBox(width: 8),
                  ],
                  Expanded(child: Text('${row.customerName} · ${'shuttle.pax'.tr(args: ['${row.passengers}'])}', style: AppText.strong(size: 14.5))),
                  const SizedBox(width: 8),
                  // Never wider than half the card: a long badge scales down instead of overflowing.
                  ConstrainedBox(constraints: const BoxConstraints(maxWidth: 180), child: FittedBox(fit: BoxFit.scaleDown, child: _Badge(row: row, onTrip: onTrip))),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (details.isNotEmpty) Expanded(child: Text(details, style: AppText.muted(size: 12.5))) else const Spacer(),
                  const SizedBox(width: 8),
                  FrenchPlate(row.plate, size: 11),
                ],
              ),
              // E (06/10/2026): what the traveller signalled today.
              if (row.notice != null) ...[
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: StatusBadge(
                    key: Key('pickup-notice-${row.reservationId}'),
                    text: row.notice!.kind == 'other' && row.notice!.text != null
                        ? '« ${row.notice!.text} »'
                        : 'shuttle.notice.${row.notice!.kind}'.tr() + (row.notice!.text != null ? ' · « ${row.notice!.text} »' : ''),
                    tone: BadgeTone.peach,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// An arrived traveller waiting at the parking for the terminal (drop-off side).
class _DepartureTile extends StatelessWidget {
  const _DepartureTile({required this.row, required this.selected, required this.onTrip, required this.selectable, required this.onTap});
  final DepartureRowModel row;
  final bool selected;
  final bool onTrip;
  final bool selectable;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final highlighted = selected || onTrip;
    final details = [
      if (row.arrivedAt != null) 'shuttle.arrived_at'.tr(args: [hhmm(row.arrivedAt!)]) else 'shuttle.arrival_planned'.tr(args: [hhmm(row.arrivalAt)]),
      if (row.spot != null) 'shuttle.spot'.tr(args: [row.spot!]),
    ].join(' · ');
    return Opacity(
      opacity: row.expected ? 0.7 : 1,
      child: Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.card,
        side: BorderSide(color: highlighted ? AppColors.accent : AppColors.line, width: highlighted ? 2 : 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('departure-${row.reservationId}'),
        onTap: selectable ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (selectable) ...[
                    Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: selected ? AppColors.accent : AppColors.line),
                    const SizedBox(width: 8),
                  ],
                  Expanded(child: Text('${row.customerName} · ${'shuttle.pax'.tr(args: ['${row.passengers}'])}', style: AppText.strong(size: 14.5))),
                  const SizedBox(width: 8),
                  if (onTrip || row.tripId != null)
                    StatusBadge(text: 'shuttle.badge_on_trip'.tr(), tone: BadgeTone.tint)
                  else if (row.expected)
                    StatusBadge(key: Key('expected-${row.reservationId}'), text: 'shuttle.expected_at'.tr(args: [hhmm(row.arrivalAt)]), tone: BadgeTone.muted),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Expanded(child: Text(details, style: AppText.muted(size: 12.5))),
                  const SizedBox(width: 8),
                  FrenchPlate(row.plate, size: 11),
                ],
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}

/// Flight planned / landed / at the meeting point (the badges of the approved frame).
class _Badge extends StatelessWidget {
  const _Badge({required this.row, required this.onTrip});
  final PickupRowModel row;
  final bool onTrip;

  @override
  Widget build(BuildContext context) {
    if (onTrip || row.tripId != null) return StatusBadge(text: 'shuttle.badge_on_trip'.tr(), tone: BadgeTone.tint);
    if (row.atMeetingPoint) return StatusBadge(text: 'shuttle.badge_at_point'.tr(args: [hhmm(row.atMeetingPointAt!)]), tone: BadgeTone.ok);
    final f = row.flight;
    if (f.landed) return StatusBadge(text: 'shuttle.badge_landed_coming'.tr(args: [hhmm(f.landedAt ?? f.expectedAt ?? row.returnAt)]), tone: BadgeTone.peach);
    if (f.cancelled) return StatusBadge(text: 'shuttle.badge_cancelled'.tr(), tone: BadgeTone.danger);
    if (f.number == null) return StatusBadge(text: 'shuttle.badge_return_at'.tr(args: [hhmm(row.returnAt)]), tone: BadgeTone.muted);
    final at = hhmm(f.expectedAt ?? row.returnAt);
    if (f.status == 'delayed') return StatusBadge(text: 'shuttle.badge_delayed'.tr(args: [at]), tone: BadgeTone.peach);
    return StatusBadge(text: 'shuttle.badge_planned'.tr(args: [at]), tone: BadgeTone.muted);
  }
}

/// The sheet picking the vehicle before the trip starts.
Future<TripVehicleChoice?> showVehicleSheet(BuildContext context, {required List<ShuttleVehicleModel> vehicles, TripVehicleChoice? current, int passengers = 0}) =>
    showModalBottomSheet<TripVehicleChoice>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => VehicleSheet(vehicles: vehicles, current: current, passengers: passengers),
    );
