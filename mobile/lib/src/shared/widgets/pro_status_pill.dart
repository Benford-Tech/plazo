import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// Direction A (05/11/2026, « Sur place et attendu ne sont pas assez visibles »): a booking's status for the staff as a
/// solid pill, one colour per status: amber waiting, green at the parking, indigo with the shuttle, grey done, red
/// cancelled. Same colours as the web's StatusPill.
class ProStatusPill extends StatelessWidget {
  const ProStatusPill(this.status, {super.key, this.large = false});

  final String status;
  final bool large;

  static Color colorOf(String status) => switch (status) {
    'upcoming' || 'return_requested' => const Color(0xFFB45309),
    'arrived' || 'back_at_parking' => const Color(0xFF15803D),
    'shuttled_out' => AppStatus.info,
    'cancelled' || 'no_show' => AppStatus.bad,
    _ => const Color(0xFF6B7280),
  };

  @override
  Widget build(BuildContext context) {
    final key = 'pro.status.$status';
    final text = key.tr();
    return Container(
      padding: EdgeInsets.symmetric(horizontal: large ? 12 : 10, vertical: large ? 5 : 3),
      decoration: BoxDecoration(color: colorOf(status), borderRadius: AppRadius.pill),
      child: Text(
        text == key ? status : text,
        style: AppText.strong(size: large ? 14.5 : 13, color: Colors.white).copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}
