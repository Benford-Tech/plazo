import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../arrival/data/models/arrival_model.dart';

part 'return_model.freezed.dart';
part 'return_model.g.dart';

/// The return flight as the API tracks it (AeroDataBox / AirLabs), or as the traveller declared it.
@freezed
abstract class FlightViewModel with _$FlightViewModel {
  const FlightViewModel._();

  const factory FlightViewModel({
    String? number,
    /// scheduled, delayed, departed, landed, cancelled, diverted, unknown; null: not looked up yet.
    String? status,
    DateTime? scheduledAt,
    DateTime? estimatedAt,
    DateTime? landedAt,
    /// tracking (the flight API) or traveller ("J'ai atterri").
    String? landedSource,
    String? terminal,
    String? gate,
    DateTime? checkedAt,
  }) = _FlightViewModel;

  factory FlightViewModel.fromJson(Map<String, dynamic> json) => _$FlightViewModelFromJson(json);

  bool get landed => status == 'landed';
  bool get cancelled => status == 'cancelled' || status == 'diverted';

  /// The landing to show: actual, else revised, else scheduled.
  DateTime? get expectedAt => landedAt ?? estimatedAt ?? scheduledAt;
}

@freezed
abstract class TripVehicleModel with _$TripVehicleModel {
  const factory TripVehicleModel({String? model, String? colour, String? plate}) = _TripVehicleModel;

  factory TripVehicleModel.fromJson(Map<String, dynamic> json) => _$TripVehicleModelFromJson(json);
}

@freezed
abstract class ShuttlePositionModel with _$ShuttlePositionModel {
  const factory ShuttlePositionModel({required double lat, required double lng}) = _ShuttlePositionModel;

  factory ShuttlePositionModel.fromJson(Map<String, dynamic> json) => _$ShuttlePositionModelFromJson(json);
}

/// The shuttle coming for the traveller (only while a running trip includes their booking).
@freezed
abstract class TravellerShuttleModel with _$TravellerShuttleModel {
  const factory TravellerShuttleModel({
    required String tripId,

    /// `pickup`: coming to the airport for returning travellers; `dropoff`: leaving the parking for the terminal.
    @Default('pickup') String direction,

    /// This booking is on the trip.
    @Default(false) bool mine,
    required DateTime startedAt,
    @Default(TripVehicleModel()) TripVehicleModel vehicle,
    @Default('') String driverFirstName,
    ShuttlePositionModel? position,
    int? positionAgeSeconds,
    int? distanceM,
    int? etaMinutes,
    DateTime? etaAt,
    MeetingPointModel? meetingPoint,
    ShuttleDestinationModel? destination,
  }) = _TravellerShuttleModel;

  factory TravellerShuttleModel.fromJson(Map<String, dynamic> json) => _$TravellerShuttleModelFromJson(json);
}

/// Where a shuttle's distance is measured to: the parking, or the return meeting point.
@freezed
abstract class ShuttleDestinationModel with _$ShuttleDestinationModel {
  const factory ShuttleDestinationModel({required String kind, required double lat, required double lng, String? label}) = _ShuttleDestinationModel;

  factory ShuttleDestinationModel.fromJson(Map<String, dynamic> json) => _$ShuttleDestinationModelFromJson(json);
}

/// The "Navette" block during the stay (GET /public/bookings/{reference}/shuttles, S-A 04/10/2026).
@freezed
abstract class StayShuttlesModel with _$StayShuttlesModel {
  const StayShuttlesModel._();

  const factory StayShuttlesModel({
    /// `arrival`, `stay`, `return`; null outside the arrival day → return day window.
    String? phase,
    required DateTime serverTime,
    @Default([]) List<TravellerShuttleModel> shuttles,
  }) = _StayShuttlesModel;

  factory StayShuttlesModel.fromJson(Map<String, dynamic> json) => _$StayShuttlesModelFromJson(json);

  bool get visible => phase != null;
  TravellerShuttleModel? get mine => shuttles.where((s) => s.mine).firstOrNull;
}

@freezed
abstract class ReturnParkingModel with _$ReturnParkingModel {
  const factory ReturnParkingModel({required String name, String? phone, int? shuttleMinutes, String? address}) = _ReturnParkingModel;

  factory ReturnParkingModel.fromJson(Map<String, dynamic> json) => _$ReturnParkingModelFromJson(json);
}

/// GET /public/bookings/:reference/return.
@freezed
abstract class TravellerReturnModel with _$TravellerReturnModel {
  const TravellerReturnModel._();

  const factory TravellerReturnModel({
    required String reference,
    required String status,
    required String returnAt,
    @Default(false) bool returnDay,
    @Default(FlightViewModel()) FlightViewModel flight,
    @Default(false) bool flightTracked,
    MeetingPointModel? meetingPoint,
    DateTime? atMeetingPointAt,
    TravellerShuttleModel? shuttle,
    required ReturnParkingModel parking,
    required String plate,
  }) = _TravellerReturnModel;

  factory TravellerReturnModel.fromJson(Map<String, dynamic> json) => _$TravellerReturnModelFromJson(json);

  bool get atMeetingPoint => atMeetingPointAt != null;
  bool get shuttleRunning => shuttle != null;
}

/// GET /public/bookings/:reference/shuttle.
@freezed
abstract class ShuttleStatusModel with _$ShuttleStatusModel {
  const factory ShuttleStatusModel({TravellerShuttleModel? shuttle, required DateTime serverTime}) = _ShuttleStatusModel;

  factory ShuttleStatusModel.fromJson(Map<String, dynamic> json) => _$ShuttleStatusModelFromJson(json);
}

@freezed
abstract class RoutePointModel with _$RoutePointModel {
  const factory RoutePointModel({required double lat, required double lng}) = _RoutePointModel;

  factory RoutePointModel.fromJson(Map<String, dynamic> json) => _$RoutePointModelFromJson(json);
}

/// GET /public/bookings/:reference/return/route: the walking route to the meeting point.
@freezed
abstract class WalkingRouteModel with _$WalkingRouteModel {
  const WalkingRouteModel._();

  const factory WalkingRouteModel({
    /// [lat, lng] pairs.
    @Default([]) List<List<double>> geometry,
    @Default(0) int distanceM,
    @Default(1) int durationMinutes,
    /// The routing service failed: a straight line.
    @Default(false) bool fallback,
    required RoutePointModel from,
    required RoutePointModel to,
    MeetingPointModel? meetingPoint,
  }) = _WalkingRouteModel;

  factory WalkingRouteModel.fromJson(Map<String, dynamic> json) => _$WalkingRouteModelFromJson(json);
}
