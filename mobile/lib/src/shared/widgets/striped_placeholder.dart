import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// The striped placeholder of a parking without photos yet (as the site's).
class StripedPlaceholder extends StatelessWidget {
  const StripedPlaceholder({super.key, this.height, this.label});

  final double? height;

  /// Spoken label ("Photos du parking à venir").
  final String? label;

  @override
  Widget build(BuildContext context) {
    final box = SizedBox(
      height: height,
      width: double.infinity,
      child: const CustomPaint(painter: _StripesPainter()),
    );
    return label == null
        ? ExcludeSemantics(child: box)
        : Semantics(
            label: label,
            image: true,
            child: ExcludeSemantics(child: box),
          );
  }
}

class _StripesPainter extends CustomPainter {
  const _StripesPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = Colors.white);
    final paint = Paint()
      ..color = AppColors.line
      ..strokeWidth = 10;
    canvas.save();
    canvas.clipRect(Offset.zero & size);
    for (double x = -size.height; x < size.width + size.height; x += 20) {
      canvas.drawLine(Offset(x, size.height), Offset(x + size.height, 0), paint);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A parking photo (operators' https URLs), or the striped placeholder.
class ParkingPhoto extends StatelessWidget {
  const ParkingPhoto({super.key, required this.url, required this.height, this.label});

  final String? url;
  final double height;
  final String? label;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) return StripedPlaceholder(height: height, label: label);
    return Semantics(
      label: label,
      image: true,
      child: Image.network(
        url!,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => StripedPlaceholder(height: height),
      ),
    );
  }
}
