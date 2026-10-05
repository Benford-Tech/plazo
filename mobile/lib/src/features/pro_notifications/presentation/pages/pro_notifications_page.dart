import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/enums/view_state.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../bloc/pro_notifications_bloc.dart';

/// Per-person setting: notified of arrivals (drop-offs), returns, or both; and this phone's
/// registration for pushes (OneSignal).
@RoutePage()
class ProNotificationsPage extends StatelessWidget implements AutoRouteWrapper {
  const ProNotificationsPage({super.key});

  @override
  Widget wrappedRoute(BuildContext context) =>
      BlocProvider(create: (_) => locator<ProNotificationsBloc>()..add(const ProNotificationsLoaded()), child: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(title: 'pro.notifications'.tr()),
      body: BlocBuilder<ProNotificationsBloc, ProNotificationsState>(
        builder: (context, state) {
          final prefs = state.preferences;
          final bloc = context.read<ProNotificationsBloc>();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('pro.notifications_intro'.tr(), style: AppText.muted()),
              const SizedBox(height: 14),
              if (prefs == null && state.viewState.isProcessing) const Center(child: CircularProgressIndicator(color: AppColors.accent)),
              if (prefs != null)
                AppCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      SwitchListTile(
                        key: const Key('notify-arrivals'),
                        value: prefs.arrivals,
                        title: Text('pro.notify_arrivals'.tr(), style: AppText.strong()),
                        subtitle: Text('pro.notify_arrivals_help'.tr(), style: AppText.muted()),
                        onChanged: (v) => bloc.add(ProNotificationsToggled(arrivals: v)),
                      ),
                      const Divider(height: 1, color: AppColors.line),
                      SwitchListTile(
                        key: const Key('notify-returns'),
                        value: prefs.returns,
                        title: Text('pro.notify_returns'.tr(), style: AppText.strong()),
                        subtitle: Text('pro.notify_returns_help'.tr(), style: AppText.muted()),
                        onChanged: (v) => bloc.add(ProNotificationsToggled(returns: v)),
                      ),
                      const Divider(height: 1, color: AppColors.line),
                      SwitchListTile(
                        key: const Key('notify-shuttles'),
                        value: prefs.shuttles,
                        title: Text('pro.notify_shuttles'.tr(), style: AppText.strong()),
                        subtitle: Text('pro.notify_shuttles_help'.tr(), style: AppText.muted()),
                        onChanged: (v) => bloc.add(ProNotificationsToggled(shuttles: v)),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              if (!state.pushSupported)
                AppCard(color: AppColors.canvas, child: Text('pro.push_unsupported'.tr(), style: AppText.muted()))
              else if (state.pushState.isSuccess)
                AppCard(color: AppColors.canvas, child: Text('pro.push_enabled'.tr(), style: AppText.body(size: 14)))
              else
                GradientButton(
                  label: 'pro.enable_push'.tr(),
                  icon: Icons.notifications_active_rounded,
                  busy: state.pushState.isProcessing,
                  onPressed: () => bloc.add(const ProNotificationsPushEnabled()),
                ),
              if (prefs != null) ...[
                const SizedBox(height: 10),
                Text('pro.devices'.tr(args: ['${prefs.devices}']), style: AppText.muted(size: 12.5)),
              ],
              if (state.errorMessage != null) ...[
                const SizedBox(height: 10),
                Text(state.errorMessage!, style: AppText.body(size: 14, color: AppColors.danger)),
              ],
            ],
          );
        },
      ),
    );
  }
}
