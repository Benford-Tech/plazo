import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/helpers/plate.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../../shared/widgets/live_dot.dart';
import '../../../../shared/widgets/live_pill.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../data/models/return_model.dart';
import '../bloc/stay_shuttles_bloc.dart';

/// "Navette" block of a booking (S-A, 04/10/2026), from the arrival day to the return day: the
/// parking's shuttles on the road (vehicle, driver's first name, where they go, how far from the
/// parking or from the meeting point), the traveller's own flagged; "Aucune navette en route"
/// otherwise. Hidden outside those days.
class StayShuttlesBlock extends StatelessWidget {
  const StayShuttlesBlock({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StayShuttlesBloc, StayShuttlesState>(
      builder: (context, state) {
        final data = state.data;
        if (data == null || !data.visible) return const SizedBox.shrink();
        final shuttles = data.shuttles;
        final highlighted = data.mine ?? shuttles.firstOrNull;
        final destination = highlighted?.destination;
        return Column(
          key: const Key('stay-shuttles'),
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (shuttles.isNotEmpty) ...[const LiveDot(color: AppColors.peach), const SizedBox(width: 6)],
                Expanded(
                  child: Semantics(
                    header: true,
                    child: Text(
                      shuttles.isEmpty ? 'stay_shuttles.title'.tr() : 'stay_shuttles.title_live'.tr(args: ['${shuttles.length}']),
                      style: AppText.strong(size: 16, color: shuttles.isEmpty ? AppColors.ink : AppColors.peach),
                    ),
                  ),
                ),
                if (shuttles.isNotEmpty) LivePill(at: state.now, color: AppColors.peach),
              ],
            ),
            const SizedBox(height: 8),
            if (shuttles.isEmpty)
              AppCard(
                color: AppColors.canvas,
                child: Text('stay_shuttles.none.${data.phase}'.tr(), key: const Key('stay-shuttles-none'), style: AppText.body(size: 14)),
              )
            else ...[
              if (destination != null && highlighted?.position != null) ...[
                IgnMap(
                  meeting: LatLng(destination.lat, destination.lng),
                  meetingLabel: destination.kind == 'parking' ? 'stay_shuttles.dest_parking'.tr() : (destination.label ?? 'stay_shuttles.dest_meeting'.tr()),
                  me: LatLng(highlighted!.position!.lat, highlighted.position!.lng),
                  meLabel: highlighted.etaMinutes == null ? null : 'return_day.shuttle_eta'.tr(args: ['${highlighted.etaMinutes}']),
                  dashedLine: true,
                  accent: AppColors.peach,
                  height: 200,
                ),
                const SizedBox(height: 8),
              ],
              for (final s in shuttles) ...[_ShuttleCard(shuttle: s, phase: data.phase!), const SizedBox(height: 8)],
            ],
          ],
        );
      },
    );
  }
}

class _ShuttleCard extends StatelessWidget {
  const _ShuttleCard({required this.shuttle, required this.phase});
  final TravellerShuttleModel shuttle;
  final String phase;

  @override
  Widget build(BuildContext context) {
    final s = shuttle;
    final v = s.vehicle;
    final title = v.colour != null ? 'return_day.shuttle_vehicle'.tr(args: [v.colour!]) : 'return_day.shuttle_vehicle_default'.tr();
    final eta = s.etaMinutes;
    final where = s.destination?.kind == 'meeting_point' ? 'stay_shuttles.eta_meeting' : 'stay_shuttles.eta_parking';
    return AppCard(
      key: Key('stay-shuttle-${s.tripId}'),
      borderColor: s.mine ? AppColors.peach : null,
      borderWidth: s.mine ? 2 : 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: AppText.strong(size: 15))),
              if (s.mine)
                StatusBadge(text: 'stay_shuttles.mine'.tr(), tone: BadgeTone.peach)
              else
                StatusBadge(text: 'stay_shuttles.direction.${s.direction}'.tr(), tone: BadgeTone.tint),
            ],
          ),
          if (v.model != null || v.plate != null)
            Text.rich(
              TextSpan(
                style: AppText.muted(size: 12.5),
                children: [
                  if (v.model != null) TextSpan(text: v.model),
                  if (v.model != null && v.plate != null) const TextSpan(text: ' · '),
                  if (v.plate != null)
                    TextSpan(
                      text: formatPlate(v.plate!),
                      style: AppText.muted(size: 12.5).copyWith(fontWeight: FontWeight.w700, color: AppColors.ink),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 6),
          Text(
            [
              'return_day.shuttle_driver'.tr(args: [s.driverFirstName]),
              if (s.mine) 'stay_shuttles.direction.${s.direction}'.tr(),
              eta != null ? where.tr(args: ['$eta']) : 'stay_shuttles.no_position'.tr(),
            ].join(' · '),
            key: Key('stay-shuttle-eta-${s.tripId}'),
            style: AppText.body(size: 13.5),
          ),
        ],
      ),
    );
  }
}
