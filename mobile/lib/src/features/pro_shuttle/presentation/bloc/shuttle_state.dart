part of 'shuttle_bloc.dart';

@freezed
abstract class ShuttleState with _$ShuttleState {
  const ShuttleState._();

  const factory ShuttleState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    PickupsModel? pickups,

    /// Arrived travellers waiting for the terminal (drop-off direction).
    DeparturesModel? departures,

    /// F-A: the travellers away by return day, and those back today (the third band).
    StayingModel? staying,

    /// `pickup` (to the airport, default) or `dropoff` (to the terminal).
    @Default('pickup') String direction,

    /// F-A: the band shown; a trip starting opens "En route", its end goes back to the first band.
    @Default(0) int band,
    @Default([]) List<ShuttleVehicleModel> vehicles,

    /// The places the shuttle serves (D-A): the airport first, then the parking's stops.
    @Default([]) List<ShuttleStopModel> stops,

    /// The stop served by the next trip; null: the airport.
    String? stopId,
    /// The driver's running trip (null: none).
    StaffTripModel? trip,
    @Default({}) Set<String> selected,
    TripVehicleChoice? vehicle,
    /// Positions are being watched and sent.
    @Default(false) bool tracking,
    LocationAccess? locationProblem,
    /// The trip just ended (by the driver, the 90 minutes, or elsewhere).
    @Default(false) bool endedNotice,
    /// The latest local position (memory only, never shown on a map here).
    GeoPosition? lastPosition,
    String? errorCode,
    required DateTime now,
  }) = _ShuttleState;

  bool get running => trip?.running ?? false;
  bool get dropoff => direction == 'dropoff';

  /// The driver chooses a stop only when the parking serves more than the airport.
  bool get hasStopChoice => stops.where((s) => !s.builtIn).isNotEmpty;

  /// The stop of the next trip, as shown in the header (null: the airport's meeting point).
  ShuttleStopModel? get chosenStop => stopId == null ? null : stops.where((s) => s.id == stopId).firstOrNull;

  /// Vehicles a trip can start with (the out-of-service ones stay on the sheet only).
  List<ShuttleVehicleModel> get availableVehicles => vehicles.where((v) => v.inService).toList();

  /// Passengers (people) in the current selection, for the seats check.
  int get selectedPassengers {
    var total = 0;
    for (final r in pickups?.rows ?? const <PickupRowModel>[]) {
      if (selected.contains(r.reservationId)) total += r.passengers;
    }
    for (final r in departures?.rows ?? const <DepartureRowModel>[]) {
      if (selected.contains(r.reservationId)) total += r.passengers;
    }
    return total;
  }

  /// The list of the current direction is loaded.
  bool get loaded => dropoff ? departures != null : pickups != null;

  /// R-B: the parking shares its shuttles' position (the list says so before a trip, the trip once it runs).
  bool get sharePosition => trip != null && trip!.running ? trip!.sharePosition : (dropoff ? departures?.sharePosition : pickups?.sharePosition) ?? true;

  /// Departure rows that can be put on a trip to the terminal (the expected ones wait).
  List<DepartureRowModel> get selectableDepartures => (departures?.rows ?? const []).where((r) => r.tripId == null && !r.expected).toList();

  /// F-A: the rows of the first band grouped by stop, soonest leave time first.
  List<TourGroup> get tourGroups {
    if (dropoff) {
      final map = <String, List<DepartureRowModel>>{};
      for (final r in departures?.rows ?? const <DepartureRowModel>[]) {
        map.putIfAbsent(r.stopName ?? '', () => []).add(r);
      }
      final groups = [
        for (final e in map.entries)
          TourGroup(stop: e.key, leaveAt: e.value.map((r) => r.leaveAt).whereType<DateTime>().fold<DateTime?>(null, (a, b) => a == null || b.isBefore(a) ? b : a), departures: e.value),
      ];
      groups.sort((a, b) => (a.leaveAt ?? DateTime(2100)).compareTo(b.leaveAt ?? DateTime(2100)));
      return groups;
    }
    return [for (final g in groups) TourGroup(stop: g.terminal ?? '', leaveAt: g.rows.map((r) => r.leaveAt).whereType<DateTime>().fold<DateTime?>(null, (a, b) => a == null || b.isBefore(a) ? b : a), pickups: g.rows)];
  }

  /// F-A: travellers of the first band (the expected ones included), of the running trip, of the third band.
  int get bandCount1 => dropoff ? (departures?.rows.length ?? 0) : (pickups?.rows.length ?? 0);
  int get bandCount2 => trip?.running ?? false ? trip!.passengers.length : 0;
  int get bandCount3 => dropoff ? (staying?.days.fold<int>(0, (n, d) => n + d.rows.length) ?? 0) : (staying?.returnedToday.length ?? 0);

  MeetingPointModel? get meetingPoint => trip?.meetingPoint ?? pickups?.meetingPoint;

  /// Rows grouped by terminal (the flight's, else the meeting point's label), in the API's order.
  List<({String? terminal, List<PickupRowModel> rows})> get groups {
    final rows = pickups?.rows ?? const [];
    final byTerminal = <String?, List<PickupRowModel>>{};
    for (final r in rows) {
      byTerminal.putIfAbsent(r.terminal, () => []).add(r);
    }
    return [for (final e in byTerminal.entries) (terminal: e.key, rows: e.value)];
  }

  /// Rows that can be put on a trip (not already on a running one).
  List<PickupRowModel> get selectable => (pickups?.rows ?? const []).where((r) => r.tripId == null).toList();

  /// Time left before the automatic end of the trip.
  Duration get remaining {
    final t = trip;
    if (t == null) return Duration.zero;
    final left = t.expiresAt.difference(now);
    return left.isNegative ? Duration.zero : left;
  }
}

/// F-A: one stop of the first band ("Terminal 1 · départ conseillé 10:05") and its travellers.
class TourGroup {
  const TourGroup({required this.stop, this.leaveAt, this.departures = const [], this.pickups = const []});
  final String stop;
  final DateTime? leaveAt;
  final List<DepartureRowModel> departures;
  final List<PickupRowModel> pickups;
}
