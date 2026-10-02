import 'package:flutter/foundation.dart';

import '../../../../core/error/exceptions.dart';
import '../../../../services/push_service.dart';
import '../client/notifications_client.dart';
import '../models/notification_preferences_model.dart';

abstract class NotificationsDataSource {
  bool get pushSupported;
  Future<NotificationPreferencesModel> getPreferences();
  Future<NotificationPreferencesModel> updatePreferences({bool? arrivals, bool? returns});

  /// Asks the permission, then registers this phone with the API. Returns the subscription id.
  Future<String> enablePush();
}

class NotificationsDataSourceImpl implements NotificationsDataSource {
  NotificationsDataSourceImpl(this.client, this.push);

  final NotificationsClient client;
  final PushService push;

  @override
  bool get pushSupported => push.supported;

  @override
  Future<NotificationPreferencesModel> getPreferences() => client.getPreferences();

  @override
  Future<NotificationPreferencesModel> updatePreferences({bool? arrivals, bool? returns}) =>
      client.updatePreferences(body: {'arrivals': ?arrivals, 'returns': ?returns});

  @override
  Future<String> enablePush() async {
    if (!push.supported) throw const ServerException(code: 'push_unavailable');
    final id = await push.enable();
    if (id == null) throw const ServerException(code: 'push_denied');
    await client.registerDevice(
      body: {'subscriptionId': id, 'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android'},
    );
    return id;
  }
}
