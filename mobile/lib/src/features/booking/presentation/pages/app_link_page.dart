import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/brand_header.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/app_link_data_source.dart';

/// « Lien court Plazo » (direction B, 27/10/2026): `https://www.plazo.fr/a/REF-code` (or `plazo://a/code`) opened in
/// the app. The code is resolved by the API, then the booking opens with its manage token saved on this phone.
@RoutePage()
class AppLinkPage extends StatefulWidget {
  const AppLinkPage({super.key, @PathParam('code') required this.code});

  final String code;

  @override
  State<AppLinkPage> createState() => _AppLinkPageState();
}

class _AppLinkPageState extends State<AppLinkPage> {
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _open();
  }

  Future<void> _open() async {
    try {
      final target = await locator<AppLinkDataSource>().resolve(widget.code);
      if (!mounted) return;
      await context.router.replace(MyBookingRoute(reference: target.reference, token: target.manageToken));
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: BrandAppBar(title: 'trips.title'.tr()),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: _failed
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('app_link.invalid_title'.tr(), key: const Key('app-link-invalid'), style: AppText.title(size: 24)),
                  const SizedBox(height: 8),
                  Text('app_link.invalid_text'.tr(), style: AppText.muted(size: 14.5)),
                  const SizedBox(height: 20),
                  GradientButton(label: 'app_link.find'.tr(), onPressed: () => context.router.replaceAll([const AppShellRoute()])),
                ],
              )
            : const Center(child: CircularProgressIndicator(color: AppColors.accent)),
      ),
    );
  }
}
