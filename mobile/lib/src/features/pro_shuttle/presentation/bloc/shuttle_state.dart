part of 'shuttle_bloc.dart';

@freezed
abstract class ShuttleState with _$ShuttleState {
  const ShuttleState._();

  const factory ShuttleState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    PickupsModel? pickups,

    /// Travellers waiting for the terminal, or expected soon (drop-off direction).
    DeparturesModel? departures,

    /// 14/10/2026: travellers added by hand (« Embarquer » / « Récupérer » of the planning, the booking's sheet) that
    /// the list does not hold (an early traveller): shown and ticked until the trip starts or they are unticked.
    @Default([]) List<DepartureRowModel> pinnedDepartures,
    @Default([]) List<PickupRowModel> pinnedPickups,

    /// The travellers added by hand that a refused start took out of the selection (their names, shown under the
    /// error): nothing reads their booking again, so they were the likely reason.
    @Default([]) List<String> unpinned,

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

    /// The vehicle of the day the driver holds (V-A), in service: the trip starts in one tap, without the sheet.
    String? dayVehicleId,

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

  /// The departures listed: the API's, then the ones pinned from the planning.
  List<DepartureRowModel> get departureRows => [...?departures?.rows, ...pinnedDepartures];

  /// The returns listed: the API's, then the ones pinned from the planning.
  List<PickupRowModel> get pickupRows => [...?pickups?.rows, ...pinnedPickups];

  /// Passengers (people) in the current selection, for the seats check.
  int get selectedPassengers {
    var total = 0;
    for (final r in pickupRows) {
      if (selected.contains(r.reservationId)) total += r.passengers;
    }
    for (final r in departureRows) {
      if (selected.contains(r.reservationId)) total += r.passengers;
    }
    return total;
  }

  /// « Embarquer et partir » starts at once with the chosen vehicle: the driver holds a vehicle of the day in service.
  bool get oneTapStart => dayVehicleId != null;

  /// The vehicle the next trip starts with, when it is one of the operator's.
  ShuttleVehicleModel? get chosenVehicle => vehicle?.vehicleId == null ? null : vehicles.where((v) => v.id == vehicle!.vehicleId).firstOrNull;

  /// Ticked travellers still expected (to the terminal): the server checks them in when the trip starts.
  List<DepartureRowModel> get selectedNotCheckedIn =>
      dropoff ? departureRows.where((r) => selected.contains(r.reservationId) && r.status == 'upcoming').toList() : const [];

  /// Passengers of the running trip checked in at its boarding: their cars wait for the valet in « À ranger ».
  int get checkedInAtBoarding => trip?.running ?? false ? trip!.passengers.where((p) => p.checkedInAtBoarding).length : 0;

  /// The list of the current direction is loaded.
  bool get loaded => dropoff ? departures != null : pickups != null;

  /// R-B: the parking shares its shuttles' position (the list says so before a trip, the trip once it runs).
  bool get sharePosition => trip != null && trip!.running ? trip!.sharePosition : (dropoff ? departures?.sharePosition : pickups?.sharePosition) ?? true;

  /// Departure rows that can be put on a trip to the terminal: not on another trip, the expected ones included
  /// (14/10/2026: checked in at boarding).
  List<DepartureRowModel> get selectableDepartures => departureRows.where((r) => r.tripId == null).toList();

  /// F-A: the rows of the first band grouped by stop, soonest leave time first.
  List<TourGroup> get tourGroups {
    if (dropoff) {
      final map = <String, List<DepartureRowModel>>{};
      for (final r in departureRows) {
        map.putIfAbsent(r.stopName ?? '', () => []).add(r);
      }
      final groups = [
        for (final e in map.entries)
          TourGroup(
            stop: e.key,
            leaveAt: e.value.map((r) => r.leaveAt).whereType<DateTime>().fold<DateTime?>(null, (a, b) => a == null || b.isBefore(a) ? b : a),
            departures: e.value,
          ),
      ];
      groups.sort((a, b) => (a.leaveAt ?? DateTime(2100)).compareTo(b.leaveAt ?? DateTime(2100)));
      return groups;
    }
    return [
      for (final g in groups)
        TourGroup(
          stop: g.terminal ?? '',
          leaveAt: g.rows.map((r) => r.leaveAt).whereType<DateTime>().fold<DateTime?>(null, (a, b) => a == null || b.isBefore(a) ? b : a),
          pickups: g.rows,
        ),
    ];
  }

  /// B (22/10/2026, « Aller · Retour · En route »): the tab shown, from the side and the band.
  int get tab => band == 1 ? 2 : (dropoff ? 0 : 1);

  /// The counts of the three tabs (null: that list not read yet).
  int? get goCount => departures == null ? null : departureRows.length;
  int? get backCount => pickups == null ? null : pickupRows.length;

  /// The rows ticked on the current side.
  List<({String? stopId, String? stopName})> get _selectedStops => dropoff
      ? [
          for (final r in departureRows)
            if (selected.contains(r.reservationId)) (stopId: r.stopId, stopName: r.stopName),
        ]
      : [
          for (final r in pickupRows)
            if (selected.contains(r.reservationId)) (stopId: r.stopId, stopName: r.stopName),
        ];

  /// Where the ticked travellers go (or wait): each booking's own stop (« Desserte »), the airport when it has none. The
  /// driver no longer picks it (22/10/2026).
  List<String?> get selectedDestinations => _selectedStops.map((s) => s.stopId).toSet().toList();

  /// The trip's stop: the one all the ticked travellers share; none (the airport) for a mix or the airport.
  String? get selectedStopId {
    final ids = selectedDestinations;
    return ids.length == 1 ? ids.single : null;
  }

  /// The name of that single destination (null: the airport, or a mix).
  String? get selectedStopName => selectedStopId == null ? null : _selectedStops.firstWhere((s) => s.stopId == selectedStopId).stopName;

  /// B: the current side's travellers by time slot (15 minutes, from the advised leave time), soonest first; the ones
  /// without a time last.
  List<TourSlot> get slots {
    DateTime? bucket(DateTime? t) => t == null ? null : DateTime(t.year, t.month, t.day, t.hour, t.minute - t.minute % 15);
    final keys = <DateTime?>{};
    final departuresBy = <DateTime?, List<DepartureRowModel>>{};
    final pickupsBy = <DateTime?, List<PickupRowModel>>{};
    if (dropoff) {
      for (final r in departureRows) {
        final k = bucket(r.leaveAt?.toLocal());
        keys.add(k);
        departuresBy.putIfAbsent(k, () => []).add(r);
      }
    } else {
      for (final r in pickupRows) {
        final k = bucket(r.leaveAt?.toLocal());
        keys.add(k);
        pickupsBy.putIfAbsent(k, () => []).add(r);
      }
    }
    final ordered = keys.toList()..sort((a, b) => (a ?? DateTime(2100)).compareTo(b ?? DateTime(2100)));
    DateTime? first(Iterable<DateTime?> times) => times.whereType<DateTime>().fold<DateTime?>(null, (a, b) => a == null || b.isBefore(a) ? b : a);
    return [
      for (final k in ordered)
        TourSlot(
          leaveAt: first([...?departuresBy[k]?.map((r) => r.leaveAt), ...?pickupsBy[k]?.map((r) => r.leaveAt)]),
          departures: departuresBy[k] ?? const [],
          pickups: pickupsBy[k] ?? const [],
        ),
    ];
  }

  /// F-A: travellers of the first band (the expected ones included), of the running trip, of the third band.
  int get bandCount1 => dropoff ? departureRows.length : pickupRows.length;
  int get bandCount2 => trip?.running ?? false ? trip!.passengers.length : 0;

  MeetingPointModel? get meetingPoint => trip?.meetingPoint ?? pickups?.meetingPoint;

  /// Rows grouped by terminal (the flight's, else the meeting point's label), in the API's order.
  List<({String? terminal, List<PickupRowModel> rows})> get groups {
    final rows = pickupRows;
    final byTerminal = <String?, List<PickupRowModel>>{};
    for (final r in rows) {
      byTerminal.putIfAbsent(r.terminal, () => []).add(r);
    }
    return [for (final e in byTerminal.entries) (terminal: e.key, rows: e.value)];
  }

  /// Rows that can be put on a trip (not already on a running one).
  List<PickupRowModel> get selectable => pickupRows.where((r) => r.tripId == null).toList();

  /// Time left before the automatic end of the trip.
  Duration get remaining {
    final t = trip;
    if (t == null) return Duration.zero;
    final left = t.expiresAt.difference(now);
    return left.isNegative ? Duration.zero : left;
  }
}

/// B (22/10/2026): one time slot of « Aller » or « Retour » and its travellers.
class TourSlot {
  const TourSlot({this.leaveAt, this.departures = const [], this.pickups = const []});
  final DateTime? leaveAt;
  final List<DepartureRowModel> departures;
  final List<PickupRowModel> pickups;

  List<String> get ids => [...departures.map((r) => r.reservationId), ...pickups.map((r) => r.reservationId)];
}

/// F-A: one stop of the first band ("Terminal 1 · départ conseillé 10:05") and its travellers.
class TourGroup {
  const TourGroup({required this.stop, this.leaveAt, this.departures = const [], this.pickups = const []});
  final String stop;
  final DateTime? leaveAt;
  final List<DepartureRowModel> departures;
  final List<PickupRowModel> pickups;
}
