import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// A plate drawn like a French one: blue EU band with "F", black on white.
class FrenchPlate extends StatelessWidget {
  const FrenchPlate(this.value, {super.key, this.size = 14});

  final String value;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Plaque $value',
      excludeSemantics: true,
      child: Container(
        height: size * 1.75,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: const Color(0xFF8A8A8A)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: size * 0.95,
              color: AppColors.plateBlue,
              alignment: Alignment.bottomCenter,
              padding: EdgeInsets.only(bottom: size * 0.12),
              child: Text('F', style: AppText.strong(size: size * 0.6, color: Colors.white)),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: size * 0.45),
              child: Text(value, style: AppText.tabular(size: size, color: const Color(0xFF111111))),
            ),
          ],
        ),
      ),
    );
  }
}
