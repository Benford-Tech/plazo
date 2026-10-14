import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../data/models/shuttle_models.dart';

/// « Embarquer en un geste » (14/10/2026): a traveller still expected (status upcoming) whose arrival is this close to
/// now may board a trip to the terminal; the server checks them in when the trip starts (and stays the authority).
const boardingCheckInHours = 24;

/// Whether an expected traveller arriving at [arrivalAt] may board a trip to the terminal now.
bool boardableUpcoming(DateTime arrivalAt, DateTime now) => arrivalAt.difference(now).abs() <= const Duration(hours: boardingCheckInHours);

/// A traveller to add to the next trip: « Embarquer » / « Récupérer » on the driver's planning, or the booking's sheet.
/// The row stands in for them while the Navette list does not hold them (an early traveller, a late return).
class ShuttleBoarding {
  ShuttleBoarding.dropoff(DepartureRowModel this.departure) : direction = 'dropoff', reservationId = departure.reservationId, pickup = null;
  ShuttleBoarding.pickup(PickupRowModel this.pickup) : direction = 'pickup', reservationId = pickup.reservationId, departure = null;

  /// Only the traveller: selected when the list offers them, nothing pinned otherwise.
  const ShuttleBoarding.only({required this.direction, required this.reservationId}) : departure = null, pickup = null;

  final String direction;
  final String reservationId;
  final DepartureRowModel? departure;
  final PickupRowModel? pickup;
}

/// Hands the driver's planning tabs (Arrivées, Retours) over to the Navette tab's list, a sibling of theirs: the request
/// goes to the list that listens, or waits for the next one to open. Also tells the planning who rides a running trip,
/// as far as the Navette list knows, so that « Embarquer » is not offered for them, nor for anyone while the driver's own
/// trip runs (a second one cannot start).
class ShuttleBoardingRequests {
  final _requests = StreamController<ShuttleBoarding>.broadcast();
  ShuttleBoarding? _pending;

  /// Reservation ids on a running trip (the driver's own, and the rows of the lists marked with a trip).
  final onTrip = ValueNotifier<Set<String>>(const {});

  /// The driver's own trip runs, as far as the Navette list knows.
  final running = ValueNotifier<bool>(false);

  Stream<ShuttleBoarding> get stream => _requests.stream;

  void request(ShuttleBoarding boarding) {
    if (_requests.hasListener) {
      _requests.add(boarding);
    } else {
      _pending = boarding;
    }
  }

  /// The request made while no Navette list listened, once.
  ShuttleBoarding? take() {
    final pending = _pending;
    _pending = null;
    return pending;
  }

  void tripsChanged(Set<String> ids, {bool running = false}) {
    if (!setEquals(ids, onTrip.value)) onTrip.value = ids;
    this.running.value = running;
  }
}
