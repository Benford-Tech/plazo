import 'dart:async';
import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/helpers/formatters.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/live_pill.dart';
import '../../data/models/return_model.dart';
import '../bloc/return_bloc.dart';

/// The mockup's progress ring (T-A, 05/10/2026), counting in real time: until the landing, then
/// until the shuttle; above it the three steps as chips, the current one orange.
class ReturnRing extends StatefulWidget {
  const ReturnRing({super.key, required this.data, required this.step, required this.fetchedAt});

  final TravellerReturnModel data;
  final ReturnStep step;

  /// When the return state was last polled (for the "En direct" pill).
  final DateTime fetchedAt;

  /// The ring spans this long before the landing (full at 3 h, empty at touchdown).
  static const window = Duration(hours: 3);

  @override
  State<ReturnRing> createState() => _ReturnRingState();
}

class _ReturnRingState extends State<ReturnRing> {
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _now = DateTime.now()));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.data;
    final f = d.flight;
    final shuttle = d.shuttle;
    final String kicker;
    final String big;
    final String sub;
    final double progress;
    Color colour = AppColors.accent;
    if (shuttle != null) {
      // The shuttle: its ETA counts down, the ring fills as it gets closer (from 20 min out).
      final eta = shuttle.etaAt;
      final left = eta?.difference(_now);
      kicker = 'ring.shuttle_in'.tr();
      big = left == null ? '--:--' : _mmss(left);
      sub = shuttle.distanceM == null ? 'ring.shuttle_waiting'.tr() : 'ring.shuttle_away'.tr(args: [distanceLabel(shuttle.distanceM!)]);
      progress = left == null ? 0 : (1 - left.inSeconds / (20 * 60)).clamp(0.05, 1.0);
      colour = AppColors.peach;
    } else if (f.landed) {
      final at = f.landedAt ?? f.expectedAt;
      kicker = 'ring.landed'.tr();
      big = at == null ? '' : hhmm(at);
      sub = d.atMeetingPoint ? 'ring.waiting_shuttle'.tr() : 'ring.go_meeting'.tr();
      progress = 1;
    } else if (f.cancelled) {
      kicker = 'ring.cancelled'.tr();
      big = f.number ?? '';
      sub = 'return_day.flight_cancelled_help'.tr();
      progress = 0;
      colour = AppColors.danger;
    } else {
      final at = f.expectedAt ?? DateTime.tryParse(d.returnAt);
      final left = at?.difference(_now);
      kicker = 'ring.lands_in'.tr();
      big = left == null ? '--:--' : (left.isNegative ? 'ring.any_minute'.tr() : _hms(left));
      final late = f.scheduledAt != null && f.estimatedAt != null ? f.estimatedAt!.difference(f.scheduledAt!).inMinutes : 0;
      sub = at == null
          ? 'return_day.no_flight_help'.tr()
          : late > 0
          ? 'ring.planned_late'.tr(args: [hhmm(at), '$late'])
          : 'ring.planned'.tr(args: [hhmm(at)]);
      progress = left == null ? 0 : (1 - left.inSeconds / ReturnRing.window.inSeconds).clamp(0.03, 1.0);
    }
    final steps = [
      ('flight', 'ring.step_landing'.tr(), ReturnStep.flight),
      ('meeting', 'ring.step_meeting'.tr(), ReturnStep.meetingPoint),
      ('shuttle', 'ring.step_shuttle'.tr(), ReturnStep.shuttle),
    ];
    return Container(
      key: const Key('return-ring'),
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.card,
        boxShadow: [BoxShadow(color: Color(0x12000000), blurRadius: 24, offset: Offset(0, 10))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 18, color: AppColors.ink),
              const SizedBox(width: 6),
              Expanded(
                child: Text(f.number == null ? 'ring.title_no_flight'.tr() : 'ring.title'.tr(args: [f.number!]), style: AppText.strong(size: 15)),
              ),
              LivePill(at: widget.fetchedAt),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              for (final (key, label, step) in steps) ...[
                Expanded(
                  child: Container(
                    key: Key('ring-step-$key'),
                    height: 34,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: widget.step == step ? AppColors.accent : AppColors.canvas, borderRadius: AppRadius.pill),
                    child: Text(
                      label,
                      style: AppText.strong(size: 11.5, color: widget.step == step ? Colors.white : AppColors.muted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                if (step != ReturnStep.shuttle) const SizedBox(width: 6),
              ],
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: 176,
            height: 176,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CustomPaint(
                  painter: _RingPainter(progress: progress, colour: colour),
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(kicker, style: AppText.title(size: 14, color: AppColors.brownOrInk)),
                      const SizedBox(height: 2),
                      Text(
                        big,
                        key: const Key('ring-big'),
                        style: AppText.tabular(size: big.length > 8 ? 19 : 26, weight: 800).copyWith(letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 2),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 26),
                        child: Text(sub, key: const Key('ring-sub'), textAlign: TextAlign.center, style: AppText.muted(size: 11), maxLines: 2),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _two(int n) => n.toString().padLeft(2, '0');
  static String _hms(Duration d) => '${_two(d.inHours)}:${_two(d.inMinutes % 60)}:${_two(d.inSeconds % 60)}';
  static String _mmss(Duration d) => d.isNegative ? '00:00' : '${_two(d.inMinutes)}:${_two(d.inSeconds % 60)}';
}

/// The arc, dotted on its trailing edge like the mockup's.
class _RingPainter extends CustomPainter {
  const _RingPainter({required this.progress, required this.colour});
  final double progress;
  final Color colour;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(10, 10, size.width - 20, size.height - 20);
    final track = Paint()
      ..color = AppColors.canvas
      ..style = PaintingStyle.stroke
      ..strokeWidth = 11
      ..strokeCap = StrokeCap.round;
    final arc = Paint()
      ..color = colour
      ..style = PaintingStyle.stroke
      ..strokeWidth = 11
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, 0, 2 * math.pi, false, track);
    final sweep = 2 * math.pi * progress;
    canvas.drawArc(rect, -math.pi / 2, sweep, false, arc);
    // A few dots scattered past the arc's end, as on the mockup.
    final dot = Paint()..color = colour.withValues(alpha: 0.55);
    final r = rect.width / 2;
    final c = rect.center;
    for (var i = 1; i <= 6; i++) {
      final a = -math.pi / 2 + sweep + i * 0.09;
      final rr = r + (i.isEven ? 7 : -8) * (i / 6);
      canvas.drawCircle(Offset(c.dx + rr * math.cos(a), c.dy + rr * math.sin(a)), 3.2 - i * 0.35, dot);
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress || old.colour != colour;
}
