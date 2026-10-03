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
import '../../data/datasources/shuttle_data_source.dart';
import '../../data/models/shuttle_models.dart';
import '../bloc/shuttle_bloc.dart';
import '../widgets/vehicle_sheet.dart';

/// R4, the driver's "Navette" screen: the trip in progress (position shared), the returns to pick
/// up grouped by terminal with their flight status, "Démarrer le trajet (N clients)" and
/// "Clients récupérés · retour parking".
@RoutePage()
class ProShuttlePage extends StatelessWidget implements AutoRouteWrapper {
  const ProShuttlePage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) => BlocProvider(create: (_) => locator<ShuttleBloc>()..add(const ShuttleStarted()), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: '${Product.proName} · ${'shuttle.title'.tr()}'),
      body: BlocBuilder<ShuttleBloc, ShuttleState>(
        builder: (context, state) {
          final bloc = context.read<ShuttleBloc>();
          if (state.pickups == null) {
            return Center(
              child: state.viewState.isError
                  ? Padding(padding: const EdgeInsets.all(24), child: Text(translateErrorCode(state.errorCode), textAlign: TextAlign.center))
                  : const CircularProgressIndicator(color: AppColors.violet),
            );
          }
          final meeting = state.meetingPoint;
          return RefreshIndicator(
            color: AppColors.violet,
            onRefresh: () async => bloc.add(const ShuttlePolled()),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              children: [
                if (state.running) _RunningCard(state: state) else Text('shuttle.intro'.tr(), style: AppText.muted()),
                const SizedBox(height: 6),
                _MeetingPoint(meeting: meeting),
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
                const SizedBox(height: 14),
                if (state.pickups!.rows.isEmpty) Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Text('shuttle.empty'.tr(), style: AppText.muted())),
                for (final group in state.groups) ...[
                  Semantics(
                    header: true,
                    child: Text('shuttle.to_pick_up'.tr(args: [group.terminal ?? 'shuttle.no_terminal'.tr()]), style: AppText.title(size: 20)),
                  ),
                  const SizedBox(height: 8),
                  for (final row in group.rows) ...[
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
                if (state.running)
                  OutlineAction(
                    key: const Key('end-trip'),
                    icon: Icons.check_rounded,
                    label: 'shuttle.end'.tr(),
                    onPressed: state.actionState.isProcessing ? null : () => bloc.add(const ShuttleEndRequested()),
                  )
                else
                  GradientButton(
                    key: const Key('start-trip'),
                    icon: Icons.directions_bus_rounded,
                    label: state.selected.isEmpty
                        ? 'shuttle.start_none'.tr()
                        : state.selected.length == 1
                        ? 'shuttle.start_one'.tr()
                        : 'shuttle.start'.tr(args: ['${state.selected.length}']),
                    busy: state.actionState.isProcessing,
                    onPressed: state.selected.isEmpty ? null : () => _confirmVehicle(context, state),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmVehicle(BuildContext context, ShuttleState state) async {
    final bloc = context.read<ShuttleBloc>();
    final choice = await showVehicleSheet(context, vehicles: state.vehicles, current: state.vehicle);
    if (choice == null) return;
    bloc
      ..add(ShuttleVehicleChosen(choice))
      ..add(const ShuttleStartRequested());
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
              Expanded(child: Text('shuttle.running'.tr(), style: AppText.strong(size: 15, color: AppColors.peach))),
            ],
          ),
          const SizedBox(height: 6),
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
        const Padding(padding: EdgeInsets.only(top: 2), child: Icon(Icons.place_rounded, size: 16, color: AppColors.violet)),
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
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: highlighted ? AppColors.violet : AppColors.line, width: highlighted ? 2 : 1),
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
                    Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: selected ? AppColors.violet : AppColors.line),
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
Future<TripVehicleChoice?> showVehicleSheet(BuildContext context, {required List<ShuttleVehicleModel> vehicles, TripVehicleChoice? current}) =>
    showModalBottomSheet<TripVehicleChoice>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => VehicleSheet(vehicles: vehicles, current: current),
    );
