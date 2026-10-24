import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../child_seats/child_seats.dart';
import '../theme/theme.dart';
import 'app_card.dart';

/// « Sièges auto » (24/10/2026): a child car seat seen from the side, the web's pictogram, drawn in [color].
class ChildSeatIcon extends StatelessWidget {
  const ChildSeatIcon({super.key, this.size = 16, this.color = AppColors.accent});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => CustomPaint(size: Size.square(size), painter: _ChildSeatPainter(color));
}

class _ChildSeatPainter extends CustomPainter {
  const _ChildSeatPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final path = Path()
      // The backrest.
      ..moveTo(7 * s, 3.5 * s)
      ..lineTo(9.5 * s, 13 * s)
      // The seat.
      ..moveTo(9.5 * s, 13 * s)
      ..lineTo(17 * s, 13 * s)
      ..arcToPoint(Offset(19 * s, 15 * s), radius: Radius.circular(2 * s))
      ..lineTo(19 * s, 16 * s)
      ..arcToPoint(Offset(16 * s, 19 * s), radius: Radius.circular(3 * s))
      ..lineTo(8.5 * s, 19 * s)
      ..arcToPoint(Offset(5.5 * s, 16 * s), radius: Radius.circular(3 * s))
      ..lineTo(5.5 * s, 15 * s)
      ..arcToPoint(Offset(7.5 * s, 13 * s), radius: Radius.circular(2 * s))
      ..lineTo(9.5 * s, 13 * s)
      // The harness.
      ..moveTo(12 * s, 13 * s)
      ..lineTo(12 * s, 10.5 * s)
      ..arcToPoint(Offset(14 * s, 8.5 * s), radius: Radius.circular(2 * s))
      ..lineTo(16 * s, 8.5 * s)
      // The feet.
      ..moveTo(8.5 * s, 19 * s)
      ..lineTo(8.5 * s, 20.5 * s)
      ..moveTo(16 * s, 19 * s)
      ..lineTo(16 * s, 20.5 * s);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_ChildSeatPainter old) => old.color != color;
}

/// One green-tinted pill per kind of seat asked (« Siège bébé », « 2 réhausseurs »), with the pictogram; nothing
/// without any seat.
class ChildSeatPills extends StatelessWidget {
  const ChildSeatPills({super.key, required this.seats, this.size = 11.5});
  final ChildSeats seats;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (!seats.any) return const SizedBox.shrink();
    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: [
        for (final kind in ChildSeatKind.values)
          if (seats.of(kind) > 0)
            Container(
              key: Key('child-seat-pill-${kind.name}'),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: const BoxDecoration(color: AppStatus.okSoft, borderRadius: AppRadius.chip),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ChildSeatIcon(size: size + 2, color: AppStatus.okText),
                  const SizedBox(width: 4),
                  Text(childSeatBadge(kind, seats.of(kind)), style: AppText.strong(size: size, color: AppStatus.okText)),
                ],
              ),
            ),
      ],
    );
  }
}

/// « Bébé · jusqu'à 12 mois / Siège dos à la route » and a « − n + » stepper (0 to 4), 44 px targets.
class ChildSeatStepperRow extends StatelessWidget {
  const ChildSeatStepperRow({super.key, required this.kind, required this.value, required this.onChanged, this.enabled = true});
  final ChildSeatKind kind;
  final int value;
  final ValueChanged<int> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final label = 'child_seats.${kind.name}'.tr();
    final canLess = enabled && value > 0;
    final canMore = enabled && value < ChildSeats.maxPerKind;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppText.body(size: 14.5, weight: 600)),
                Text('child_seats.${kind.name}_hint'.tr(), style: AppText.muted(size: 12.5)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _StepButton(
            key: Key('child-seat-less-${kind.name}'),
            icon: Icons.remove_rounded,
            tooltip: 'child_seats.less'.tr(args: [label]),
            onPressed: canLess ? () => onChanged(value - 1) : null,
          ),
          SizedBox(
            width: 32,
            child: Text('$value', key: Key('child-seat-count-${kind.name}'), textAlign: TextAlign.center, style: AppText.tabular(size: 17)),
          ),
          _StepButton(
            key: Key('child-seat-more-${kind.name}'),
            icon: Icons.add_rounded,
            tooltip: 'child_seats.more'.tr(args: [label]),
            onPressed: canMore ? () => onChanged(value + 1) : null,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({super.key, required this.icon, required this.tooltip, required this.onPressed});
  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Tooltip(
      message: tooltip,
      child: Material(
        color: enabled ? AppColors.tint : AppColors.canvas,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(icon, size: 20, color: enabled ? AppColors.accentDeep : AppColors.muted),
          ),
        ),
      ),
    );
  }
}

/// The three steppers, one per age group.
class ChildSeatsEditor extends StatelessWidget {
  const ChildSeatsEditor({super.key, required this.seats, required this.onChanged, this.enabled = true});
  final ChildSeats seats;
  final ValueChanged<ChildSeats> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      for (final kind in ChildSeatKind.values)
        ChildSeatStepperRow(kind: kind, value: seats.of(kind), enabled: enabled, onChanged: (n) => onChanged(seats.withKind(kind, n))),
    ],
  );
}

/// The driver's « À charger avant de partir » and the seats to load (« 1 siège bébé (dos à la route) · 1 réhausseur »);
/// nothing without any seat.
class ChildSeatsLoadBanner extends StatelessWidget {
  const ChildSeatsLoadBanner({super.key, required this.seats});
  final ChildSeats seats;

  @override
  Widget build(BuildContext context) {
    if (!seats.any) return const SizedBox.shrink();
    return AppCard(
      color: AppStatus.okSoft,
      borderColor: AppStatus.okSoft,
      padding: const EdgeInsets.fromLTRB(12, 9, 12, 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(padding: EdgeInsets.only(top: 1), child: ChildSeatIcon(size: 18, color: AppStatus.okText)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('child_seats.load_title'.tr(), style: AppText.strong(size: 13, color: AppStatus.okText)),
                Text(childSeatsLoadingLine(seats), key: const Key('child-seats-loading'), style: AppText.body(size: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
