part of 'pro_notifications_bloc.dart';

sealed class ProNotificationsEvent {
  const ProNotificationsEvent();
}

class ProNotificationsLoaded extends ProNotificationsEvent {
  const ProNotificationsLoaded();
}

class ProNotificationsToggled extends ProNotificationsEvent {
  const ProNotificationsToggled({this.arrivals, this.returns, this.shuttles});
  final bool? arrivals;
  final bool? returns;
  final bool? shuttles;
}

class ProNotificationsPushEnabled extends ProNotificationsEvent {
  const ProNotificationsPushEnabled();
}
