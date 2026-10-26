import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/tutorials/tutorial_catalog.dart';
import '../../../../shared/tutorials/tutorial_service.dart';
import '../../../../shared/tutorials/welcome_carousel.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../data/getting_started_data_source.dart';

/// T-A (26/10/2026): « Bien démarrer avec Plazo Pro », the setup steps of the post of the day, each ticked by the
/// server and leading to where it is set up in the app (or telling it is done on the web), plus the guided tour
/// (T-B, the `pro.start` carousel). Also under Plus › « Bien démarrer ».
@RoutePage()
class ProGettingStartedPage extends StatefulWidget {
  const ProGettingStartedPage({super.key});

  @override
  State<ProGettingStartedPage> createState() => _ProGettingStartedPageState();
}

class _ProGettingStartedPageState extends State<ProGettingStartedPage> {
  GettingStartedModel? _data;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<GettingStartedDataSource>()) return;
    try {
      final data = await locator<GettingStartedDataSource>().fetch();
      if (mounted) {
        setState(() {
          _data = data;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'getting_started.error'.tr());
    }
  }

  Future<void> _tour() async {
    final service = TutorialService.instance;
    service.busy = true;
    try {
      await WelcomeCarousel.show(context, Tutorials.proStart);
    } finally {
      service.busy = false;
    }
    await service.markSeen(Tutorials.proStart.id);
  }

  /// Where a step is set up in Plazo Pro; null when it is done on the web (the inbox, the listing, the contract, the SMS)
  /// or by the manager (the shuttle tracking).
  PageRouteInfo? _routeOf(String key) => switch (key) {
    'team' => const ProTeamRoute(),
    'shuttles' || 'vehicle' => const ProVehiclesRoute(),
    'parking' => const ProParkingSettingsRoute(),
    'post' => const ProPostRoute(),
    'notifications' => const ProNotificationsRoute(),
    'plan' => const ProPlanRoute(),
    'reservations' => const ProReservationsRoute(),
    _ => null,
  };

  @override
  Widget build(BuildContext context) {
    final d = _data;
    return Scaffold(
      appBar: BrandAppBar(pro: true, title: 'getting_started.title'.tr()),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('getting_started.intro'.tr(), style: AppText.body(size: 14.5, height: 1.4)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 48,
                    child: FilledButton.icon(
                      key: const Key('getting-started-tour'),
                      onPressed: _tour,
                      icon: const Icon(Icons.play_circle_outline_rounded),
                      label: Text('getting_started.tour'.tr()),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_error != null) Text(_error!, style: AppText.body(color: AppColors.bad)),
            if (d != null) ...[
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 6),
                child: Text(
                  (d.complete ? 'getting_started.all_done'.tr() : 'getting_started.progress'.tr(args: ['${d.done}', '${d.total}'])).toUpperCase(),
                  style: AppText.label(size: 12),
                ),
              ),
              for (final step in d.steps) _StepTile(step: step, route: _routeOf(step.key), onBack: _load),
            ],
          ],
        ),
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  const _StepTile({required this.step, required this.route, required this.onBack});
  final GettingStartedStep step;
  final PageRouteInfo? route;
  final Future<void> Function() onBack;

  @override
  Widget build(BuildContext context) {
    final title = 'getting_started.steps.${step.key}.title'.tr();
    final body = step.detail ?? 'getting_started.steps.${step.key}.body'.tr();
    final onWeb = route == null && !step.done;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        key: Key('getting-started-${step.key}'),
        color: AppColors.panel,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12)), side: BorderSide(color: AppColors.panelLine)),
        child: InkWell(
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          onTap: route == null || step.done
              ? null
              : () async {
                  await context.router.push(route!);
                  await onBack();
                },
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 26,
                  height: 26,
                  margin: const EdgeInsets.only(top: 1),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: step.done ? AppColors.ok : AppColors.panel,
                    border: step.done ? null : Border.all(color: AppColors.panelLine),
                  ),
                  child: step.done ? const Icon(Icons.check_rounded, size: 16, color: Colors.white) : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppText.body(size: 15, weight: 600, color: step.done ? AppColors.muted : AppColors.ink).copyWith(
                          decoration: step.done ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(body, style: AppText.muted(size: 13)),
                      if (onWeb) ...[
                        const SizedBox(height: 4),
                        Text('getting_started.on_web'.tr(), style: AppText.label(size: 11.5, color: AppColors.accentDeep)),
                      ],
                    ],
                  ),
                ),
                if (route != null && !step.done) const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
