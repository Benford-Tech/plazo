import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/router/app_router.dart';
import '../../../shared/theme/theme.dart';
import '../../pro_auth/presentation/bloc/pro_auth_bloc.dart';

/// 19/11/2026: the lime band of the prospects' demo on top of Plazo Pro's tabs, as DemoBanner of the web pro space:
/// « Démo · données fictives · remise à zéro cette nuit » and « Quitter » (signs out, back to the demo's entry). It takes
/// the status bar's room itself: the tab below it is laid out without it.
class ProDemoBanner extends StatelessWidget {
  const ProDemoBanner({super.key});

  void _quit(BuildContext context) {
    context.read<ProAuthBloc>().add(const ProAuthLogoutRequested());
    AutoRouter.maybeOf(context)?.replaceAll([const ProDemoRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      key: const Key('demo-banner'),
      color: AppColors.action,
      child: SafeArea(
        bottom: false,
        child: Semantics(
          liveRegion: true,
          child: Padding(
            padding: const EdgeInsets.only(left: 16, right: 4),
            child: Row(
              children: [
                Text('demo.banner'.tr(), style: AppText.strong(size: 13.5, color: AppColors.onAccent)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '· ${'demo.banner_note'.tr()}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.body(size: 13, color: AppColors.onAccent),
                  ),
                ),
                TextButton(
                  key: const Key('demo-quit'),
                  style: TextButton.styleFrom(minimumSize: const Size(48, 44), foregroundColor: AppColors.onAccent),
                  onPressed: () => _quit(context),
                  child: Text('demo.quit'.tr(), style: AppText.strong(size: 13.5, color: AppColors.onAccent)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
