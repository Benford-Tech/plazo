import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../core/helpers/posts.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/utils/error_message_handler.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_auth_bloc.dart';

/// "Aujourd'hui, je suis…" (R-C, 04/10/2026): the post held for the day, among those the role
/// covers, stored on the account (the manager sees it in the team). The app lays its tabs out for
/// it. Shown once after the first sign-in, then from Plus › Mon poste.
@RoutePage()
class ProPostPage extends StatefulWidget {
  const ProPostPage({super.key});

  @override
  State<ProPostPage> createState() => _ProPostPageState();
}

class _ProPostPageState extends State<ProPostPage> {
  String? _chosen;

  static const _icons = {
    'manager': Icons.manage_accounts_rounded,
    'agent': Icons.support_agent_rounded,
    'driver': Icons.directions_bus_rounded,
    'valet': Icons.key_rounded,
  };

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProAuthBloc, ProAuthState>(
      listenWhen: (a, b) => a.postState != b.postState,
      listener: (context, state) {
        if (state.postState.isSuccess) {
          // A driver picks the vehicle of the day next (V-A); the others go to their tabs.
          context.router.replaceAll([if (state.staff?.activePost == 'driver') const ProVehicleRoute() else const ProShellRoute()]);
        } else if (state.postState.isError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(translateErrorCode(state.errorCode))));
        }
      },
      builder: (context, state) {
        final staff = state.staff;
        final allowed = staff == null ? const <String>[] : posts.where(staff.allowedPosts.contains).toList();
        final current = _chosen ?? staff?.activePost;
        final canPop = context.router.canPop();
        return Scaffold(
          appBar: BrandAppBar(pro: true, title: 'post.title'.tr(), leading: canPop ? null : const SizedBox.shrink()),
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              children: [
                Text('post.intro'.tr(), style: AppText.muted()),
                const SizedBox(height: 16),
                for (final p in allowed) ...[
                  _PostCard(
                    post: p,
                    icon: _icons[p] ?? Icons.badge_outlined,
                    selected: p == current,
                    isRole: p == staff?.role,
                    onTap: () => setState(() => _chosen = p),
                  ),
                  const SizedBox(height: 10),
                ],
                const SizedBox(height: 8),
                GradientButton(
                  key: const Key('post-confirm'),
                  label: 'post.confirm'.tr(),
                  busy: state.postState.isProcessing,
                  onPressed: current == null ? null : () => context.read<ProAuthBloc>().add(ProAuthPostChosen(current)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.icon, required this.selected, required this.isRole, required this.onTap});
  final String post;
  final IconData icon;
  final bool selected;
  final bool isRole;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.card, side: BorderSide(color: selected ? AppColors.accent : AppColors.line, width: selected ? 2 : 1)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        key: Key('post-$post'),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: selected ? AppColors.accent : AppColors.tint, borderRadius: AppRadius.small),
                child: Icon(icon, color: selected ? AppColors.onAccent : AppColors.accent),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('post.name.$post'.tr(), style: AppText.title(size: 20)),
                        if (isRole) ...[const SizedBox(width: 8), Text('team.role'.tr().toUpperCase(), style: AppText.label(size: 10.5))],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text('post.text.$post'.tr(), style: AppText.muted(size: 13)),
                  ],
                ),
              ),
              Icon(selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: selected ? AppColors.accent : AppColors.line),
            ],
          ),
        ),
      ),
    );
  }
}
