import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// 02/11/2026 (« marquer les réservations en direct pour les stats et une icône parlante »): booked with the parking
/// itself, nobody in between (phone, counter, its own website), so no commission. Mirror of the server's
/// `domain/direct-booking.ts`.
const directChannels = {'phone', 'counter', 'website'};

bool isDirectBooking(String channel) => directChannels.contains(channel);

/// The handshake of a direct booking: « En direct », or the icon alone ([compact]) next to a name.
class DirectBadge extends StatelessWidget {
  const DirectBadge({super.key, this.compact = false});
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final label = 'res.direct.badge'.tr();
    return Semantics(
      label: compact ? label : null,
      child: Container(
        key: const Key('direct-badge'),
        padding: compact ? const EdgeInsets.all(4) : const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: const BoxDecoration(color: AppColors.tint, borderRadius: AppRadius.pill),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.handshake_rounded, size: 15, color: AppColors.accent),
            if (!compact) ...[const SizedBox(width: 4), Text(label, style: AppText.strong(size: 12, color: AppColors.accent))],
          ],
        ),
      ),
    );
  }
}
