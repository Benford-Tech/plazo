import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../arrival/data/models/arrival_model.dart';
import '../../../return_day/data/models/return_model.dart';

part 'shuttle_models.freezed.dart';
part 'shuttle_models.g.dart';

/// A return to pick up at the airport, as the driver sees it (GET /internal/shuttle/pickups).
@freezed
abstract class PickupRowModel with _$PickupRowModel {
  const PickupRowModel._();

  const factory PickupRowModel({
    required String reservationId,
    required String reference,
    required String customerName,
    required int passengers,
    required String plate,
    required String status,
    required DateTime returnAt,
    @Default(FlightViewModel()) FlightViewModel flight,
    String? terminal,

    /// The stop serving this traveller (D-A); null: the airport.
    String? stopId,
    String? stopName,
    DateTime? atMeetingPointAt,
    /// The running trip this traveller is on, if any.
    String? tripId,

    /// E (06/10/2026): what the traveller signalled today ("mon vol a du retard", "bagage perdu").
    PickupNoticeModel? notice,

    /// F-A: when the shuttle should leave the parking to be at the meeting point in time.
    DateTime? leaveAt,
  }) = _PickupRowModel;

  factory PickupRowModel.fromJson(Map<String, dynamic> json) => _$PickupRowModelFromJson(json);

  bool get atMeetingPoint => atMeetingPointAt != null;
}

@freezed
abstract class PickupsModel with _$PickupsModel {
  const factory PickupsModel({required DateTime serverTime, MeetingPointModel? meetingPoint, @Default([]) List<PickupRowModel> rows}) = _PickupsModel;

  factory PickupsModel.fromJson(Map<String, dynamic> json) => _$PickupsModelFromJson(json);
}

/// One of the operator's shuttles (GET /internal/shuttle/vehicles): the sheet (V-A, 04/10/2026).
@freezed
abstract class ShuttleVehicleModel with _$ShuttleVehicleModel {
  const ShuttleVehicleModel._();

  const factory ShuttleVehicleModel({
    required String id,
    required String model,
    String? colour,
    String? plate,

    /// Passenger seats, the driver's excluded (null: unknown).
    int? seats,
    @Default(true) bool inService,

    /// The usual driver, preselected in their app.
    String? driverId,
    String? driverName,

    /// Who took it today (V-A), null when free.
    String? holderId,
    String? holderName,
  }) = _ShuttleVehicleModel;

  factory ShuttleVehicleModel.fromJson(Map<String, dynamic> json) => _$ShuttleVehicleModelFromJson(json);

  /// "Mercedes Vito · blanche".
  String get title => [model, colour].whereType<String>().join(' · ');
}

/// An arrived traveller waiting at the parking for the shuttle to the terminal (GET /internal/shuttle/departures).
@freezed
abstract class DepartureRowModel with _$DepartureRowModel {
  const factory DepartureRowModel({
    required String reservationId,
    required String reference,
    required String customerName,
    required int passengers,
    required String plate,
    required String status,
    required DateTime arrivalAt,
    DateTime? arrivedAt,

    /// Spot code, when the vehicle was placed.
    String? spot,
    String? stopId,
    String? stopName,
    String? tripId,

    /// F-A: when the shuttle should leave for the terminal; `expected`: still to come (greyed).
    DateTime? leaveAt,
    @Default(false) bool expected,
  }) = _DepartureRowModel;

  factory DepartureRowModel.fromJson(Map<String, dynamic> json) => _$DepartureRowModelFromJson(json);
}

@freezed
abstract class DeparturesModel with _$DeparturesModel {
  const factory DeparturesModel({required DateTime serverTime, @Default([]) List<DepartureRowModel> rows}) = _DeparturesModel;

  factory DeparturesModel.fromJson(Map<String, dynamic> json) => _$DeparturesModelFromJson(json);
}

@freezed
abstract class TripPassengerModel with _$TripPassengerModel {
  const factory TripPassengerModel({
    required String reservationId,
    required String reference,
    required String customerName,
    required int passengers,
    required String plate,
    String? terminal,
  }) = _TripPassengerModel;

  factory TripPassengerModel.fromJson(Map<String, dynamic> json) => _$TripPassengerModelFromJson(json);
}

/// The driver's trip (the API never sends the driver's own position back).
@freezed
abstract class StaffTripModel with _$StaffTripModel {
  const StaffTripModel._();

  const factory StaffTripModel({
    required String id,
    required String status,

    /// `pickup`: to the airport for returning travellers; `dropoff`: to the terminal with arrived ones.
    @Default('pickup') String direction,
    required String driverId,
    required String driverName,
    @Default(TripVehicleModel()) TripVehicleModel vehicle,
    required DateTime startedAt,
    required DateTime expiresAt,
    DateTime? endedAt,
    String? endReason,
    @Default(0) int secondsLeft,
    @Default([]) List<TripPassengerModel> passengers,
    DateTime? positionUpdatedAt,
    MeetingPointModel? meetingPoint,

    /// Where the trip goes (D-A): the chosen stop, else the airport's meeting point.
    ShuttleStopModel? stop,
  }) = _StaffTripModel;

  factory StaffTripModel.fromJson(Map<String, dynamic> json) => _$StaffTripModelFromJson(json);

  bool get running => status == 'running';
  bool get dropoff => direction == 'dropoff';
}

/// A place the shuttle serves (D-A, 05/10/2026): the airport (built in, id null) or a stop of the parking.
@freezed
abstract class ShuttleStopModel with _$ShuttleStopModel {
  const ShuttleStopModel._();

  const factory ShuttleStopModel({
    String? id,
    @Default('other') String kind,
    required String name,
    required double lat,
    required double lng,
    String? instructions,
    @Default(false) bool builtIn,
  }) = _ShuttleStopModel;

  factory ShuttleStopModel.fromJson(Map<String, dynamic> json) => _$ShuttleStopModelFromJson(json);

  bool get isAirport => builtIn || kind == 'airport';
}

/// Straight-line distance and time from a running shuttle to a place (P-A).
@freezed
abstract class LiveEstimateModel with _$LiveEstimateModel {
  const factory LiveEstimateModel({required int distanceM, required int etaMinutes}) = _LiveEstimateModel;

  factory LiveEstimateModel.fromJson(Map<String, dynamic> json) => _$LiveEstimateModelFromJson(json);
}

/// A running trip of the operator, as the team's live map shows it (GET /internal/shuttle/live).
@freezed
abstract class LiveTripModel with _$LiveTripModel {
  const LiveTripModel._();

  const factory LiveTripModel({
    required String id,
    @Default('pickup') String direction,
    required String driverId,
    required String driverName,
    @Default(TripVehicleModel()) TripVehicleModel vehicle,
    ShuttleStopModel? stop,
    @Default(0) int passengers,
    required DateTime startedAt,
    required DateTime expiresAt,
    ShuttlePositionModel? position,
    int? positionAgeSeconds,
    LiveEstimateModel? toStop,
    LiveEstimateModel? toParking,
  }) = _LiveTripModel;

  factory LiveTripModel.fromJson(Map<String, dynamic> json) => _$LiveTripModelFromJson(json);

  bool get dropoff => direction == 'dropoff';

  /// "Vito blanche" (model and colour), or null when the driver typed nothing.
  String? get vehicleTitle {
    final parts = [vehicle.model, vehicle.colour].whereType<String>().join(' ');
    return parts.isEmpty ? null : parts;
  }
}

@freezed
abstract class LiveParkingModel with _$LiveParkingModel {
  const factory LiveParkingModel({required String id, required String name, double? lat, double? lng}) = _LiveParkingModel;

  factory LiveParkingModel.fromJson(Map<String, dynamic> json) => _$LiveParkingModelFromJson(json);
}

/// The operator's running shuttles, the parking and the stops (P-A); polled every 12 s.
@freezed
abstract class LiveShuttlesModel with _$LiveShuttlesModel {
  const factory LiveShuttlesModel({
    required DateTime serverTime,
    required LiveParkingModel parking,
    @Default([]) List<ShuttleStopModel> stops,
    @Default([]) List<LiveTripModel> trips,
  }) = _LiveShuttlesModel;

  factory LiveShuttlesModel.fromJson(Map<String, dynamic> json) => _$LiveShuttlesModelFromJson(json);
}

@freezed
abstract class CurrentTripModel with _$CurrentTripModel {
  const factory CurrentTripModel({StaffTripModel? trip}) = _CurrentTripModel;

  factory CurrentTripModel.fromJson(Map<String, dynamic> json) => _$CurrentTripModelFromJson(json);
}

// ---------------------------------------------------------------- shuttle waves (V-A, 05/10/2026)

/// The flight end that matters for a wave member: take-off (drop-off) or landing (pick-up).
@freezed
abstract class WaveFlightModel with _$WaveFlightModel {
  const WaveFlightModel._();

  const factory WaveFlightModel({required String number, String? status, DateTime? scheduledAt, DateTime? estimatedAt, DateTime? actualAt, String? terminal}) =
      _WaveFlightModel;

  factory WaveFlightModel.fromJson(Map<String, dynamic> json) => _$WaveFlightModelFromJson(json);

  /// The best known time: actual, revised, then scheduled.
  DateTime? get at => actualAt ?? estimatedAt ?? scheduledAt;

  /// Minutes of delay against the schedule (0 when unknown or on time).
  int get lateMinutes => scheduledAt == null || estimatedAt == null ? 0 : estimatedAt!.difference(scheduledAt!).inMinutes.clamp(0, 1 << 20);
}

@freezed
abstract class WaveMemberModel with _$WaveMemberModel {
  const factory WaveMemberModel({
    required String reservationId,
    required String reference,
    required String customerName,
    @Default(1) int passengers,
    required String plate,
    @Default('upcoming') String status,
    @Default('dropoff') String direction,
    String? stopId,
    String? stopName,
    required DateTime leaveAt,
    DateTime? meetAt,
    WaveFlightModel? flight,
    @Default(false) bool noFlight,
    @Default('planned') String state,
    String? tripId,
  }) = _WaveMemberModel;

  factory WaveMemberModel.fromJson(Map<String, dynamic> json) => _$WaveMemberModelFromJson(json);
}

/// Travellers whose shuttle must leave within the same window, same direction and stop.
@freezed
abstract class ShuttleWaveModel with _$ShuttleWaveModel {
  const ShuttleWaveModel._();

  const factory ShuttleWaveModel({
    required String id,
    @Default('dropoff') String direction,
    String? stopId,
    String? stopName,
    required DateTime leaveAt,
    DateTime? meetAt,
    @Default(0) int passengers,
    int? seats,
    int? vehiclesNeeded,
    @Default(0) int noFlight,
    @Default([]) List<String> flights,
    @Default('planned') String state,
    @Default([]) List<WaveMemberModel> members,
  }) = _ShuttleWaveModel;

  factory ShuttleWaveModel.fromJson(Map<String, dynamic> json) => _$ShuttleWaveModelFromJson(json);

  bool get dropoff => direction == 'dropoff';
  bool get planned => state == 'planned';
  bool get overflow => (vehiclesNeeded ?? 1) > 1;
}

@freezed
abstract class WaveTimesModel with _$WaveTimesModel {
  const factory WaveTimesModel({@Default(8) int shuttleTravelMinutes, @Default(120) int terminalLeadMinutes, @Default(30) int landingDelayMinutes}) =
      _WaveTimesModel;

  factory WaveTimesModel.fromJson(Map<String, dynamic> json) => _$WaveTimesModelFromJson(json);
}

/// GET /internal/shuttle/forecast?date=: the day's waves ("Ligne du jour").
@freezed
abstract class ShuttleForecastModel with _$ShuttleForecastModel {
  const factory ShuttleForecastModel({
    required DateTime serverTime,
    required String date,
    @Default(WaveTimesModel()) WaveTimesModel times,
    int? seats,
    @Default(0) int vehiclesInService,
    @Default([]) List<ShuttleWaveModel> waves,
  }) = _ShuttleForecastModel;

  factory ShuttleForecastModel.fromJson(Map<String, dynamic> json) => _$ShuttleForecastModelFromJson(json);
}

/// E (06/10/2026): a return-day notice as the driver's list shows it.
@freezed
abstract class PickupNoticeModel with _$PickupNoticeModel {
  const factory PickupNoticeModel({required String kind, String? text, required DateTime at}) = _PickupNoticeModel;

  factory PickupNoticeModel.fromJson(Map<String, dynamic> json) => _$PickupNoticeModelFromJson(json);
}

/// F-A (06/10/2026): a traveller dropped at the terminal (or fetched back), kept until their return.
@freezed
abstract class StayingRowModel with _$StayingRowModel {
  const factory StayingRowModel({
    required String reservationId,
    required String reference,
    required String customerName,
    required int passengers,
    required String plate,
    required String status,
    required DateTime returnAt,
    String? returnFlight,
    @Default(FlightViewModel()) FlightViewModel flight,
    String? spot,
    String? stopName,
    DateTime? returnedAt,
  }) = _StayingRowModel;

  factory StayingRowModel.fromJson(Map<String, dynamic> json) => _$StayingRowModelFromJson(json);
}

@freezed
abstract class StayingDayModel with _$StayingDayModel {
  const factory StayingDayModel({required String date, @Default(<StayingRowModel>[]) List<StayingRowModel> rows}) = _StayingDayModel;

  factory StayingDayModel.fromJson(Map<String, dynamic> json) => _$StayingDayModelFromJson(json);
}

/// GET /internal/shuttle/staying: away travellers by return day, and those back today.
@freezed
abstract class StayingModel with _$StayingModel {
  const factory StayingModel({
    required DateTime serverTime,
    @Default(<StayingDayModel>[]) List<StayingDayModel> days,
    @Default(<StayingRowModel>[]) List<StayingRowModel> returnedToday,
  }) = _StayingModel;

  factory StayingModel.fromJson(Map<String, dynamic> json) => _$StayingModelFromJson(json);
}
