part of 'shuttle_bloc.dart';

@freezed
abstract class ShuttleState with _$ShuttleState {
  const ShuttleState._();

  const factory ShuttleState({
    @Default(ViewState.idle) ViewState viewState,
    @Default(ViewState.idle) ViewState actionState,
    PickupsModel? pickups,
    @Default([]) List<ShuttleVehicleModel> vehicles,
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
