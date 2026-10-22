import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/router/app_router.dart';
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
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../bloc/live_shuttles_bloc.dart';
import '../bloc/shuttle_bloc.dart';
import '../bloc/shuttle_boarding.dart';
import '../widgets/live_shuttles_card.dart';
import '../widgets/vehicle_sheet.dart';
import '../../../../shared/tutorials/tutorial_catalog.dart';
import '../../../../shared/tutorials/tutorial_spot.dart';

/// R4, the driver's "Navette" screen. B (22/10/2026, « le workflow n'est pas bon ») : three tabs, « Aller » (the
/// travellers to take, by time slot of the planning), « Retour » (the ones to fetch, the same way) and « En route » (the
/// running trip); the driver ticks people and leaves for where they go, each booking's own stop (« Desserte », the
/// airport by default): no side or stop to pick first. « Clients déposés » / « Tout le monde est à bord » end the trip.
@RoutePage()
class ProShuttlePage extends StatelessWidget implements AutoRouteWrapper {
  /// `direction` / `reservationId` (C-B, 06/10/2026): opened from a booking's sheet, that side and traveller are preselected.
  /// `boarding` (14/10/2026, « Embarquer »): the traveller with the row standing in for them when the list does not hold
  /// them (an early traveller).
  const ProShuttlePage({super.key, @QueryParam('sens') this.direction, @QueryParam('reservation') this.reservationId, this.boarding});

  final String? direction;
  final String? reservationId;
  final ShuttleBoarding? boarding;

  @override
  Widget wrappedRoute(BuildContext context) {
    // The vehicle taken for the day (V-A), else the driver's usual one, is preselected.
    final staff = context.read<ProAuthBloc?>()?.state.staff;
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => locator<ShuttleBloc>()
            ..add(
              ShuttleStarted(
                staffId: staff?.id,
                vehicleId: staff?.vehicle?.id,
                direction: direction == 'dropoff' || direction == 'pickup' ? direction : null,
                reservationId: reservationId,
                boarding: boarding,
              ),
            ),
        ),
        BlocProvider(create: (_) => locator<LiveShuttlesBloc>()..add(const LiveShuttlesStarted())),
      ],
      child: this,
    );
  }

  @override
  Widget build(BuildContext context) {
    // The vehicle of the day taken or given back meanwhile (Plus › Mon véhicule): the one-tap start follows.
    final auth = context.read<ProAuthBloc?>();
    final page = TutorialSpot(tutorial: Tutorials.proShuttle, child: _page(context));
    if (auth == null) return page;
    return BlocListener<ProAuthBloc, ProAuthState>(
      bloc: auth,
      listenWhen: (a, b) => a.staff?.vehicle?.id != b.staff?.vehicle?.id,
      listener: (context, s) => context.read<ShuttleBloc>().add(ShuttleDayVehicleChanged(s.staff?.vehicle?.id)),
      child: page,
    );
  }

  Widget _page(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: '${Product.proName} · ${'shuttle.tour_title'.tr()}'),
      // Edge-to-edge (Android 15+): pushed above the shell (Plus › Navette, the Navettes tile), the lists end above the
      // navigation bar; in landscape they keep clear of a side bar or cutout. In the driver's tab the shell did both.
      body: SafeArea(
        top: false,
        child: BlocBuilder<ShuttleBloc, ShuttleState>(
          builder: (context, state) {
            final bloc = context.read<ShuttleBloc>();
            if (!state.loaded) {
              return Center(
                child: state.viewState.isError
                    ? Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center),
                      )
                    : const CircularProgressIndicator(color: AppColors.accent),
              );
            }
            return Column(
              children: [
                // B: « Aller · Retour · En route ».
                KeyedSubtree(
                  key: const Key('shuttle-bands'),
                  child: _TabBar(
                    state: state,
                    onChanged: (tab) {
                      if (tab == 2) {
                        bloc.add(const ShuttleBandChanged(1));
                        return;
                      }
                      bloc
                        ..add(ShuttleDirectionChanged(tab == 0 ? 'dropoff' : 'pickup'))
                        ..add(const ShuttleBandChanged(0));
                    },
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    color: AppColors.accent,
                    onRefresh: () async {
                      bloc.add(const ShuttlePolled());
                      context.read<LiveShuttlesBloc>().add(const LiveShuttlesPolled());
                    },
                    child: ListView(
                      key: ValueKey('band-list-${state.band}'),
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                      children: state.band == 1 ? _routeBand(context, state) : _tourBand(context, state),
                    ),
                  ),
                ),
                // The start stays in reach under a long list.
                if (state.band != 1) _StartBar(state: state, onVehicle: () => _confirmVehicle(context, state)),
              ],
            );
          },
        ),
      ),
    );
  }

  /// « Aller » / « Retour »: the travellers by time slot of the planning, each with where they go; ticked one by one or
  /// by slot. The start is in the bar under the list.
  List<Widget> _tourBand(BuildContext context, ShuttleState state) {
    final bloc = context.read<ShuttleBloc>();
    final slots = state.slots;
    return [
      ..._notices(context, state),
      Text(
        state.dropoff
            ? (state.sharePosition ? 'shuttle.intro_go'.tr() : 'shuttle.intro_go_no_share'.tr())
            : (state.sharePosition ? 'shuttle.intro_back'.tr() : 'shuttle.intro_back_no_share'.tr()),
        style: AppText.muted(),
      ),
      if (!state.dropoff) ...[const SizedBox(height: 8), _MeetingPoint(meeting: state.meetingPoint)],
      const SizedBox(height: 12),
      if (slots.isEmpty)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Text(state.dropoff ? 'shuttle.empty_go'.tr() : 'shuttle.empty_back'.tr(), key: const Key('tour-empty'), style: AppText.muted()),
        ),
      for (var i = 0; i < slots.length; i++) ...[
        _SlotHeader(
          key: Key('slot-$i'),
          leaveAt: slots[i].leaveAt,
          allSelected: slots[i].ids.isNotEmpty && slots[i].ids.every(state.selected.contains),
          enabled: !state.running,
          onToggle: () => bloc.add(ShuttleSlotToggled(slots[i].ids)),
        ),
        const SizedBox(height: 6),
        for (final row in slots[i].departures) ...[
          _DepartureTile(
            row: row,
            selected: state.selected.contains(row.reservationId),
            onTrip: state.running && state.trip!.passengers.any((p) => p.reservationId == row.reservationId),
            selectable: !state.running && row.tripId == null,
            onTap: () => bloc.add(ShuttlePassengerToggled(row.reservationId)),
          ),
          const SizedBox(height: 8),
        ],
        for (final row in slots[i].pickups) ...[
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${p.customerName} · ${'shuttle.pax'.tr(args: ['${p.passengers}'])}', style: AppText.strong(size: 14.5)),
                      // To the terminal, every passenger is on site; the ones checked in at boarding show when.
                      if (state.trip!.dropoff) ...[
                        const SizedBox(height: 4),
                        StatusBadge(
                          key: Key('route-on-site-${p.reservationId}'),
                          text: p.checkedInAtBoarding && p.arrivedAt != null
                              ? 'shuttle.on_site_at'.tr(args: [hhmm(p.arrivedAt!)])
                              : 'shuttle.badge_on_site'.tr(),
                        ),
                      ],
                    ],
                  ),
                ),
                if (p.terminal != null) ...[Text(p.terminal!, style: AppText.muted(size: 12.5)), const SizedBox(width: 8)],
                FrenchPlate(p.plate, size: 11),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        // The cars checked in at boarding wait for the valet in « À ranger ».
        if (state.checkedInAtBoarding > 0) ...[
          AppCard(
            color: AppStatus.warnSoft,
            borderColor: AppStatus.warnSoft,
            padding: const EdgeInsets.fromLTRB(12, 9, 12, 9),
            child: Text(
              state.checkedInAtBoarding == 1 ? 'shuttle.checked_in_note_one'.tr() : 'shuttle.checked_in_note_many'.tr(args: ['${state.checkedInAtBoarding}']),
              key: const Key('checked-in-note'),
              style: AppText.body(size: 12.5),
            ),
          ),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 8),
        GradientButton(
          key: const Key('end-trip'),
          icon: Icons.check_rounded,
          label: state.trip!.dropoff ? 'shuttle.end_go'.tr() : 'shuttle.end_back'.tr(),
          busy: state.actionState.isProcessing,
          onPressed: state.actionState.isProcessing ? null : () => bloc.add(const ShuttleEndRequested()),
        ),
      ] else
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Text('shuttle.route_none'.tr(), key: const Key('route-none'), textAlign: TextAlign.center, style: AppText.muted()),
        ),
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
              Expanded(
                child: Text('shuttle.ended'.tr(), key: const Key('trip-ended'), style: AppText.body(size: 14)),
              ),
              IconButton(icon: const Icon(Icons.close_rounded, size: 18), onPressed: () => bloc.add(const ShuttleErrorDismissed())),
            ],
          ),
        ),
      ],
      if (state.locationProblem != null) ...[
        const SizedBox(height: 10),
        AppCard(
          color: const Color(0xFFFDF1F0),
          borderColor: const Color(0xFFF2C9C5),
          child: Text('shuttle.location_denied'.tr(), style: AppText.body(size: 14, color: AppColors.danger)),
        ),
      ],
      if (state.errorCode != null && state.actionState.isError) ...[
        const SizedBox(height: 10),
        AppCard(
          color: const Color(0xFFFDF1F0),
          borderColor: const Color(0xFFF2C9C5),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, color: AppColors.danger)),
              // The travellers added by hand (planning, booking's sheet) that the refused start took out of the selection.
              if (state.unpinned.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  state.unpinned.length == 1
                      ? 'shuttle.unpinned_one'.tr(args: [state.unpinned.single])
                      : 'shuttle.unpinned_many'.tr(args: [_frenchList(state.unpinned)]),
                  key: const Key('unpinned'),
                  style: AppText.body(size: 13, color: AppColors.danger),
                ),
              ],
            ],
          ),
        ),
      ],
    ];
  }

  /// The vehicle sheet: before the start without a vehicle of the day, or « Changer » with one. Nothing ticked: the
  /// choice waits for the start.
  Future<void> _confirmVehicle(BuildContext context, ShuttleState state) async {
    final bloc = context.read<ShuttleBloc>();
    final start = state.selected.isNotEmpty;
    final choice = await showVehicleSheet(
      context,
      vehicles: state.availableVehicles,
      current: state.vehicle,
      passengers: state.selectedPassengers,
      confirmLabel: start ? null : 'shuttle.vehicle_choose'.tr(),
    );
    if (choice == null) return;
    bloc.add(ShuttleVehicleChosen(choice));
    if (start) bloc.add(const ShuttleStartRequested());
  }
}

/// « Vito blanc · GH-456-JK · 3 pass. sur 8 » and « Changer », under « Embarquer et partir » (vehicle of the day).
class _VehicleLine extends StatelessWidget {
  const _VehicleLine({required this.state, required this.onChange});
  final ShuttleState state;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    final v = state.chosenVehicle;
    final choice = state.vehicle;
    final name = [v?.model ?? choice?.model, v?.colour ?? choice?.colour].whereType<String>().where((p) => p.trim().isNotEmpty).join(' ');
    final plate = v?.plate ?? choice?.plate;
    final seats = v?.seats;
    final pax = state.selectedPassengers;
    final text = [
      if (name.isNotEmpty) name,
      if (plate != null && plate.trim().isNotEmpty) formatPlate(plate),
      // Nothing ticked yet: the seats alone.
      if (pax == 0 && seats != null)
        'shuttle.vehicle_seats'.tr(args: ['$seats'])
      else if (seats != null)
        'shuttle.pax_of_seats'.tr(args: ['$pax', '$seats'])
      else if (pax > 0)
        'shuttle.pax'.tr(args: ['$pax']),
    ].join(' · ');
    final over = seats != null && pax > seats;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Flexible(
          child: Text(
            text,
            key: const Key('vehicle-line'),
            textAlign: TextAlign.center,
            style: AppText.body(size: 12.5, color: over ? AppColors.danger : AppColors.muted),
          ),
        ),
        TextButton(
          key: const Key('vehicle-change'),
          onPressed: state.actionState.isProcessing ? null : onChange,
          child: Text('shuttle.vehicle_change'.tr(), style: AppText.strong(size: 13, color: AppColors.accentDeep)),
        ),
      ],
    );
  }
}

/// B: « Aller · 5 », « Retour · 4 », « En route · 2 » (the running trip's bookings). While a trip runs, the other side
/// waits for its end.
class _TabBar extends StatelessWidget {
  const _TabBar({required this.state, required this.onChanged});
  final ShuttleState state;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    String label(String key, int? count) => count == null ? key.tr() : '${key.tr()} · $count';
    final labels = [label('shuttle.tab_go', state.goCount), label('shuttle.tab_back', state.backCount), label('shuttle.band_route', state.bandCount2)];
    final current = state.tab;
    // A trip runs: its side and « En route » only.
    final runningSide = state.running ? (state.trip!.dropoff ? 0 : 1) : null;
    bool locked(int i) => runningSide != null && i < 2 && i != runningSide;
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: Row(
        children: [
          for (var i = 0; i < 3; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: Semantics(
                selected: current == i,
                button: true,
                child: Material(
                  color: current == i ? AppColors.action : AppColors.canvas,
                  borderRadius: AppRadius.pill,
                  child: InkWell(
                    key: Key('band-$i'),
                    borderRadius: AppRadius.pill,
                    onTap: locked(i) ? null : () => onChanged(i),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 44),
                      child: Center(
                        child: Text(
                          labels[i],
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.body(
                            size: 13,
                            weight: current == i ? 700 : 600,
                            color: current == i ? AppColors.onAccent : (locked(i) ? AppColors.line : AppColors.muted),
                          ),
                        ),
                      ),
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

/// « 14:30 · départ conseillé » and « Tout cocher » / « Tout décocher » for the slot.
class _SlotHeader extends StatelessWidget {
  const _SlotHeader({super.key, required this.leaveAt, required this.allSelected, required this.enabled, required this.onToggle});
  final DateTime? leaveAt;
  final bool allSelected;
  final bool enabled;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Semantics(
            header: true,
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: leaveAt == null ? 'shuttle.slot_no_time'.tr() : hhmm(leaveAt!),
                    style: AppText.tabular(size: 18, color: AppColors.accent),
                  ),
                  if (leaveAt != null) TextSpan(text: '  ${'shuttle.slot_leave'.tr()}', style: AppText.muted(size: 12.5)),
                ],
              ),
            ),
          ),
        ),
        if (enabled)
          TextButton(
            onPressed: onToggle,
            style: TextButton.styleFrom(minimumSize: const Size(48, 44), foregroundColor: AppColors.accentDeep),
            child: Text((allSelected ? 'shuttle.slot_none' : 'shuttle.slot_all').tr(), style: AppText.strong(size: 13, color: AppColors.accentDeep)),
          ),
      ],
    );
  }
}

/// Under the list: who is not checked in yet, « Partir vers Gare TGV · 6 pers. » and the vehicle of the day; while a
/// trip runs, the way to it.
class _StartBar extends StatelessWidget {
  const _StartBar({required this.state, required this.onVehicle});
  final ShuttleState state;
  final VoidCallback onVehicle;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<ShuttleBloc>();
    final unchecked = state.selectedNotCheckedIn;
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: state.running
            ? [
                OutlineAction(
                  key: const Key('go-route'),
                  icon: Icons.directions_bus_rounded,
                  label: 'shuttle.see_trip'.tr(),
                  onPressed: () => bloc.add(const ShuttleBandChanged(1)),
                ),
              ]
            : [
                // 14/10/2026: the expected ones board too; the server checks them in when the trip starts.
                if (unchecked.isNotEmpty) ...[
                  Text(
                    unchecked.length == 1
                        ? 'shuttle.not_checked_in_one'.tr(args: [unchecked.single.customerName])
                        : 'shuttle.not_checked_in_many'.tr(args: ['${unchecked.length}']),
                    key: const Key('not-checked-in'),
                    textAlign: TextAlign.center,
                    style: AppText.muted(size: 12.5),
                  ),
                  const SizedBox(height: 6),
                ],
                GradientButton(
                  key: const Key('start-trip'),
                  icon: Icons.directions_bus_rounded,
                  label: startLabel(state),
                  busy: state.actionState.isProcessing,
                  // With the vehicle of the day, one tap (14/10/2026); « Changer » below takes another.
                  onPressed: state.selected.isEmpty ? null : () => state.oneTapStart ? bloc.add(const ShuttleStartRequested()) : onVehicle(),
                ),
                if (state.oneTapStart) _VehicleLine(state: state, onChange: onVehicle),
              ],
      ),
    );
  }
}

/// « Partir vers Gare TGV · 6 pers. », « Aller chercher 3 pers. · Aéroport », « … · 2 destinations ».
@visibleForTesting
String startLabel(ShuttleState state) {
  if (state.selected.isEmpty) return (state.dropoff ? 'shuttle.start_none_go' : 'shuttle.start_none_back').tr();
  final people = '${state.selectedPassengers}';
  final destinations = state.selectedDestinations.length;
  if (destinations > 1) return (state.dropoff ? 'shuttle.start_go_many' : 'shuttle.start_back_many').tr(args: [people, '$destinations']);
  final where = state.selectedStopName ?? 'shuttle.the_airport'.tr();
  return (state.dropoff ? 'shuttle.start_go' : 'shuttle.start_back').tr(args: [where, people]);
}

/// "Trajet en cours · ma position est partagée", then « Parti à 09:47 · Vito blanc GH-456-JK » (peach border, as the
/// approved frame).
class _RunningCard extends StatelessWidget {
  const _RunningCard({required this.state});
  final ShuttleState state;

  @override
  Widget build(BuildContext context) {
    final trip = state.trip!;
    final v = trip.vehicle;
    final vehicle = [v.model, v.colour, if (v.plate != null) formatPlate(v.plate!)].whereType<String>().join(' ');
    // « Parti à 09:47 · Vito blanc GH-456-JK » (14/10/2026).
    final left = [
      'shuttle.running_left_at'.tr(args: [hhmm(trip.startedAt)]),
      if (vehicle.isNotEmpty) vehicle,
    ].join(' · ');
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
                  // 22/10/2026: the real place (« En route vers Gare TGV »), not « le terminal ».
                  (trip.sharePosition ? 'shuttle.running_to' : 'shuttle.running_to_no_share').tr(
                    args: [trip.stop == null || trip.stop!.builtIn ? 'shuttle.the_airport'.tr() : trip.stop!.name],
                  ),
                  style: AppText.strong(size: 15, color: AppColors.peach),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(left, key: const Key('trip-left'), style: AppText.muted()),
          Text(
            '${(trip.dropoff ? 'shuttle.running_people_go' : 'shuttle.running_people_back').tr(args: ['${trip.passengers.fold<int>(0, (n, p) => n + p.passengers)}'])} · ${'shuttle.running_left'.tr(args: [durationLabel(state.remaining)])}',
            style: AppText.muted(),
          ),
        ],
      ),
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
        const Padding(
          padding: EdgeInsets.only(top: 2),
          child: Icon(Icons.place_rounded, size: 16, color: AppColors.accent),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label != null && label.isNotEmpty ? 'shuttle.meeting_point'.tr(args: [label]) : 'shuttle.meeting_point_none'.tr(),
                style: AppText.body(size: 13.5, weight: 600),
              ),
              if (instructions != null && instructions.isNotEmpty)
                Text(instructions, maxLines: 3, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 12.5)),
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
      // 22/10/2026: where this traveller waits (their booking's stop, the airport by default).
      'shuttle.at_dest'.tr(args: [row.stopName ?? 'shuttle.the_airport'.tr()]),
      if (f.gate != null) 'shuttle.gate'.tr(args: [f.gate!]),
      if (f.number != null)
        f.landed
            ? '${'shuttle.flight'.tr(args: [f.number!])} ${'shuttle.badge_landed'.tr(args: [hhmm(f.landedAt ?? f.expectedAt!)]).toLowerCase()}'
            : 'shuttle.flight'.tr(args: [f.number!]),
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
                    Icon(
                      selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      size: 20,
                      color: selected ? AppColors.accent : AppColors.line,
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text('${row.customerName} · ${'shuttle.pax'.tr(args: ['${row.passengers}'])}', style: AppText.strong(size: 14.5)),
                  ),
                  const SizedBox(width: 8),
                  // Never wider than half the card: a long badge scales down instead of overflowing.
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 180),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: _Badge(row: row, onTrip: onTrip),
                    ),
                  ),
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

/// A traveller waiting at the parking for the terminal, or expected (drop-off side): both board (14/10/2026).
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
      // 22/10/2026: where this traveller goes (their booking's stop, the airport by default).
      'shuttle.to_dest'.tr(args: [row.stopName ?? 'shuttle.the_airport'.tr()]),
      if (row.spot != null) 'shuttle.spot'.tr(args: [row.spot!]),
    ].join(' · ');
    final expected = row.expected || row.status == 'upcoming';
    return Material(
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
                    Icon(
                      selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      size: 20,
                      color: selected ? AppColors.accent : AppColors.line,
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text('${row.customerName} · ${'shuttle.pax'.tr(args: ['${row.passengers}'])}', style: AppText.strong(size: 14.5)),
                  ),
                  const SizedBox(width: 8),
                  if (onTrip || row.tripId != null)
                    StatusBadge(text: 'shuttle.badge_on_trip'.tr(), tone: BadgeTone.tint)
                  // 14/10/2026: an expected traveller boards like the others (checked in when the trip starts).
                  else if (expected)
                    StatusBadge(
                      key: Key('expected-${row.reservationId}'),
                      text: 'shuttle.expected_at'.tr(args: [hhmm(row.arrivalAt)]),
                      tone: BadgeTone.warn,
                    )
                  else
                    StatusBadge(key: Key('on-site-${row.reservationId}'), text: 'shuttle.badge_on_site'.tr()),
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
    if (row.atMeetingPoint) {
      return StatusBadge(
        text: 'shuttle.badge_at_point'.tr(args: [hhmm(row.atMeetingPointAt!)]),
        tone: BadgeTone.ok,
      );
    }
    final f = row.flight;
    if (f.landed) {
      return StatusBadge(
        text: 'shuttle.badge_landed_coming'.tr(args: [hhmm(f.landedAt ?? f.expectedAt ?? row.returnAt)]),
        tone: BadgeTone.peach,
      );
    }
    if (f.cancelled) return StatusBadge(text: 'shuttle.badge_cancelled'.tr(), tone: BadgeTone.danger);
    if (f.number == null) {
      return StatusBadge(
        text: 'shuttle.badge_return_at'.tr(args: [hhmm(row.returnAt)]),
        tone: BadgeTone.muted,
      );
    }
    final at = hhmm(f.expectedAt ?? row.returnAt);
    if (f.status == 'delayed') {
      return StatusBadge(
        text: 'shuttle.badge_delayed'.tr(args: [at]),
        tone: BadgeTone.peach,
      );
    }
    return StatusBadge(
      text: 'shuttle.badge_planned'.tr(args: [at]),
      tone: BadgeTone.muted,
    );
  }
}

/// « Embarquer » / « Récupérer » / « Déposer » (14/10/2026): the traveller goes to the list of the Navette tab of the
/// driver's shell, on its first band; from a screen above the shell (a booking's sheet), that screen closes first, so
/// the trip starts where it keeps running (position, « Terminer ce trajet »). Without that tab (another post), the Navette
/// screen opens above with them.
void openShuttleTab(BuildContext context, ShuttleBoardingRequests requests, ShuttleBoarding boarding) {
  final scoped = TabsRouterScope.of(context)?.controller;
  final tabs = scoped ?? context.router.root.innerRouterOf<TabsRouter>(ProShellRoute.name);
  final index = tabs?.stack.indexWhere((p) => p.routeData.name == ProShuttleRoute.name) ?? -1;
  if (tabs == null || index < 0) {
    context.router.push(ProShuttleRoute(direction: boarding.direction, reservationId: boarding.reservationId, boarding: boarding));
    return;
  }
  requests.request(boarding);
  if (scoped == null) context.router.root.popUntilRouteWithName(ProShellRoute.name);
  tabs.setActiveIndex(index);
}

/// The sheet picking the vehicle before the trip starts (`confirmLabel`: « Changer » with nothing ticked yet).
Future<TripVehicleChoice?> showVehicleSheet(
  BuildContext context, {
  required List<ShuttleVehicleModel> vehicles,
  TripVehicleChoice? current,
  int passengers = 0,
  String? confirmLabel,
}) => showModalBottomSheet<TripVehicleChoice>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: AppColors.surface,
  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
  builder: (_) => VehicleSheet(vehicles: vehicles, current: current, passengers: passengers, confirmLabel: confirmLabel),
);

/// « Sarah Cohen et Paul Dupont », « A, B et C »: the names as the web lists them.
String _frenchList(List<String> names) => names.length < 2 ? names.join() : '${names.sublist(0, names.length - 1).join(', ')} et ${names.last}';
