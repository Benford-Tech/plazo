part of 'shuttle_bloc.dart';

sealed class ShuttleEvent {
  const ShuttleEvent();
}

class ShuttleStarted extends ShuttleEvent {
  /// The signed-in driver: the vehicle taken for the day (V-A), else their usual one, is preselected.
  /// `direction` and `reservationId` (C-B, 06/10/2026): opened from a booking's sheet with "Déposer au
  /// terminal" / "Récupérer à l'aéroport", that side and that traveller are preselected; `boarding` (14/10/2026,
  /// « Embarquer ») also brings the row that stands in for them when the list does not hold them.
  const ShuttleStarted({this.staffId, this.vehicleId, this.direction, this.reservationId, this.boarding});
  final String? staffId;
  final String? vehicleId;
  final String? direction;
  final String? reservationId;
  final ShuttleBoarding? boarding;
}

/// « Embarquer » / « Récupérer » from the driver's planning (14/10/2026): that side, the first band, and the traveller
/// added to the selection (the rest kept).
class ShuttleBoardRequested extends ShuttleEvent {
  const ShuttleBoardRequested(this.boarding);
  final ShuttleBoarding boarding;
}

/// The stop served by the next trip (D-A): a stop's id, or null for the airport.
class ShuttleStopChanged extends ShuttleEvent {
  const ShuttleStopChanged(this.stopId);
  final String? stopId;
}

/// "Retours · aéroport" / "Départs · terminal" (T-A "Deux sens").
class ShuttleDirectionChanged extends ShuttleEvent {
  const ShuttleDirectionChanged(this.direction);
  final String direction;
}

/// F-A: the band shown (0 "À emmener / À récupérer", 1 "En route", 2 "En séjour / Rendus").
class ShuttleBandChanged extends ShuttleEvent {
  const ShuttleBandChanged(this.band);
  final int band;
}

class ShuttlePolled extends ShuttleEvent {
  const ShuttlePolled();
}

/// Select / deselect a traveller for the next trip.
class ShuttlePassengerToggled extends ShuttleEvent {
  const ShuttlePassengerToggled(this.reservationId);
  final String reservationId;
}

/// "Démarrer ce trajet" on a wave (V-A): its direction, stop and travellers are taken over.
class ShuttleWaveChosen extends ShuttleEvent {
  const ShuttleWaveChosen({required this.direction, this.stopId, required this.reservationIds});
  final String direction;
  final String? stopId;
  final List<String> reservationIds;
}

/// The driver took (or gave back) a vehicle for the day while this list was open (Plus › Mon véhicule).
class ShuttleDayVehicleChanged extends ShuttleEvent {
  const ShuttleDayVehicleChanged(this.vehicleId);
  final String? vehicleId;
}

class ShuttleVehicleChosen extends ShuttleEvent {
  const ShuttleVehicleChosen(this.vehicle);
  final TripVehicleChoice vehicle;
}

/// "Embarquer et partir · N clients": at once with the vehicle of the day, else after the vehicle sheet.
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
