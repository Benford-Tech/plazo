import 'package:flutter/material.dart';

import '../../core/constants/product.g.dart';
import '../theme/theme.dart';

/// The prune header of direction D, with the product name (from product.json) in Playfair italic.
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
      backgroundColor: AppColors.prune,
      leading: leading,
      title: Text(title ?? (pro ? Product.proName : Product.name), style: AppText.title(size: 24, color: Colors.white)),
      actions: actions,
    );
  }
}
