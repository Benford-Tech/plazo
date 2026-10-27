import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/ign_map.dart';
import '../../../arrival/data/models/arrival_model.dart';
import '../../data/models/planning_model.dart';
import '../../data/models/staff_signal_model.dart';
import '../bloc/pro_today_bloc.dart';

/// A row of the staff's day. A traveller sharing their position gets the highlighted card (peach
/// border, ETA, mini map, age of the position) — the app's version of the approved frame 3.
class TodayRowTile extends StatelessWidget {
  const TodayRowTile({
    super.key,
    required this.row,
    required this.isReturn,
    required this.positionAge,
    this.onTap,
    this.actionLabel,
    this.onAction,
    this.tagged = false,
    this.dimmed = false,
  });

  final TodayRow row;
  final bool isReturn;
  final int? positionAge;
  final VoidCallback? onTap;

  /// Direction A (27/10/2026): in the merged list of the day, the card says its kind, « DÉPÔT » on a pale green
  /// ground or « RETOUR » on a pale indigo one, with a matching edge on the left.
  final bool tagged;

  /// Already done (under « Déjà passés »): faded.
  final bool dimmed;

  /// The driver's « Embarquer » / « Récupérer » (14/10/2026): the traveller goes to the Navette tab's list.
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final b = row.booking;
    final s = row.signal;
    final approaching = row.approaching;
    final time = hhmm(isReturn ? b.returnAt : b.arrivalAt);
    final kind = isReturn ? AppStatus.info : AppStatus.ok;
    final edge = approaching ? AppColors.peach : AppColors.line;
    return Opacity(
      opacity: dimmed ? 0.55 : 1,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.card,
        child: Container(
          key: Key('row-${b.id}'),
          margin: const EdgeInsets.only(bottom: 10),
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: tagged ? (isReturn ? AppStatus.infoSoft : AppStatus.okSoft) : AppColors.surface,
            borderRadius: AppRadius.card,
            border: Border.all(color: edge, width: approaching ? 2.2 : 1),
          ),
          // IntrinsicHeight: the list gives no height, so the edge strip stretches to the card's own.
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // The kind's edge on the left (green drop-off, indigo return).
                if (tagged) Container(width: 4, color: kind),
                Expanded(
                  child: Padding(padding: const EdgeInsets.all(12), child: _body(context, b, s, time, kind)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _body(BuildContext context, PlanningRowModel b, StaffSignalModel? s, String time, Color kind) {
    final approaching = row.approaching;
    return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(time, style: AppText.tabular(size: 17, color: AppColors.accent)),
                if (tagged) ...[
                  const SizedBox(width: 8),
                  Container(
                    key: Key('kind-${b.id}'),
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: kind, borderRadius: AppRadius.small),
                    child: Text(
                      (isReturn ? 'pro.kind_return' : 'pro.kind_dropoff').tr().toUpperCase(),
                      style: AppText.label(size: 10.5, color: AppStatus.okInk).copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
                const SizedBox(width: 12),
                // One line, as on the planning of the pro space: scaled down rather than wrapped.
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: _StatusLabel(signal: s, status: b.status, isReturn: isReturn),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                FrenchPlate(b.plate),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    [
                      b.customerName,
                      'pro.pax'.tr(args: ['${b.passengers}']),
                      if (isReturn && b.returnFlight != null) 'pro.flight'.tr(args: [b.returnFlight!]),
                    ].join(' · '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.body(size: 14.5),
                  ),
                ),
                if (actionLabel != null && onAction != null) ...[
                  const SizedBox(width: 8),
                  FilledButton(
                    key: Key('board-${b.id}'),
                    onPressed: onAction,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.action,
                      foregroundColor: AppColors.onAccent,
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                    ),
                    child: Text(actionLabel!, style: AppText.strong(size: 13, color: AppColors.onAccent)),
                  ),
                ],
              ],
            ),
            if (approaching && s != null) ...[
              if (s.position != null && s.meetingPoint != null) ...[
                const SizedBox(height: 10),
                IgnMap(
                  height: 130,
                  meeting: LatLng(s.meetingPoint!.lat, s.meetingPoint!.lng),
                  meetingLabel: s.meetingPoint!.label ?? (isReturn ? 'arrival.meeting_return'.tr() : 'arrival.meeting_reception'.tr()),
                  me: LatLng(s.position!.lat, s.position!.lng),
                  dashedLine: true,
                  accent: AppColors.peach,
                ),
              ],
              const SizedBox(height: 8),
              Text(
                [
                  if (positionAge != null)
                    positionAge! < 60 ? 'pro.position_updated_s'.tr(args: ['$positionAge']) : 'pro.position_updated_min'.tr(args: ['${positionAge! ~/ 60}']),
                  if (s.distanceM != null) distanceLabel(s.distanceM!),
                  if (s.etaAt != null) 'pro.eta_around'.tr(args: [hhmm(s.etaAt!)]),
                ].join(' · '),
                style: AppText.muted(size: 12.5),
              ),
            ],
          ],
        );
  }
}

class _StatusLabel extends StatelessWidget {
  const _StatusLabel({required this.signal, required this.status, required this.isReturn});
  final StaffSignalModel? signal;
  final String status;
  final bool isReturn;

  @override
  Widget build(BuildContext context) {
    final s = signal;
    if (s == null || s.state == ArrivalSignalState.ended) {
      final key = 'pro.status.$status';
      final text = key.tr();
      return Text(text == key ? status : text, style: AppText.muted(size: 13));
    }
    if (s.state == ArrivalSignalState.announced) {
      return Text('pro.announced'.tr(args: ['${s.announcedMinutes ?? s.etaMinutes ?? 0}']), style: AppText.muted(size: 13));
    }
    final text = switch (s.state) {
      ArrivalSignalState.sharing => s.etaMinutes == null ? 'pro.on_the_way'.tr() : 'pro.approaching'.tr(args: ['${s.etaMinutes}']),
      _ => isReturn ? 'pro.at_meeting_point'.tr() : 'pro.at_reception'.tr(),
    };
    return Text(
      '● ${text.toUpperCase()}',
      textAlign: TextAlign.right,
      style: AppText.label(size: 12.5, color: AppColors.accent).copyWith(fontWeight: FontWeight.w800),
    );
  }
}

/// Top banner when a traveller signals their arrival (the app's toast of frame 3).
class ArrivalBanner extends StatelessWidget {
  const ArrivalBanner({super.key, required this.signal, required this.onSee, required this.onClose});

  final StaffSignalModel signal;
  final VoidCallback onSee;
  final VoidCallback onClose;

  static String text(StaffSignalModel s) {
    final base = _base(s);
    final note = s.note;
    return note == null || note.trim().isEmpty ? base : '$base · « ${note.trim()} »';
  }

  static String _base(StaffSignalModel s) {
    final text = _withPlate(s, shortName(s.customerName));
    // 15/10/2026: a booking imported without its plate (read on arrival) leaves the « — plate » out, as on the web.
    return s.plate.trim().isEmpty ? text.replaceFirst(RegExp(r'\s*—\s*$'), '') : text;
  }

  static String _withPlate(StaffSignalModel s, String who) {
    return switch (s.state) {
      ArrivalSignalState.announced => 'pro.banner_announced'.tr(args: [who, '${s.announcedMinutes ?? s.etaMinutes ?? 0}', s.plate]),
      ArrivalSignalState.atMeetingPoint =>
        s.kind == ArrivalKind.returnTrip ? 'pro.banner_at_meeting_point'.tr(args: [who, s.plate]) : 'pro.banner_at_reception'.tr(args: [who, s.plate]),
      _ => s.etaMinutes == null ? 'pro.banner_on_the_way'.tr(args: [who, s.plate]) : 'pro.banner_approaching'.tr(args: [who, '${s.etaMinutes}', s.plate]),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.peach,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 8, 4, 8),
          child: Row(
            children: [
              const Icon(Icons.notifications_active_rounded, color: AppColors.dark, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  text(signal),
                  key: const Key('arrival-banner'),
                  style: AppText.strong(size: 14.5, color: AppColors.dark),
                ),
              ),
              TextButton(
                onPressed: onSee,
                child: Text('${'pro.banner_see'.tr()} ›', style: AppText.strong(size: 14, color: AppColors.dark)),
              ),
              IconButton(
                tooltip: 'pro.banner_close'.tr(),
                onPressed: onClose,
                icon: const Icon(Icons.close_rounded, color: AppColors.dark, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
