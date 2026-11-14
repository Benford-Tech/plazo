import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../di/locator.dart';
import '../../services/push_service.dart';

/// « Offres et bons plans » (13/11/2026, direction A): what the server keeps for this phone.
class AppDeviceOffers {
  const AppDeviceOffers({required this.offers, this.offersAt});

  factory AppDeviceOffers.fromJson(Map<String, dynamic> json) =>
      AppDeviceOffers(offers: json['offers'] == true, offersAt: DateTime.tryParse(json['offersAt'] as String? ?? ''));

  final bool offers;
  final DateTime? offersAt;
}

abstract class OffersDataSource {
  /// PUT /public/app-devices/:subscriptionId: `offers` absent = unchanged, `platform` tells the server which phone it is.
  Future<AppDeviceOffers> put(String subscriptionId, {bool? offers, String? platform});
}

class OffersDataSourceImpl implements OffersDataSource {
  OffersDataSourceImpl(this._dio);
  final Dio _dio;

  @override
  Future<AppDeviceOffers> put(String subscriptionId, {bool? offers, String? platform}) async {
    final res = await _dio.put<Map<String, dynamic>>(
      'public/app-devices/${Uri.encodeComponent(subscriptionId)}',
      data: {'offers': ?offers, 'platform': ?platform},
    );
    return AppDeviceOffers.fromJson(res.data ?? const {});
  }
}

/// The phone's platform as the server knows it, null on the web.
String? appDevicePlatform() {
  if (kIsWeb) return null;
  return switch (defaultTargetPlatform) {
    TargetPlatform.iOS => 'ios',
    TargetPlatform.android => 'android',
    _ => null,
  };
}

/// Local copy of the switch, shown at once (the server's answer is the truth once it comes back).
const offersPrefsKey = 'offers.enabled';

/// Once per launch of Plazo (never Plazo Pro), tells the server this phone is still there (lastSeenAt), only when it
/// already has a push subscription: no permission is asked. Never blocks the start, errors ignored.
class AppDevicePing {
  /// Off in the widget tests (setUpLocalizedTests).
  static bool enabled = true;
  static bool _done = false;

  static Future<void> run() async {
    if (!enabled || _done || AppConstants.isPro) return;
    _done = true;
    try {
      final id = await locator<PushService>().currentId();
      if (id == null) return;
      final answer = await locator<OffersDataSource>().put(id, platform: appDevicePlatform());
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(offersPrefsKey, answer.offers);
    } catch (_) {
      // Never in the way of the start.
    }
  }
}
