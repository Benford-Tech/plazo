import 'package:easy_localization/easy_localization.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:flutter/material.dart';

import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/movement_kind.dart';
import '../../../../shared/widgets/pro_status_pill.dart';
import '../../data/models/reservation_models.dart';
import '../../../../shared/widgets/direct_badge.dart';

/// "sam. 4 oct. 06:30" from an instant, in the phone's time (the parking's, in practice).
String dayTime(DateTime instant) => DateFormat('EEE d MMM HH:mm', appLocale).format(instant.toLocal());

/// "sam. 4 oct." from an instant.
String dayOf(DateTime instant) => DateFormat('EEE d MMM', appLocale).format(instant.toLocal());

/// « Pointé à l'embarquement par Karim » (14/10/2026): the driver checked the traveller in when the shuttle left.
String boardingCheckInText(BoardingCheckInModel checkIn) {
  final name = checkIn.driverFirstName?.trim();
  return name == null || name.isEmpty ? 'occupation.boarding_check_in_anonymous'.tr() : 'occupation.boarding_check_in'.tr(args: [name]);
}

/// A booking's status for the staff: the solid pill of direction A (05/11/2026).
Widget proStatusBadge(String status, {Key? key, bool large = false}) => ProStatusPill(status, key: key, large: large);

/// A row of the bookings list: plate, name, stay, status; since 28/10/2026 tinted with its next movement
/// (« ARRIVÉE · sam. 4 oct. 06:30 » while expected, « DÉPART · … » while the car is at the parking).
class ReservationTile extends StatelessWidget {
  const ReservationTile({super.key, required this.reservation, required this.onTap});

  final ReservationModel reservation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final r = reservation;
    final kind = nextMovementOf(r.status);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: kind == null ? AppColors.surface : movementSoft(kind),
        borderRadius: AppRadius.chip,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: MovementEdge(
            kind: kind,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              child: Row(
                children: [
                  FrenchPlate(r.plate, size: 12),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(child: Text(r.customerName, style: AppText.strong(size: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            if (isDirectBooking(r.channel)) const Padding(padding: EdgeInsets.only(left: 6), child: DirectBadge(compact: true)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text('${dayTime(r.arrivalAt)} → ${dayTime(r.returnAt)}', style: AppText.muted(size: 12.5)),
                        if (kind != null) ...[
                          const SizedBox(height: 4),
                          MovementPill(kind, key: Key('movement-${r.id}'), time: dayTime(kind == Movement.arrival ? r.arrivalAt : r.returnAt)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  proStatusBadge(r.status),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
