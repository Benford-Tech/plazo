import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../data/getting_started_data_source.dart';

const _radius = BorderRadius.all(Radius.circular(12));

/// T-A (26/10/2026, « ajoute un tutoriel pour bien démarrer avec Plazo Pro »): on the dashboard, the setup steps of
/// the post of the day, ticked by the server, with the next ones to do; a tap opens the full list. Nothing while it
/// loads, when it fails, or once everything is in place.
class GettingStartedCard extends StatefulWidget {
  const GettingStartedCard({super.key});

  @override
  State<GettingStartedCard> createState() => _GettingStartedCardState();
}

class _GettingStartedCardState extends State<GettingStartedCard> {
  GettingStartedModel? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!locator.isRegistered<GettingStartedDataSource>()) return;
    try {
      final data = await locator<GettingStartedDataSource>().fetch();
      if (mounted) setState(() => _data = data);
    } catch (_) {
      // The dashboard stays as it is: the card is a guide, not a figure.
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _data;
    if (d == null || d.complete) return const SizedBox.shrink();
    final next = d.steps.where((s) => !s.done).take(2).toList();
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Material(
        key: const Key('getting-started-card'),
        color: AppColors.panel,
        shape: const RoundedRectangleBorder(borderRadius: _radius, side: BorderSide(color: AppColors.action, width: 2)),
        child: InkWell(
          borderRadius: _radius,
          onTap: () async {
            await context.router.push(const ProGettingStartedRoute());
            await _load();
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(color: AppColors.action, borderRadius: BorderRadius.all(Radius.circular(10))),
                      child: const Icon(Icons.rocket_launch_rounded, color: Color(0xFF0F2A14), size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('getting_started.title'.tr(), style: AppText.strong(size: 16)),
                          Text('getting_started.progress'.tr(args: ['${d.done}', '${d.total}']), style: AppText.tabular(size: 12, weight: 500, color: AppColors.muted)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(99)),
                  child: LinearProgressIndicator(
                    value: d.total == 0 ? 0 : d.done / d.total,
                    minHeight: 6,
                    backgroundColor: AppColors.panelLine,
                    valueColor: const AlwaysStoppedAnimation(AppColors.action),
                  ),
                ),
                for (final step in next) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.radio_button_unchecked, size: 18, color: AppColors.muted),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'getting_started.steps.${step.key}.title'.tr(),
                          style: AppText.body(size: 14, weight: 600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
