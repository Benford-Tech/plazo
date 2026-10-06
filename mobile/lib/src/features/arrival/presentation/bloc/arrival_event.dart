part of 'arrival_bloc.dart';

sealed class ArrivalEvent {
  const ArrivalEvent();
}

class ArrivalOpened extends ArrivalEvent {
  const ArrivalOpened(this.reference);
  final String reference;
}

class ArrivalRefreshRequested extends ArrivalEvent {
  const ArrivalRefreshRequested();
}

/// "Je suis en route — partager ma position". [consent]: the traveller tapped the button after
/// reading what is shared, with whom and for how long.
class ArrivalShareRequested extends ArrivalEvent {
  const ArrivalShareRequested({required this.consent});
  final bool consent;
}

class ArrivalPositionChanged extends ArrivalEvent {
  const ArrivalPositionChanged(this.position);
  final GeoPosition position;
}

class ArrivalAnnounceToggled extends ArrivalEvent {
  const ArrivalAnnounceToggled();
}

/// "J'arrive dans 10 / 20 / 30 min".
class ArrivalAnnounced extends ArrivalEvent {
  const ArrivalAnnounced(this.minutes);
  final int minutes;
}

/// "Je suis au point de rendez-vous", optionally with a one-off position.
class ArrivalAtMeetingPointRequested extends ArrivalEvent {
  const ArrivalAtMeetingPointRequested({this.withPosition = false});
  final bool withPosition;
}

/// E (06/10/2026): the word typed for the parking, sent with the next signal.
class ArrivalNoteChanged extends ArrivalEvent {
  const ArrivalNoteChanged(this.note);
  final String note;
}

class ArrivalStopRequested extends ArrivalEvent {
  const ArrivalStopRequested();
}

class ArrivalTicked extends ArrivalEvent {
  const ArrivalTicked();
}

class ArrivalTrackingFailed extends ArrivalEvent {
  const ArrivalTrackingFailed();
}
