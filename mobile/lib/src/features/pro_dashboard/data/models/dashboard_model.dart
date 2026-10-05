import 'package:freezed_annotation/freezed_annotation.dart';

part 'dashboard_model.freezed.dart';
part 'dashboard_model.g.dart';

/// GET /internal/dashboard (05/10/2026): the pro space's home, the same as on the web.
@freezed
abstract class DashboardModel with _$DashboardModel {
  const DashboardModel._();

  const factory DashboardModel({
    required DateTime serverTime,
    required String date,
    required DashboardParkingModel parking,
    required DashboardCountsModel counts,
    required DashboardServicesModel services,
    @Default([]) List<DashboardAlertModel> alerts,
    required DashboardBreakdownModel breakdown,
    @Default([]) List<DashboardVehicleModel> vehicles,
  }) = _DashboardModel;

  factory DashboardModel.fromJson(Map<String, dynamic> json) => _$DashboardModelFromJson(json);

  int get urgent => alerts.where((a) => a.severity == 'urgent').length;
}

@freezed
abstract class DashboardParkingModel with _$DashboardParkingModel {
  const factory DashboardParkingModel({
    required String id,
    required String name,
    @Default('Europe/Paris') String timezone,
    @Default(0) int bookableCapacity,
    @Default(0) int plannedSpots,
  }) = _DashboardParkingModel;

  factory DashboardParkingModel.fromJson(Map<String, dynamic> json) => _$DashboardParkingModelFromJson(json);
}

@freezed
abstract class DashboardCountsModel with _$DashboardCountsModel {
  const factory DashboardCountsModel({
    @Default(0) int onSite,
    @Default(0) int arrivalsToday,
    @Default(0) int arrivedToday,
    @Default(0) int returnsToday,
    @Default(0) int shuttlesRunning,
    int? freeSpots,
    @Default(0) int toTreat,
  }) = _DashboardCountsModel;

  factory DashboardCountsModel.fromJson(Map<String, dynamic> json) => _$DashboardCountsModelFromJson(json);
}

@freezed
abstract class DashboardFlightsModel with _$DashboardFlightsModel {
  const factory DashboardFlightsModel({@Default(false) bool configured, String? provider, DateTime? lastCheckedAt}) = _DashboardFlightsModel;

  factory DashboardFlightsModel.fromJson(Map<String, dynamic> json) => _$DashboardFlightsModelFromJson(json);
}

@freezed
abstract class DashboardSmsModel with _$DashboardSmsModel {
  const factory DashboardSmsModel({@Default('none') String mode, @Default(0) int pending, @Default(false) bool stale, DateTime? lastSentAt}) =
      _DashboardSmsModel;

  factory DashboardSmsModel.fromJson(Map<String, dynamic> json) => _$DashboardSmsModelFromJson(json);
}

@freezed
abstract class DashboardPushModel with _$DashboardPushModel {
  const factory DashboardPushModel({@Default(false) bool configured, @Default(0) int devices}) = _DashboardPushModel;

  factory DashboardPushModel.fromJson(Map<String, dynamic> json) => _$DashboardPushModelFromJson(json);
}

@freezed
abstract class DashboardStripeModel with _$DashboardStripeModel {
  const factory DashboardStripeModel({@Default(false) bool connected, @Default(false) bool payoutsEnabled}) = _DashboardStripeModel;

  factory DashboardStripeModel.fromJson(Map<String, dynamic> json) => _$DashboardStripeModelFromJson(json);
}

@freezed
abstract class DashboardServicesModel with _$DashboardServicesModel {
  const factory DashboardServicesModel({
    @Default(DashboardFlightsModel()) DashboardFlightsModel flights,
    @Default(DashboardSmsModel()) DashboardSmsModel sms,
    @Default(DashboardPushModel()) DashboardPushModel push,
    @Default(DashboardStripeModel()) DashboardStripeModel stripe,
    DateTime? lastImportAt,
  }) = _DashboardServicesModel;

  factory DashboardServicesModel.fromJson(Map<String, dynamic> json) => _$DashboardServicesModelFromJson(json);
}

/// A situation to treat: `kind` among no_spot, no_free_spot, arriving_unplaced, flight_delayed,
/// flight_cancelled, waiting_at_meeting_point, keys_missing, sms_pending, overbooked;
/// `severity` urgent, watch or todo (the server sorts them).
@freezed
abstract class DashboardAlertModel with _$DashboardAlertModel {
  const factory DashboardAlertModel({
    required String kind,
    @Default('todo') String severity,
    String? reservationId,
    String? reference,
    String? customerName,
    String? plate,
    String? detail,
    DateTime? since,
    int? minutes,
  }) = _DashboardAlertModel;

  factory DashboardAlertModel.fromJson(Map<String, dynamic> json) => _$DashboardAlertModelFromJson(json);
}

@freezed
abstract class DashboardBreakdownModel with _$DashboardBreakdownModel {
  const factory DashboardBreakdownModel({
    @Default(0) int onSiteQuiet,
    @Default(0) int toPlaceToday,
    @Default(0) int returnsThisWeek,
    @Default(0) int toTreat,
    int? freeSpots,
  }) = _DashboardBreakdownModel;

  factory DashboardBreakdownModel.fromJson(Map<String, dynamic> json) => _$DashboardBreakdownModelFromJson(json);
}

/// A vehicle on the parking: its spot, its keys, its return.
@freezed
abstract class DashboardVehicleModel with _$DashboardVehicleModel {
  const factory DashboardVehicleModel({
    required String id,
    required String reference,
    required String customerName,
    @Default(1) int passengers,
    required String plate,
    required String status,
    required String arrivalAt,
    required String returnAt,
    String? spotCode,
    String? stayClass,
    String? keyHook,
    String? returnFlight,
    String? flightStatus,
    String? flightScheduledAt,
    String? flightEstimatedAt,
    String? flightLandedAt,
    String? tripDirection,
    String? stopName,
    @Default(false) bool returnsToday,
  }) = _DashboardVehicleModel;

  factory DashboardVehicleModel.fromJson(Map<String, dynamic> json) => _$DashboardVehicleModelFromJson(json);
}
