part of 'pro_notifications_bloc.dart';

sealed class ProNotificationsEvent {
  const ProNotificationsEvent();
}

class ProNotificationsLoaded extends ProNotificationsEvent {
  const ProNotificationsLoaded();
}

class ProNotificationsToggled extends ProNotificationsEvent {
  const ProNotificationsToggled({this.arrivals, this.returns});
  final bool? arrivals;
  final bool? returns;
}

class ProNotificationsPushEnabled extends ProNotificationsEvent {
  const ProNotificationsPushEnabled();
}
