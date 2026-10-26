import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../../core/constants/product.g.dart';
import '../../../../core/helpers/roles.dart';
import '../../../../core/router/app_router.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../pro_auth/data/models/staff_model.dart';
import '../../../pro_auth/presentation/bloc/pro_auth_bloc.dart';
import '../../../../core/helpers/posts.dart';
import '../../../../shared/tutorials/tutorials_page.dart';

/// "Plus" of Plazo Pro: who is signed in, then the menu by role (M-A, 26/10/2026): the post of the day, the manager's
/// tools, one block per post the member can hold, the account; version at the bottom.
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
          // M-A (26/10/2026, « réorganise le menu par rôle »): the post of the day first, then one block per post the
          // member can hold (the manager's block for the managers' tools), then the account.
          _title('pro_more.post_day'.tr()),
          _Tile(
            key: const Key('pmore-post'),
            icon: Icons.badge_outlined,
            label: 'post.mine'.tr(args: ['post.name.${staff?.activePost ?? 'agent'}'.tr()]),
            onTap: () => context.router.push(const ProPostRoute()),
          ),
          if (staff?.activePost == 'driver')
            _Tile(
              key: const Key('pmore-vehicle'),
              icon: Icons.airport_shuttle_rounded,
              label: 'vehicle_day.mine'.tr(args: [staff?.vehicle?.title ?? 'vehicle_day.none_short'.tr()]),
              onTap: () => context.router.push(const ProVehicleRoute()),
            ),
          _Tile(
            key: const Key('pmore-start'),
            icon: Icons.rocket_launch_outlined,
            label: 'pro_more.start'.tr(),
            onTap: () => context.router.push(const ProGettingStartedRoute()),
          ),
          if (can(role, 'parking:manage') || can(role, 'revenue:view') || can(role, 'team:manage')) ...[
            const SizedBox(height: 14),
            _title('pro_more.manager'.tr()),
            if (can(role, 'revenue:view'))
              _Tile(
                key: const Key('pmore-revenue'),
                icon: Icons.euro_rounded,
                label: 'revenue.title'.tr(),
                onTap: () => context.router.push(const ProRevenueRoute()),
              ),
            if (can(role, 'team:manage'))
              _Tile(key: const Key('pmore-team'), icon: Icons.group_outlined, label: 'team.title'.tr(), onTap: () => context.router.push(const ProTeamRoute())),
            if (can(role, 'parking:manage'))
              _Tile(key: const Key('pmore-plan'), icon: Icons.map_rounded, label: 'plan.menu'.tr(), onTap: () => context.router.push(const ProPlanRoute())),
            if (can(role, 'parking:manage'))
              _Tile(
                key: const Key('pmore-vehicles'),
                icon: Icons.airport_shuttle_rounded,
                label: 'vehicles.title'.tr(),
                onTap: () => context.router.push(const ProVehiclesRoute()),
              ),
            if (can(role, 'parking:manage'))
              _Tile(
                key: const Key('pmore-settings'),
                icon: Icons.tune_rounded,
                label: 'settings.title'.tr(),
                onTap: () => context.router.push(const ProParkingSettingsRoute()),
              ),
          ],
          if (_holds(staff, 'driver')) ...[
            const SizedBox(height: 14),
            _title('pro_more.driver'.tr()),
            _Tile(
              key: const Key('pmore-shuttle'),
              icon: Icons.directions_bus_rounded,
              label: 'shuttle.title'.tr(),
              onTap: () => context.router.push(ProShuttleRoute()),
            ),
          ],
          if (_holds(staff, 'agent')) ...[
            const SizedBox(height: 14),
            _title('pro_more.agent'.tr()),
            _Tile(
              key: const Key('pmore-reservations'),
              icon: Icons.list_alt_rounded,
              label: 'pro_tabs.reservations'.tr(),
              onTap: () => context.router.push(const ProReservationsRoute()),
            ),
          ],
          if (_holds(staff, 'valet')) ...[
            const SizedBox(height: 14),
            _title('pro_more.valet'.tr()),
            _Tile(
              key: const Key('pmore-planning'),
              icon: Icons.view_timeline_outlined,
              label: 'planning.title'.tr(),
              onTap: () => context.router.push(const ProSpotPlanningRoute()),
            ),
          ],
          const SizedBox(height: 14),
          _title('pro_more.account'.tr()),
          _Tile(
            key: const Key('pmore-notifications'),
            icon: Icons.notifications_none_rounded,
            label: 'pro.notifications'.tr(),
            onTap: () => context.router.push(const ProNotificationsRoute()),
          ),
          _Tile(
            key: const Key('pmore-tutorials'),
            icon: Icons.school_outlined,
            label: 'tutorials.title'.tr(),
            onTap: () => TutorialsPage.open(
              context,
              activePost: staff?.activePost ?? 'agent',
              posts: staff == null ? const [] : posts.where(staff.allowedPosts.contains).toList(),
            ),
          ),
          _Tile(
            key: const Key('pmore-account'),
            icon: Icons.person_outline_rounded,
            label: 'account.title'.tr(),
            onTap: () => context.router.push(const ProAccountRoute()),
          ),
          _Tile(
            key: const Key('pmore-logout'),
            icon: Icons.logout_rounded,
            label: 'pro.logout'.tr(),
            onTap: () {
              context.read<ProAuthBloc>().add(const ProAuthLogoutRequested());
              context.router.replaceAll([const ProLoginRoute()]);
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

  /// A block shows for a member whose role covers the post (the manager covers them all), whatever the post of the day.
  static bool _holds(StaffModel? staff, String post) =>
      staff != null && (staff.allowedPosts.isEmpty ? coveredPosts(staff.role) : staff.allowedPosts).contains(post);

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
