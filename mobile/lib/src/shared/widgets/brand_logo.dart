import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/constants/product.g.dart';
import '../theme/theme.dart';

/// The horizontal logo (the sign), light-ground variant (orange sign, dark wordmark) for the
/// grey and white app bars since 05/10/2026; the product name is its semantic label. `pro` adds the "Pro" suffix next to it, as text.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 30, this.pro = false});

  final double height;
  final bool pro;

  @override
  Widget build(BuildContext context) {
    final logo = SvgPicture.asset('assets/brand/logo-horizontal-light.svg', height: height, semanticsLabel: pro ? Product.proName : Product.name);
    if (!pro) return logo;
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        logo,
        const SizedBox(width: 8),
        ExcludeSemantics(
          child: Text(
            'Pro',
            style: AppText.strong(size: height * 0.5, color: AppColors.brownOrInk).copyWith(letterSpacing: 1),
          ),
        ),
      ],
    );
  }
}
