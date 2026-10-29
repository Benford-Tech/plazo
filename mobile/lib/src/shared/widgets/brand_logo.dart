import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/constants/product.g.dart';
import '../theme/theme.dart';

/// The horizontal logo (the sign), light-ground variant (orange sign, dark wordmark) for the
/// grey and white app bars since 05/10/2026; the product name is its semantic label. `pro` shows the pro sign of the
/// web pro space instead (29/10/2026, « le logo Plazo Pro n'est pas conforme »): the lime panel with dark green letters
/// (brand/logo-horizontal-pro.svg), then « PRO » in dark green capitals, as `Logo` with its suffix in admin/.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.height = 30, this.pro = false});

  final double height;
  final bool pro;

  @override
  Widget build(BuildContext context) {
    if (!pro) return SvgPicture.asset('assets/brand/logo-horizontal-light.svg', height: height, semanticsLabel: Product.name);
    final logo = SvgPicture.asset('assets/brand/logo-horizontal-pro.svg', height: height, semanticsLabel: Product.proName);
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        logo,
        const SizedBox(width: 8),
        ExcludeSemantics(
          child: Text(
            'PRO',
            style: AppText.title(size: height * 0.55, color: AppColors.accent).copyWith(letterSpacing: 1.5),
          ),
        ),
      ],
    );
  }
}
