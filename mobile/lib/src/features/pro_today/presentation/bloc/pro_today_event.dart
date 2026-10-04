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

/// Another day of the planning (YYYY-MM-DD), null for today: reloaded at once.
class ProTodayDateChanged extends ProTodayEvent {
  const ProTodayDateChanged(this.date);
  final String? date;
}

class ProTodayBannerDismissed extends ProTodayEvent {
  const ProTodayBannerDismissed();
}
