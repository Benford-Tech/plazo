part of 'pro_notifications_bloc.dart';

sealed class ProNotificationsEvent {
  const ProNotificationsEvent();
}

class ProNotificationsLoaded extends ProNotificationsEvent {
  const ProNotificationsLoaded();
}

class ProNotificationsToggled extends ProNotificationsEvent {
  const ProNotificationsToggled({this.arrivals, this.returns, this.shuttles, this.platform, this.bookings});
  final bool? arrivals;
  final bool? returns;
  final bool? shuttles;
  final bool? platform;

  /// 'immediate' | 'hourly' | 'never' (N-A, 08/10/2026).
  final String? bookings;
}

class ProNotificationsPushEnabled extends ProNotificationsEvent {
  const ProNotificationsPushEnabled();
}
