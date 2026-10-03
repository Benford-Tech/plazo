import 'package:flutter/material.dart';

import '../theme/theme.dart';
import 'brand_logo.dart';

/// The orange header of direction D (T-A): the logo (or a page title in Playfair italic).
class BrandAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BrandAppBar({super.key, this.title, this.actions, this.pro = false, this.leading});

  final String? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool pro;

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      toolbarHeight: 60,
      backgroundColor: AppColors.brand,
      leading: leading,
      title: title == null ? BrandLogo(height: 30, pro: pro) : Text(title!, style: AppText.title(size: 24, color: Colors.white)),
      actions: actions,
    );
  }
}
