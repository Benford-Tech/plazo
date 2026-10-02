import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// A rounded card (16 px) with a light border, as in the mockups.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(14), this.borderColor, this.borderWidth = 1, this.color});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final double borderWidth;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? AppColors.line, width: borderWidth),
      ),
      child: child,
    );
  }
}
