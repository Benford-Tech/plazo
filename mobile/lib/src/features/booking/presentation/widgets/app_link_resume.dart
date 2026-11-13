import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../di/locator.dart';
import '../../../../shared/theme/theme.dart';
import '../../../../shared/widgets/gradient_button.dart';
import '../../data/datasources/app_link_data_source.dart';
import '../../data/datasources/booking_data_source.dart';

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
    final token = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => _ResumeSheet(target: target),
    );
    if (token != null && token.isNotEmpty) await router.push(MyBookingRoute(reference: target.reference, token: token));
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

/// « Retrouvée pour vous ». Pops the booking's key to open it, null for « Ce n'est pas moi ». When the phone was only
/// recognised by its address (12/11/2026: many phones share one, on a carrier or an airport's Wi-Fi), the booking's
/// e-mail or phone is asked first and checked by the lookup.
class _ResumeSheet extends StatefulWidget {
  const _ResumeSheet({required this.target});

  final AppLinkTarget target;

  @override
  State<_ResumeSheet> createState() => _ResumeSheetState();
}

class _ResumeSheetState extends State<_ResumeSheet> {
  final _contact = TextEditingController();
  bool _busy = false;
  String? _error;

  AppLinkTarget get target => widget.target;

  @override
  void dispose() {
    _contact.dispose();
    super.dispose();
  }

  String get _when {
    final at = target.arrivalAt;
    if (at.length < 16) return at;
    final date = DateTime.tryParse(at);
    if (date == null) return at;
    return '${DateFormat('EEE d MMM', appLocale).format(date)} · ${at.substring(11, 16)}';
  }

  Future<void> _open() async {
    final known = target.manageToken;
    if (known != null) return Navigator.of(context).pop(known);
    final contact = _contact.text.trim();
    if (contact.isEmpty) return setState(() => _error = 'app_link.contact_required'.tr());
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final access = await locator<BookingDataSource>().lookup(reference: target.reference, contact: contact);
      if (mounted) Navigator.of(context).pop(access.manageToken);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'app_link.contact_wrong'.tr();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom + MediaQuery.viewInsetsOf(context).bottom;
    final ask = target.manageToken == null;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('app_link.found_title'.tr(), key: const Key('app-link-found'), style: AppText.title(size: 22)),
            const SizedBox(height: 6),
            Text(
              ask
                  ? 'app_link.found_text_check'.tr()
                  : target.firstName.isEmpty
                  ? 'app_link.found_text'.tr()
                  : 'app_link.found_text_named'.tr(args: [target.firstName]),
              style: AppText.muted(size: 14.5),
            ),
            const SizedBox(height: 14),
            Text(target.reference, style: AppText.tabular(size: 18)),
            const SizedBox(height: 2),
            Text('${target.parkingTitle} · $_when', style: AppText.body(size: 14.5)),
            if (ask) ...[
              const SizedBox(height: 14),
              TextField(
                key: const Key('app-link-contact'),
                controller: _contact,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: InputDecoration(labelText: 'app_link.contact'.tr(), errorText: _error),
                onSubmitted: (_) => _open(),
              ),
            ],
            const SizedBox(height: 18),
            GradientButton(key: const Key('app-link-open'), label: 'app_link.open'.tr(), onPressed: _busy ? null : _open),
            const SizedBox(height: 8),
            OutlineAction(label: 'app_link.not_me'.tr(), onPressed: () => Navigator.of(context).pop()),
          ],
        ),
      ),
    );
  }
}
