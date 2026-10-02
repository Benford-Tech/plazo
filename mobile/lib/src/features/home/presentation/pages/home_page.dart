import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';

/// One app, two clearly separate flows (flavors later): the traveller's and the staff's.
@RoutePage()
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const BrandAppBar(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('home.welcome'.tr(), style: AppText.title(size: 26)),
            const SizedBox(height: 4),
            Text(Product.tagline, style: AppText.muted()),
            const SizedBox(height: 18),
            _Choice(
              key: const Key('choose-traveller'),
              icon: Icons.confirmation_number_outlined,
              title: 'home.traveller_title'.tr(),
              text: 'home.traveller_text'.tr(),
              onTap: () => context.router.push(const OpenBookingRoute()),
            ),
            const SizedBox(height: 12),
            _Choice(
              key: const Key('choose-pro'),
              icon: Icons.badge_outlined,
              title: 'home.pro_title'.tr(),
              text: 'home.pro_text'.tr(),
              onTap: () => context.router.push(const ProTodayRoute()),
            ),
          ],
        ),
      ),
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({super.key, required this.icon, required this.title, required this.text, required this.onTap});
  final IconData icon;
  final String title;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: AppCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(gradient: AppColors.primaryGradient, shape: BoxShape.circle),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppText.strong(size: 16)),
                  const SizedBox(height: 2),
                  Text(text, style: AppText.muted()),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}
