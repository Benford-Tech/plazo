import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// H-B: a filled icon on a small square tile with the brand gradient (or a flat colour).
/// Decorative: the text next to it carries the meaning.
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.size = 36, this.gradient = AppColors.primaryGradient, this.color, this.iconColor = Colors.white});

  final IconData icon;
  final double size;
  final Gradient? gradient;
  final Color? color;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(gradient: color == null ? gradient : null, color: color, borderRadius: BorderRadius.circular(size * 0.3)),
        child: Icon(icon, size: size * 0.55, color: iconColor),
      ),
    );
  }
}

/// Three gradient tiles, one per step: orange → peach, peach → yellow, yellow → straw.
abstract final class StepGradients {
  static const first = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.accent, AppColors.peach]);
  static const second = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.peach, Color(0xFFF5C400)]);
  static const third = LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFF5C400), Color(0xFFFFD86B)]);
}
