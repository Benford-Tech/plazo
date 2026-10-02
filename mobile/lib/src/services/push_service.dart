import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../core/constants/app_constants.dart';

/// Push notifications to the staff's phones (OneSignal, as in LoveNest). Off on the web and when no
/// ONESIGNAL_APP_ID is given at build time.
abstract class PushService {
  bool get supported;

  /// Asks the permission, opts in, and returns this phone's subscription id (null: refused or unavailable).
  Future<String?> enable();

  /// Opts out (logout): this phone stops receiving the operator's notifications.
  Future<void> disable();

  /// Fired when a notification is tapped.
  Stream<Map<String, dynamic>> get opened;
}

class OneSignalPushService implements PushService {
  OneSignalPushService({this._appId = AppConstants.oneSignalAppId});

  final String _appId;
  bool _initialized = false;
  final _opened = StreamController<Map<String, dynamic>>.broadcast();

  @override
  bool get supported => !kIsWeb && _appId.isNotEmpty;

  @override
  Stream<Map<String, dynamic>> get opened => _opened.stream;

  void _init() {
    if (_initialized || !supported) return;
    _initialized = true;
    OneSignal.initialize(_appId);
    OneSignal.Notifications.addClickListener((event) => _opened.add(event.notification.additionalData ?? const {}));
  }

  /// Called at start-up: no permission prompt here (only from the notification settings).
  void initialize() => _init();

  @override
  Future<String?> enable() async {
    if (!supported) return null;
    _init();
    final allowed = await OneSignal.Notifications.requestPermission(true);
    if (!allowed) return null;
    await OneSignal.User.pushSubscription.optIn();
    final now = OneSignal.User.pushSubscription.id;
    if (now != null && now.isNotEmpty) return now;
    // The id arrives once the subscription is created on OneSignal's side.
    final completer = Completer<String?>();
    void observer(OSPushSubscriptionChangedState state) {
      final id = state.current.id;
      if (id != null && id.isNotEmpty && !completer.isCompleted) completer.complete(id);
    }

    OneSignal.User.pushSubscription.addObserver(observer);
    try {
      return await completer.future.timeout(const Duration(seconds: 10), onTimeout: () => null);
    } finally {
      OneSignal.User.pushSubscription.removeObserver(observer);
    }
  }

  @override
  Future<void> disable() async {
    if (!supported || !_initialized) return;
    await OneSignal.User.pushSubscription.optOut();
  }
}
