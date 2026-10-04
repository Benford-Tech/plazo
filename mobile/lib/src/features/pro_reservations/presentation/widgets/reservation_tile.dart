import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/french_plate.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../data/models/reservation_models.dart';

/// "sam. 4 oct. 06:30" from an instant, in the phone's time (the parking's, in practice).
String dayTime(DateTime instant) => DateFormat('EEE d MMM HH:mm', 'fr_FR').format(instant.toLocal());

/// "sam. 4 oct." from an instant.
String dayOf(DateTime instant) => DateFormat('EEE d MMM', 'fr_FR').format(instant.toLocal());

/// A booking's status badge for the staff (tones of the pro space).
StatusBadge proStatusBadge(String status, {Key? key}) {
  final tone = switch (status) {
    'upcoming' => BadgeTone.ok,
    'arrived' || 'shuttled_out' || 'return_requested' => BadgeTone.peach,
    'cancelled' || 'no_show' => BadgeTone.danger,
    _ => BadgeTone.muted,
  };
  return StatusBadge(key: key, text: 'pro.status.$status'.tr(), tone: tone);
}

/// A row of the bookings list: plate, name, stay, status.
class ReservationTile extends StatelessWidget {
  const ReservationTile({super.key, required this.reservation, required this.onTap});

  final ReservationModel reservation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final r = reservation;
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.line)),
        ),
        child: Row(
          children: [
            FrenchPlate(r.plate, size: 12),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.customerName, style: AppText.strong(size: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text('${dayTime(r.arrivalAt)} → ${dayTime(r.returnAt)}', style: AppText.muted(size: 12.5)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            proStatusBadge(r.status),
          ],
        ),
      ),
    );
  }
}
