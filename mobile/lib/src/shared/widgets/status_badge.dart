import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';

/// A booking's status as a small badge (the site's StatusBadge), or any [text] in a [tone].
class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.text, this.tone = BadgeTone.ok});

  /// "Confirmée", "Annulée"… for a booking status.
  factory StatusBadge.status(String status, {Key? key, bool paid = false}) {
    final tone = switch (status) {
      'upcoming' => BadgeTone.ok,
      'cancelled' || 'no_show' => BadgeTone.danger,
      'returned' => BadgeTone.muted,
      _ => BadgeTone.tint,
    };
    final text = status == 'upcoming' && paid ? 'trips.paid'.tr() : 'status.$status'.tr();
    return StatusBadge(key: key, text: text, tone: tone);
  }

  final String text;
  final BadgeTone tone;

  @override
  Widget build(BuildContext context) {
    // Pastel chips on both apps (the pro's lime for its "live" highlight).
    final (bg, fg) = switch (tone) {
      BadgeTone.ok => (const Color(0xFFE9F7EE), const Color(0xFF1F7A3F)),
      BadgeTone.peach => AppConstants.isPro ? (const Color(0xFFEEF7DD), AppColors.accentDeep) : (const Color(0xFFFDF0E6), const Color(0xFFB4581D)),
      BadgeTone.danger => (const Color(0xFFFCE8E6), AppColors.danger),
      BadgeTone.tint => (AppColors.tint, AppColors.accentDeep),
      BadgeTone.muted => (AppColors.canvas, AppColors.muted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.chip),
      child: Text(text, style: AppText.strong(size: 11.5, color: fg)),
    );
  }
}

enum BadgeTone { ok, peach, danger, tint, muted }
