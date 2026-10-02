part of 'pro_today_bloc.dart';

sealed class ProTodayEvent {
  const ProTodayEvent();
}

class ProTodayStarted extends ProTodayEvent {
  const ProTodayStarted();
}

/// [full]: reload the planning too (pull to refresh).
class ProTodayPolled extends ProTodayEvent {
  const ProTodayPolled({this.full = false});
  final bool full;
}

class ProTodayBannerDismissed extends ProTodayEvent {
  const ProTodayBannerDismissed();
}
