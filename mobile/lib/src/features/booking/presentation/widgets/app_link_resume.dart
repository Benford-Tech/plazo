import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/app_link_data_source.dart';

/// « Lien court Plazo » (direction B, 27/10/2026): at the app's first launch, asks the API once whether this phone left
/// the short link's page for the store; if so, the booking is offered (« Retrouvée pour vous ») and opens with its
/// token saved. Never again afterwards (a flag on the phone), never in Plazo Pro.
class AppLinkResumeGate extends StatefulWidget {
  const AppLinkResumeGate({super.key, required this.child});

  final Widget child;

  /// Off in the widget tests (no network, no sheet over the screen under test).
  static bool enabled = true;

  static const prefsKey = 'app_link.resume_checked';

  @override
  State<AppLinkResumeGate> createState() => _AppLinkResumeGateState();
}

class _AppLinkResumeGateState extends State<AppLinkResumeGate> {
  @override
  void initState() {
    super.initState();
    if (AppLinkResumeGate.enabled && !AppConstants.isPro) WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  Future<void> _check() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(AppLinkResumeGate.prefsKey) ?? false) return;
      await prefs.setBool(AppLinkResumeGate.prefsKey, true);
      if (!locator.isRegistered<AppLinkDataSource>()) return;
      final target = await locator<AppLinkDataSource>().resume();
      if (target == null || !mounted) return;
      await _offer(target);
    } catch (_) {
      // Nothing waited for this phone, or no network: the app opens as usual.
    }
  }

  Future<void> _offer(AppLinkTarget target) async {
    final router = context.router;
    final open = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => _ResumeSheet(target: target),
    );
    if (open == true) await router.push(MyBookingRoute(reference: target.reference, token: target.manageToken));
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _ResumeSheet extends StatelessWidget {
  const _ResumeSheet({required this.target});

  final AppLinkTarget target;

  String get _when {
    final at = target.arrivalAt;
    if (at.length < 16) return at;
    final date = DateTime.tryParse(at);
    if (date == null) return at;
    return '${DateFormat('EEE d MMM', 'fr_FR').format(date)} · ${at.substring(11, 16)}';
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('app_link.found_title'.tr(), key: const Key('app-link-found'), style: AppText.title(size: 22)),
          const SizedBox(height: 6),
          Text(
            target.firstName.isEmpty ? 'app_link.found_text'.tr() : 'app_link.found_text_named'.tr(args: [target.firstName]),
            style: AppText.muted(size: 14.5),
          ),
          const SizedBox(height: 14),
          Text(target.reference, style: AppText.tabular(size: 18)),
          const SizedBox(height: 2),
          Text('${target.parkingTitle} · $_when', style: AppText.body(size: 14.5)),
          const SizedBox(height: 18),
          GradientButton(label: 'app_link.open'.tr(), onPressed: () => Navigator.of(context).pop(true)),
          const SizedBox(height: 8),
          OutlineAction(label: 'app_link.not_me'.tr(), onPressed: () => Navigator.of(context).pop(false)),
        ],
      ),
    );
  }
}
