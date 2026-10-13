import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../theme/theme.dart';
import 'brand_logo.dart';

/// The orange header of direction D (T-A): the logo (or a page title in Playfair italic).
class BrandAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BrandAppBar({super.key, this.title, this.subtitle, this.actions, this.pro = false, this.leading});

  final String? title;

  /// A muted line under the title (« Connecté avec Apple · julie.m@icloud.com »).
  final String? subtitle;
  final List<Widget>? actions;
  final Widget? leading;
  final bool pro;

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    // T-A (05/10/2026): the traveller's bar is the grey ground itself, the logo (an orange sign) or a brown title on it.
    final isPro = AppConstants.isPro;
    return AppBar(
      toolbarHeight: 60,
      backgroundColor: isPro ? AppColors.brand : AppColors.background,
      leading: leading,
      title: title == null
          ? BrandLogo(height: 30, pro: pro)
          : subtitle == null
          ? Text(title!, style: AppText.title(size: 24, color: AppColors.brownOrInk))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title!, style: AppText.title(size: 22, color: AppColors.brownOrInk)),
                Text(subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.muted(size: 12.5)),
              ],
            ),
      actions: actions,
    );
  }
}
