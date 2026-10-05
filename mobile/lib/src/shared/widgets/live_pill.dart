import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../theme/theme.dart';
import 'live_dot.dart';

/// "EN DIRECT · il y a 12 s" (T-A, 05/10/2026): a pulsing dot and the age of the last update, which
/// keeps counting every second between two polls. [at] null: just the dot and the word.
class LivePill extends StatefulWidget {
  const LivePill({super.key, this.at, this.label, this.dark = false, this.color = AppColors.accent});

  /// When the data was last refreshed (the poll's time, plus the server's own age when it gives one).
  final DateTime? at;

  /// Replaces "En direct" (e.g. "Position").
  final String? label;

  /// On a dark surface (the car-finding screen).
  final bool dark;
  final Color color;

  @override
  State<LivePill> createState() => _LivePillState();
}

class _LivePillState extends State<LivePill> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.at != null && LiveDot.animationsEnabled) _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final at = widget.at;
    final seconds = at == null ? null : DateTime.now().difference(at).inSeconds.clamp(0, 86400);
    final age = seconds == null
        ? null
        : seconds < 60
        ? 'live.seconds'.tr(args: ['$seconds'])
        : 'live.minutes'.tr(args: ['${seconds ~/ 60}']);
    final fg = widget.dark ? Colors.white : AppColors.ink;
    return Container(
      padding: const EdgeInsets.fromLTRB(9, 5, 11, 5),
      decoration: BoxDecoration(
        color: widget.dark ? Colors.white.withValues(alpha: 0.14) : Colors.white,
        borderRadius: AppRadius.pill,
        boxShadow: widget.dark ? null : const [BoxShadow(color: Color(0x14000000), blurRadius: 10, offset: Offset(0, 3))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          LiveDot(color: widget.color, size: 8),
          const SizedBox(width: 6),
          Text((widget.label ?? 'live.live'.tr()).toUpperCase(), style: AppText.label(size: 10.5, color: fg)),
          if (age != null) ...[
            const SizedBox(width: 5),
            Text(age, style: AppText.tabular(size: 11, weight: 600, color: widget.dark ? Colors.white70 : AppColors.muted)),
          ],
        ],
      ),
    );
  }
}
