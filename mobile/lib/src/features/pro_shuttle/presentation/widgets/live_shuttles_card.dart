import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../data/models/shuttle_models.dart';
import '../bloc/live_shuttles_bloc.dart';
import '../../../../shared/widgets/shuttle_icon.dart';
import 'live_shuttles_map.dart';

/// "Navettes en cours · N" (P-A): the map and one row per running shuttle (vehicle, driver, where it
/// goes, passengers, distance), for the Navette screen. "Aucune navette en route" otherwise.
class LiveShuttlesCard extends StatelessWidget {
  const LiveShuttlesCard({super.key});

  @override
  Widget build(BuildContext context) {
    final me = context.read<ProAuthBloc?>()?.state.staff?.id;
    return BlocBuilder<LiveShuttlesBloc, LiveShuttlesState>(
      builder: (context, state) {
        final data = state.data;
        if (data == null) return const SizedBox.shrink();
        final trips = data.trips;
        return Column(
          key: const Key('live-shuttles'),
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (trips.isNotEmpty) ...[const LiveDot(color: AppColors.peach), const SizedBox(width: 6)],
                Expanded(
                  child: Semantics(
                    header: true,
                    child: Text(
                      trips.isEmpty ? 'live_shuttles.title'.tr() : 'live_shuttles.title_live'.tr(args: ['${trips.length}']),
                      style: AppText.strong(size: 16, color: trips.isEmpty ? AppColors.ink : AppColors.peach),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (trips.isEmpty)
              AppCard(color: AppColors.canvas, child: Text('live_shuttles.none'.tr(), key: const Key('live-shuttles-none'), style: AppText.body(size: 14)))
            else ...[
              if (trips.any((t) => t.position != null)) ...[LiveShuttlesMap(data: data, myStaffId: me, headings: state.headings), const SizedBox(height: 8)],
              for (final t in trips) ...[LiveTripRow(trip: t, mine: t.driverId == me), const SizedBox(height: 6)],
            ],
          ],
        );
      },
    );
  }
}

/// One running shuttle: "Vito blanc · Karim → Aéroport · 3 clients · à 2,1 km".
class LiveTripRow extends StatelessWidget {
  const LiveTripRow({super.key, required this.trip, required this.mine});
  final LiveTripModel trip;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final t = trip;
    final who = [t.vehicleTitle ?? 'live_shuttles.vehicle_default'.tr(), t.driverName.split(' ').first].join(' · ');
    final where = t.stop == null ? (t.dropoff ? 'live_shuttles.to_terminal'.tr() : 'live_shuttles.to_airport'.tr()) : (t.stop!.builtIn ? 'live_shuttles.to_airport'.tr() : t.stop!.name);
    final distance = t.toStop != null
        ? 'live_shuttles.to_stop_distance'.tr(args: [distanceLabel(t.toStop!.distanceM)])
        : (t.position == null ? 'live_shuttles.no_position'.tr() : null);
    return AppCard(
      key: Key('live-trip-${t.id}'),
      padding: const EdgeInsets.fromLTRB(12, 9, 12, 9),
      borderColor: mine ? AppColors.accent : null,
      borderWidth: mine ? 2 : 1,
      child: Row(
        children: [
          ShuttleIcon(tone: shuttleToneOf(t.direction, hasPosition: t.position != null), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$who → $where', style: AppText.strong(size: 14)),
                Text(
                  [
                    'live_shuttles.passengers'.tr(args: ['${t.passengers}']),
                    ?distance,
                    'live_shuttles.since'.tr(args: [hhmm(t.startedAt)]),
                  ].join(' · '),
                  style: AppText.muted(size: 12.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The compact form for "Aujourd'hui" (P-A): one line per running shuttle, nothing when none.
class LiveShuttlesStrip extends StatelessWidget {
  const LiveShuttlesStrip({super.key, required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final me = context.read<ProAuthBloc?>()?.state.staff?.id;
    return BlocBuilder<LiveShuttlesBloc, LiveShuttlesState>(
      builder: (context, state) {
        final trips = state.trips;
        if (trips.isEmpty) return const SizedBox.shrink();
        return Material(
          key: const Key('live-shuttles-strip'),
          color: AppColors.tint,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const LiveDot(color: AppColors.peach),
                      const SizedBox(width: 6),
                      Expanded(child: Text('live_shuttles.title_live'.tr(args: ['${trips.length}']), style: AppText.label(size: 11.5, color: AppColors.peach))),
                      const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.muted),
                    ],
                  ),
                  for (final t in trips)
                    Text(
                      '${t.vehicleTitle ?? 'live_shuttles.vehicle_default'.tr()} · ${t.driverName.split(' ').first} → '
                      '${t.stop == null || t.stop!.builtIn ? (t.dropoff ? 'live_shuttles.to_terminal'.tr() : 'live_shuttles.to_airport'.tr()) : t.stop!.name}'
                      ' · ${'live_shuttles.passengers'.tr(args: ['${t.passengers}'])}'
                      '${t.toStop != null ? ' · ${distanceLabel(t.toStop!.distanceM)}' : ''}',
                      key: Key('live-strip-${t.id}'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.body(size: 13, weight: t.driverId == me ? 700 : 500),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
