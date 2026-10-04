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
    DateTime? atMeetingPointAt,
    /// The running trip this traveller is on, if any.
    String? tripId,
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
    String? tripId,
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
  }) = _StaffTripModel;

  factory StaffTripModel.fromJson(Map<String, dynamic> json) => _$StaffTripModelFromJson(json);

  bool get running => status == 'running';
  bool get dropoff => direction == 'dropoff';
}

@freezed
abstract class CurrentTripModel with _$CurrentTripModel {
  const factory CurrentTripModel({StaffTripModel? trip}) = _CurrentTripModel;

  factory CurrentTripModel.fromJson(Map<String, dynamic> json) => _$CurrentTripModelFromJson(json);
}
