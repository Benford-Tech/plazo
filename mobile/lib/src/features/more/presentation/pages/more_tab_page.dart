import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../services/link_service.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';

/// "Plus": the staff's space (the existing pro flow), the site's FAQ and legal pages, contact and
/// the app's version.
@RoutePage()
class MoreTabPage extends StatelessWidget {
  const MoreTabPage({super.key});

  @override
  Widget build(BuildContext context) {
    final links = locator<LinkService>();
    void site(String path) => links.open(links.sitePage(path));
    return Scaffold(
      appBar: BrandAppBar(title: 'more.title'.tr()),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          InkWell(
            key: const Key('more-pro'),
            borderRadius: BorderRadius.circular(16),
            onTap: () => context.router.push(const ProShellRoute()),
            child: AppCard(
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(gradient: AppColors.primaryGradient, shape: BoxShape.circle),
                    child: const Icon(Icons.badge_outlined, color: Colors.white),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('more.pro'.tr(), style: AppText.strong(size: 16)),
                        const SizedBox(height: 2),
                        Text('more.pro_text'.tr(), style: AppText.muted()),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
          _title('more.travellers'.tr()),
          _Tile(key: const Key('more-faq'), icon: Icons.help_outline_rounded, label: 'more.faq'.tr(), external: true, onTap: () => site('/#faq')),
          _Tile(
            key: const Key('more-contact'),
            icon: Icons.mail_outline_rounded,
            label: 'more.contact'.tr(),
            subtitle: Product.supportEmail,
            external: true,
            onTap: () => links.open(Uri(scheme: 'mailto', path: Product.supportEmail)),
          ),
          const SizedBox(height: 14),
          _title('more.about'.tr()),
          _Tile(key: const Key('more-terms'), icon: Icons.description_outlined, label: 'more.terms'.tr(), external: true, onTap: () => site('/conditions')),
          _Tile(key: const Key('more-privacy'), icon: Icons.privacy_tip_outlined, label: 'more.privacy'.tr(), external: true, onTap: () => site('/confidentialite')),
          _Tile(key: const Key('more-legal'), icon: Icons.gavel_rounded, label: 'more.legal'.tr(), external: true, onTap: () => site('/mentions-legales')),
          const SizedBox(height: 18),
          FutureBuilder<PackageInfo>(
            future: PackageInfo.fromPlatform(),
            builder: (context, snapshot) {
              final info = snapshot.data;
              final version = info == null ? '' : '${info.version}${info.buildNumber.isEmpty ? '' : ' (${info.buildNumber})'}';
              return Text(
                '${Product.name} · ${'more.version'.tr(args: [version])}',
                key: const Key('more-version'),
                textAlign: TextAlign.center,
                style: AppText.muted(size: 12.5),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _title(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 4, left: 4),
    child: Semantics(header: true, child: Text(text.toUpperCase(), style: AppText.label(size: 12))),
  );
}

class _Tile extends StatelessWidget {
  const _Tile({super.key, required this.icon, required this.label, required this.onTap, this.subtitle, this.external = false});

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final bool external;

  @override
  Widget build(BuildContext context) => Semantics(
    hint: external ? 'common.opens_outside'.tr() : null,
    child: ListTile(
      minTileHeight: 52,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      leading: Icon(icon, color: AppColors.accent),
      title: Text(label, style: AppText.body(size: 15.5, weight: 500)),
      subtitle: subtitle == null ? null : Text(subtitle!, style: AppText.muted(size: 13)),
      trailing: Icon(external ? Icons.open_in_new_rounded : Icons.chevron_right_rounded, size: 18, color: AppColors.muted),
      onTap: onTap,
    ),
  );
}
