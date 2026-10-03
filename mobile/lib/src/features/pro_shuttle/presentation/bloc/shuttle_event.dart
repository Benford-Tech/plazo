part of 'shuttle_bloc.dart';

sealed class ShuttleEvent {
  const ShuttleEvent();
}

class ShuttleStarted extends ShuttleEvent {
  const ShuttleStarted();
}

class ShuttlePolled extends ShuttleEvent {
  const ShuttlePolled();
}

/// Select / deselect a traveller for the next trip.
class ShuttlePassengerToggled extends ShuttleEvent {
  const ShuttlePassengerToggled(this.reservationId);
  final String reservationId;
}

class ShuttleVehicleChosen extends ShuttleEvent {
  const ShuttleVehicleChosen(this.vehicle);
  final TripVehicleChoice vehicle;
}

/// "Démarrer le trajet (N clients)", after the vehicle sheet.
class ShuttleStartRequested extends ShuttleEvent {
  const ShuttleStartRequested();
}

class ShuttlePositionChanged extends ShuttleEvent {
  const ShuttlePositionChanged(this.position);
  final GeoPosition position;
}

/// "Clients récupérés · retour parking".
class ShuttleEndRequested extends ShuttleEvent {
  const ShuttleEndRequested();
}

class ShuttleTicked extends ShuttleEvent {
  const ShuttleTicked();
}

class ShuttleTrackingFailed extends ShuttleEvent {
  const ShuttleTrackingFailed();
}

class ShuttleErrorDismissed extends ShuttleEvent {
  const ShuttleErrorDismissed();
}
