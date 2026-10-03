import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/formatters.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../data/models/return_model.dart';
import '../bloc/meeting_route_bloc.dart';
import '../widgets/return_block.dart';

/// R2: the walking route to the meeting point on the IGN map, its duration and distance, the
/// terminal badge, the operator's written directions and photo, "Ouvrir dans Plans" and
/// "Je suis arrivé au point de rendez-vous".
@RoutePage()
class MeetingPointRoutePage extends StatelessWidget implements AutoRouteWrapper {
  const MeetingPointRoutePage({super.key, @PathParam('reference') required this.reference});

  final String reference;

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<MeetingRouteBloc>()..add(MeetingRouteOpened(reference)), child: this);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MeetingRouteBloc, MeetingRouteState>(
      listenWhen: (a, b) => !a.arrived && b.arrived,
      listener: (context, state) {
        ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(content: Text('return_day.route_arrived_done'.tr())));
        // Back to the booking, which refreshes its timeline.
        context.router.maybePop(true);
      },
      builder: (context, state) {
        final route = state.route;
        final data = state.data;
        final meeting = route?.meetingPoint ?? data?.meetingPoint;
        final links = locator<LinkService>();
        return Scaffold(
          appBar: AppBar(
            titleSpacing: NavigationToolbar.kMiddleSpacing,
            title: Text('return_day.route_title'.tr(), style: AppText.strong(size: 16, color: Colors.white)),
            actions: [
              if (meeting != null)
                TextButton(
                  key: const Key('open-maps'),
                  onPressed: () => links.open(links.walkingDirections(meeting.lat, meeting.lng, meetingLabel(meeting))),
                  child: Text('${'return_day.route_open_maps'.tr()} ›', style: AppText.strong(size: 14, color: Colors.white)),
                ),
            ],
          ),
          body: SafeArea(
            top: false,
            child: state.loadState.isError && route == null
                ? _Error(code: state.errorCode, reference: reference)
                : route == null || meeting == null
                ? Column(
                    children: [
                      const LinearProgressIndicator(color: AppColors.violet, backgroundColor: AppColors.canvas),
                      Padding(padding: const EdgeInsets.all(24), child: Text('return_day.route_loading'.tr(), style: AppText.muted())),
                    ],
                  )
                : ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _RouteMap(route: route, meeting: meeting),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            AppCard(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('return_day.route_minutes'.tr(args: ['${route.durationMinutes}']), key: const Key('route-minutes'), style: AppText.big()),
                                        Text('return_day.route_distance_walk'.tr(args: [distanceLabel(route.distanceM)]), style: AppText.muted()),
                                      ],
                                    ),
                                  ),
                                  _TerminalBadge(data: data, meeting: meeting),
                                ],
                              ),
                            ),
                            if (route.fallback) ...[
                              const SizedBox(height: 10),
                              AppCard(color: AppColors.canvas, child: Text('return_day.route_fallback'.tr(), key: const Key('route-fallback'), style: AppText.muted())),
                            ],
                            if (!state.fromMe) ...[
                              const SizedBox(height: 10),
                              Text('return_day.route_from_terminal'.tr(), key: const Key('route-from-terminal'), style: AppText.muted()),
                            ],
                            if (meeting.instructions != null && meeting.instructions!.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              Text('return_day.route_instructions'.tr(), style: AppText.strong(size: 14)),
                              const SizedBox(height: 6),
                              _Instructions(text: meeting.instructions!),
                            ],
                            if (meeting.photoUrl != null && meeting.photoUrl!.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              AppCard(
                                color: const Color(0xFFFAF6FB),
                                borderColor: const Color(0xFFFAF6FB),
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('return_day.route_photo'.tr(), style: AppText.strong(size: 14)),
                                    const SizedBox(height: 8),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: Image.network(
                                        meeting.photoUrl!,
                                        height: 160,
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) => const SizedBox(height: 40),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            if (state.errorCode != null && state.actionState.isError)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Text(translateErrorCode(state.errorCode), style: AppText.body(size: 14, color: AppColors.danger)),
                              ),
                            if (data?.atMeetingPoint ?? false)
                              AppCard(
                                borderColor: AppColors.peach,
                                borderWidth: 1.6,
                                child: Text('return_day.route_arrived_done'.tr(), style: AppText.body(size: 14.5)),
                              )
                            else
                              GradientButton(
                                key: const Key('route-arrived'),
                                icon: Icons.place_rounded,
                                label: 'return_day.route_arrived'.tr(),
                                busy: state.actionState.isProcessing,
                                onPressed: () => context.read<MeetingRouteBloc>().add(const MeetingRouteArrived()),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ),
        );
      },
    );
  }
}

class _RouteMap extends StatelessWidget {
  const _RouteMap({required this.route, required this.meeting});
  final WalkingRouteModel route;
  final MeetingPointModel meeting;

  @override
  Widget build(BuildContext context) {
    final points = [for (final p in route.geometry) if (p.length >= 2) LatLng(p[0], p[1])];
    return Padding(
      padding: EdgeInsets.zero,
      child: IgnMap(
        height: 300,
        interactive: true,
        meeting: LatLng(meeting.lat, meeting.lng),
        meetingLabel: meetingLabel(meeting),
        me: LatLng(route.from.lat, route.from.lng),
        route: points.length >= 2 ? points : null,
        fitRoute: true,
        dashedLine: true,
      ),
    );
  }
}

class _TerminalBadge extends StatelessWidget {
  const _TerminalBadge({required this.data, required this.meeting});
  final TravellerReturnModel? data;
  final MeetingPointModel meeting;

  @override
  Widget build(BuildContext context) {
    final f = data?.flight;
    final terminal = f?.terminal != null ? 'Terminal ${f!.terminal}' : null;
    final gate = f?.gate != null ? 'shuttle.gate'.tr(args: [f!.gate!]) : null;
    final text = [terminal, gate].whereType<String>().join(' · ');
    if (text.isEmpty) return const SizedBox.shrink();
    return StatusBadge(text: text, tone: BadgeTone.peach);
  }
}

/// "1. … 2. …": one numbered step per line of the operator's text.
class _Instructions extends StatelessWidget {
  const _Instructions({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final lines = text.split(RegExp(r'\n+')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
    if (lines.length <= 1) return Text(text, style: AppText.body(size: 14, height: 1.45));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < lines.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 26, child: Text('${i + 1}.', style: AppText.strong(size: 14, color: AppColors.violet))),
                Expanded(child: Text(lines[i].replaceFirst(RegExp(r'^\d+[.)]\s*'), ''), style: AppText.body(size: 14, height: 1.45))),
              ],
            ),
          ),
      ],
    );
  }
}

class _Error extends StatelessWidget {
  const _Error({required this.code, required this.reference});
  final String? code;
  final String reference;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(translateErrorCode(code), textAlign: TextAlign.center, style: AppText.body()),
        const SizedBox(height: 16),
        GradientButton(label: 'return_day.route_retry'.tr(), onPressed: () => context.read<MeetingRouteBloc>().add(MeetingRouteOpened(reference))),
      ],
    ),
  );
}
