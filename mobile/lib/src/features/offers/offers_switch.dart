import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../di/locator.dart';
import '../../services/push_service.dart';
import '../../shared/theme/theme.dart';
import 'offers_data_source.dart';

/// « Offres et bons plans » (13/11/2026, direction A): off by default. Turning it on asks the push permission, then
/// tells the server this phone wants the promotions; turning it off keeps the booking's pushes.
class OffersSwitch extends StatefulWidget {
  const OffersSwitch({super.key});

  @override
  State<OffersSwitch> createState() => _OffersSwitchState();
}

class _OffersSwitchState extends State<OffersSwitch> {
  bool _on = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    unawaited(_restore());
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getBool(offersPrefsKey) ?? false;
      if (mounted && !_busy) setState(() => _on = saved);
    } catch (_) {}
  }

  void _say(String key) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(key.tr())));
  }

  Future<void> _remember(bool value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(offersPrefsKey, value);
    } catch (_) {}
  }

  Future<void> _toggle(bool wanted) async {
    if (_busy) return;
    final push = locator<PushService>();
    final before = _on;
    setState(() {
      _busy = true;
      _on = wanted;
    });
    try {
      String? id;
      if (wanted) {
        if (!push.supported) {
          setState(() => _on = false);
          _say('more.offers_web');
          return;
        }
        id = await push.enable();
        if (id == null) {
          setState(() => _on = false);
          _say('more.offers_settings');
          return;
        }
      } else {
        id = await push.currentId();
      }
      if (id == null) {
        // Turning off a phone that never had a subscription: nothing to tell the server.
        await _remember(false);
        return;
      }
      final answer = await locator<OffersDataSource>().put(id, offers: wanted, platform: wanted ? appDevicePlatform() : null);
      if (mounted) setState(() => _on = answer.offers);
      await _remember(answer.offers);
    } catch (_) {
      if (mounted) setState(() => _on = before);
      _say('more.offers_failed');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => SwitchListTile(
    key: const Key('offers-switch'),
    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
    secondary: const Icon(Icons.local_offer_outlined, color: AppColors.accent),
    title: Text('more.offers'.tr(), style: AppText.body(size: 15.5, weight: 500)),
    subtitle: Text('more.offers_text'.tr(), style: AppText.muted(size: 13)),
    value: _on,
    onChanged: _busy ? null : _toggle,
  );
}
