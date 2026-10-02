import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/notification_preferences_model.dart';

part 'notifications_client.g.dart';

@RestApi()
abstract class NotificationsClient {
  factory NotificationsClient(Dio dio, {String? baseUrl}) = _NotificationsClient;

  @GET('internal/notifications/preferences')
  Future<NotificationPreferencesModel> getPreferences();

  @PATCH('internal/notifications/preferences')
  Future<NotificationPreferencesModel> updatePreferences({@Body() required Map<String, dynamic> body});

  /// This phone's OneSignal subscription id.
  @PUT('internal/notifications/devices')
  Future<void> registerDevice({@Body() required Map<String, dynamic> body});

  @DELETE('internal/notifications/devices/{subscriptionId}')
  Future<void> unregisterDevice({@Path('subscriptionId') required String subscriptionId});
}
