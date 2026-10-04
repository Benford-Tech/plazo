import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/product.g.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';

/// "Plus" of Plazo Pro: who is signed in, the shuttle, the notifications, the parking plan
/// (managers), sign out, version. Team, account and settings arrive at step 4.
@RoutePage()
class ProMoreTabPage extends StatelessWidget {
  const ProMoreTabPage({super.key});

  @override
  Widget build(BuildContext context) {
    final staff = context.watch<ProAuthBloc>().state.staff;
    final role = staff?.role;
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'pro_tabs.more'.tr()),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          AppCard(
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
                      Text(staff?.name ?? '', key: const Key('pmore-name'), style: AppText.strong(size: 16)),
                      const SizedBox(height: 2),
                      Text(
                        [if (role != null) 'pro_more.role.$role'.tr(), if (staff?.operatorName != null) staff!.operatorName!].join(' · '),
                        style: AppText.muted(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _title('pro_more.work'.tr()),
          _Tile(
            key: const Key('pmore-shuttle'),
            icon: Icons.directions_bus_rounded,
            label: 'shuttle.title'.tr(),
            onTap: () => context.router.push(const ProShuttleRoute()),
          ),
          _Tile(
            key: const Key('pmore-planning'),
            icon: Icons.view_timeline_outlined,
            label: 'planning.title'.tr(),
            onTap: () => context.router.push(const ProSpotPlanningRoute()),
          ),
          _Tile(
            key: const Key('pmore-notifications'),
            icon: Icons.notifications_none_rounded,
            label: 'pro.notifications'.tr(),
            onTap: () => context.router.push(const ProNotificationsRoute()),
          ),
          if (can(role, 'parking:manage'))
            _Tile(key: const Key('pmore-plan'), icon: Icons.map_rounded, label: 'plan.menu'.tr(), onTap: () => context.router.push(const ProPlanRoute())),
          const SizedBox(height: 14),
          _title('pro_more.account'.tr()),
          _Tile(
            key: const Key('pmore-account'),
            icon: Icons.person_outline_rounded,
            label: 'account.title'.tr(),
            onTap: () => context.router.push(const ProAccountRoute()),
          ),
          if (can(role, 'team:manage'))
            _Tile(key: const Key('pmore-team'), icon: Icons.group_outlined, label: 'team.title'.tr(), onTap: () => context.router.push(const ProTeamRoute())),
          if (can(role, 'parking:manage'))
            _Tile(
              key: const Key('pmore-settings'),
              icon: Icons.tune_rounded,
              label: 'settings.title'.tr(),
              onTap: () => context.router.push(const ProParkingSettingsRoute()),
            ),
          _Tile(
            key: const Key('pmore-logout'),
            icon: Icons.logout_rounded,
            label: 'pro.logout'.tr(),
            onTap: () {
              context.read<ProAuthBloc>().add(const ProAuthLogoutRequested());
              context.router.replaceAll([if (AppConstants.isPro) const ProLoginRoute() else const AppShellRoute()]);
            },
          ),
          const SizedBox(height: 18),
          FutureBuilder<PackageInfo>(
            future: PackageInfo.fromPlatform(),
            builder: (context, snapshot) {
              final info = snapshot.data;
              final version = info == null ? '' : '${info.version}${info.buildNumber.isEmpty ? '' : ' (${info.buildNumber})'}';
              return Text(
                '${Product.proName} · ${'more.version'.tr(args: [version])}',
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
  const _Tile({super.key, required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
    minTileHeight: 52,
    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
    leading: Icon(icon, color: AppColors.accent),
    title: Text(label, style: AppText.body(size: 15.5, weight: 500)),
    trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.muted),
    onTap: onTap,
  );
}
