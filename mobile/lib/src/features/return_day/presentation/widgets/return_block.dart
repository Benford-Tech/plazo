import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/helpers/plate.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../../arrival/presentation/bloc/arrival_bloc.dart';
import '../../data/models/return_model.dart';
import '../bloc/return_bloc.dart';

/// "Votre retour aujourd'hui" (approved design R1, and R3 inline while the shuttle is on its way):
/// the timeline of the return, "Itinéraire vers le point de rendez-vous" and "Je suis au point de
/// rendez-vous" (the arrival signal, through [ArrivalBloc]).
class ReturnBlock extends StatelessWidget {
  const ReturnBlock({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<ArrivalBloc, ArrivalState>(
      // "Je suis au point de rendez-vous" went through: the timeline moves on.
      listenWhen: (a, b) => a.signal?.state != b.signal?.state && b.signal?.state == ArrivalSignalState.atMeetingPoint,
      listener: (context, _) => context.read<ReturnBloc>().add(const ReturnRefreshRequested()),
      child: BlocBuilder<ReturnBloc, ReturnState>(
        builder: (context, state) {
          final data = state.data;
          if (data == null) {
            if (state.loadState.isError) return _Notice(text: translateErrorCode(state.errorCode), error: true);
            return const SizedBox.shrink();
          }
          if (!data.returnDay) return const SizedBox.shrink();
          final shuttle = data.shuttle;
          final children = <Widget>[
            if (shuttle != null) _ShuttleLive(data: data, shuttle: shuttle, now: state.now) else _Timeline(state: state),
            if (shuttle == null && state.shuttleEndedAt != null) _Notice(text: 'return_day.shuttle_ended'.tr()),
            if (shuttle == null) ..._actions(context, state),
            if (state.errorCode != null && state.actionState.isError) _Notice(text: translateErrorCode(state.errorCode), error: true),
          ];
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: _spaced(children));
        },
      ),
    );
  }

  List<Widget> _actions(BuildContext context, ReturnState state) {
    final data = state.data!;
    final arrival = context.watch<ArrivalBloc>().state;
    final needsLanded = !data.flight.landed && !data.flight.cancelled && !data.atMeetingPoint;
    return [
      if (needsLanded && (data.flight.number == null || !data.flightTracked || data.flight.status == null || data.flight.status == 'unknown'))
        OutlineAction(
          key: const Key('landed-button'),
          icon: Icons.flight_land_rounded,
          label: 'return_day.landed_button'.tr(),
          onPressed: state.actionState.isProcessing ? null : () => context.read<ReturnBloc>().add(const ReturnLandedDeclared()),
        ),
      GradientButton(
        key: const Key('directions-button'),
        icon: Icons.explore_rounded,
        label: 'return_day.directions'.tr(),
        onPressed: () => context.router.push(MeetingPointRouteRoute(reference: data.reference)),
      ),
      if (!data.atMeetingPoint) ...[
        OutlineAction(
          key: const Key('at-point-button'),
          icon: Icons.place_rounded,
          label: 'return_day.at_point'.tr(),
          onPressed: arrival.actionState.isProcessing || arrival.openKind != ArrivalKind.returnTrip
              ? null
              : () => context.read<ArrivalBloc>().add(const ArrivalAtMeetingPointRequested()),
        ),
        Text('return_day.at_point_help'.tr(), style: AppText.muted()),
      ] else
        Text('return_day.at_point_done'.tr(args: [hhmm(data.atMeetingPointAt!)]), key: const Key('at-point-done'), style: AppText.muted()),
    ];
  }
}

List<Widget> _spaced(List<Widget> children) => [
  for (var i = 0; i < children.length; i++) ...[if (i > 0) const SizedBox(height: 12), children[i]],
];

String meetingLabel(MeetingPointModel? point) {
  final label = point?.label;
  return label != null && label.isNotEmpty ? label : 'return_day.meeting_default'.tr();
}

/// The flight line of the timeline: what we know, from the API or the traveller.
String flightLine(FlightViewModel f, String returnAt) {
  final number = f.number;
  final at = f.expectedAt;
  if (f.landed) {
    final when = hhmm(f.landedAt ?? at ?? DateTime.now());
    return number == null ? 'return_day.flight_landed_no_number'.tr(args: [when]) : 'return_day.flight_landed'.tr(args: [number, when]);
  }
  if (number == null) return 'return_day.no_flight'.tr(args: [localTime(returnAt)]);
  if (f.cancelled) return 'return_day.flight_cancelled'.tr(args: [number]);
  final when = at == null ? localTime(returnAt) : hhmm(at);
  return switch (f.status) {
    'delayed' => 'return_day.flight_delayed'.tr(args: [number, when]),
    'departed' => 'return_day.flight_departed'.tr(args: [number, when]),
    'scheduled' => 'return_day.flight_planned'.tr(args: [number, when]),
    _ => at == null ? 'return_day.flight_unknown'.tr(args: [number]) : 'return_day.flight_planned'.tr(args: [number, when]),
  };
}

/// Walking time at the airport: the parking's figure is for the shuttle; the walk is short.
const _defaultWalkMinutes = 6;

class _Timeline extends StatelessWidget {
  const _Timeline({required this.state});
  final ReturnState state;

  @override
  Widget build(BuildContext context) {
    final d = state.data!;
    final step = state.step;
    final f = d.flight;
    final meeting = meetingLabel(d.meetingPoint);
    // The gate from the flight data, unless the operator's label already names it.
    final gateText = f.gate != null ? 'shuttle.gate'.tr(args: [f.gate!]) : null;
    final gate = gateText != null && !meeting.toLowerCase().contains(gateText.toLowerCase()) ? ' · $gateText' : '';
    final flightSub = f.cancelled
        ? 'return_day.flight_cancelled_help'.tr()
        : f.landed
        ? (f.landedSource == 'traveller' ? 'return_day.flight_declared'.tr() : 'return_day.flight_tracked'.tr())
        : f.number == null
        ? 'return_day.no_flight_help'.tr()
        : d.flightTracked
        ? 'return_day.flight_tracked'.tr()
        : 'return_day.no_flight_help'.tr();
    return Column(
      key: const Key('return-timeline'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Step(
          title: flightLine(f, d.returnAt),
          subtitle: flightSub,
          dot: f.landed ? _Dot.done : (step == ReturnStep.flight ? _Dot.now : _Dot.todo),
          bold: f.landed || step == ReturnStep.flight,
        ),
        const _Link(),
        _Step(
          title: 'return_day.step_meeting'.tr(),
          subtitle: 'return_day.step_meeting_detail'.tr(args: ['$meeting$gate', '$_defaultWalkMinutes']),
          dot: d.atMeetingPoint ? _Dot.done : (step == ReturnStep.meetingPoint ? _Dot.now : _Dot.todo),
          bold: step == ReturnStep.meetingPoint,
        ),
        const _Link(),
        _Step(
          title: 'return_day.step_shuttle'.tr(),
          subtitle: d.atMeetingPoint ? 'return_day.step_shuttle_waiting'.tr() : 'return_day.step_shuttle_help'.tr(),
          dot: step == ReturnStep.shuttle ? _Dot.now : _Dot.todo,
          bold: step == ReturnStep.shuttle,
        ),
        const _Link(),
        _Step(title: 'return_day.step_car'.tr(), subtitle: 'return_day.step_car_help'.tr(args: [formatPlate(d.plate)]), dot: _Dot.todo, bold: false),
      ],
    );
  }
}

enum _Dot { done, now, todo }

class _Step extends StatelessWidget {
  const _Step({required this.title, required this.subtitle, required this.dot, required this.bold});
  final String title;
  final String subtitle;
  final _Dot dot;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: switch (dot) {
            _Dot.now => const LiveDot(color: AppColors.peach, size: 10),
            _Dot.done => Container(width: 20, height: 20, alignment: Alignment.center, child: Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.violet))),
            _Dot.todo => Container(width: 20, height: 20, alignment: Alignment.center, child: Container(width: 10, height: 10, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.line))),
          },
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: bold ? AppText.strong(size: 14.5) : AppText.body(size: 14.5)),
              Text(subtitle, style: AppText.muted(size: 12.5)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Link extends StatelessWidget {
  const _Link();
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(left: 9),
    height: 14,
    decoration: const BoxDecoration(border: Border(left: BorderSide(color: AppColors.line, width: 2))),
  );
}

/// R3: the shuttle on its way (map, ETA, vehicle, driver, instructions, "Appeler le parking").
class _ShuttleLive extends StatelessWidget {
  const _ShuttleLive({required this.data, required this.shuttle, required this.now});
  final TravellerReturnModel data;
  final TravellerShuttleModel shuttle;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final meeting = shuttle.meetingPoint ?? data.meetingPoint;
    final position = shuttle.position;
    final eta = shuttle.etaMinutes;
    final vehicle = shuttle.vehicle;
    final vehicleTitle = vehicle.colour != null ? 'return_day.shuttle_vehicle'.tr(args: [vehicle.colour!]) : 'return_day.shuttle_vehicle_default'.tr();
    final instructions = data.meetingPoint?.instructions;
    return Column(
      key: const Key('shuttle-live'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: _spaced([
        Row(
          children: [
            const LiveDot(color: AppColors.peach),
            const SizedBox(width: 6),
            Flexible(child: Text('return_day.shuttle_live'.tr(), style: AppText.strong(size: 16, color: AppColors.peach))),
          ],
        ),
        if (meeting != null)
          IgnMap(
            meeting: LatLng(meeting.lat, meeting.lng),
            meetingLabel: 'return_day.shuttle_you'.tr(args: [meetingLabel(meeting)]),
            me: position == null ? null : LatLng(position.lat, position.lng),
            meLabel: eta == null ? null : 'return_day.shuttle_eta'.tr(args: ['$eta']),
            dashedLine: true,
            accent: AppColors.peach,
          ),
        AppCard(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(eta == null ? 'return_day.shuttle_eta_unknown'.tr() : 'return_day.shuttle_eta'.tr(args: ['$eta']), key: const Key('shuttle-eta'), style: AppText.big()),
                    Text(
                      shuttle.etaAt != null ? 'return_day.shuttle_arrival_around'.tr(args: [hhmm(shuttle.etaAt!)]) : 'return_day.shuttle_waiting_position'.tr(),
                      style: AppText.muted(),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(vehicleTitle, style: AppText.strong(size: 14)),
                  if (vehicle.model != null || vehicle.plate != null)
                    Text.rich(
                      TextSpan(
                        style: AppText.muted(size: 12.5),
                        children: [
                          if (vehicle.model != null) TextSpan(text: vehicle.model),
                          if (vehicle.model != null && vehicle.plate != null) const TextSpan(text: ' · '),
                          if (vehicle.plate != null) TextSpan(text: formatPlate(vehicle.plate!), style: AppText.muted(size: 12.5).copyWith(fontWeight: FontWeight.w700, color: AppColors.ink)),
                        ],
                      ),
                    ),
                  if (shuttle.driverFirstName.isNotEmpty) Text('return_day.shuttle_driver'.tr(args: [shuttle.driverFirstName]), style: AppText.muted(size: 12.5)),
                ],
              ),
            ],
          ),
        ),
        // "Appeler le parking" follows on the booking page itself (with the number).
        AppCard(child: Text(instructions != null && instructions.isNotEmpty ? instructions : 'return_day.shuttle_default_tip'.tr(), style: AppText.muted())),
      ]),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text, this.error = false});
  final String text;
  final bool error;

  @override
  Widget build(BuildContext context) => AppCard(
    color: error ? const Color(0xFFFDF1F0) : AppColors.canvas,
    borderColor: error ? const Color(0xFFF2C9C5) : AppColors.line,
    child: Text(text, style: AppText.body(size: 14, color: error ? AppColors.danger : AppColors.ink)),
  );
}
