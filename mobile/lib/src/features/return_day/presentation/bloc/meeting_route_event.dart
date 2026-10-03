part of 'meeting_route_bloc.dart';

sealed class MeetingRouteEvent {
  const MeetingRouteEvent();
}

class MeetingRouteOpened extends MeetingRouteEvent {
  const MeetingRouteOpened(this.reference);
  final String reference;
}

/// "Je suis arrivé au point de rendez-vous".
class MeetingRouteArrived extends MeetingRouteEvent {
  const MeetingRouteArrived();
}
