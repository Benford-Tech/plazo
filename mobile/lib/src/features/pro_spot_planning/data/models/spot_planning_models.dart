import 'package:freezed_annotation/freezed_annotation.dart';

part 'spot_planning_models.freezed.dart';
part 'spot_planning_models.g.dart';

/// A booking on the spot planning (GET /internal/parkings/:id/spot-planning).
@freezed
abstract class PlannedStayModel with _$PlannedStayModel {
  const factory PlannedStayModel({
    required String id,
    required String reference,
    required String customerName,
    required String plate,
    required String status,
    required DateTime arrivalAt,
    required DateTime returnAt,
    String? returnFlight,
    String? spotId,
    String? keyHook,
    @Default(false) bool onSite,
  }) = _PlannedStayModel;

  factory PlannedStayModel.fromJson(Map<String, dynamic> json) => _$PlannedStayModelFromJson(json);
}

@freezed
abstract class PlannedSpotModel with _$PlannedSpotModel {
  const factory PlannedSpotModel({
    required String id,
    required String zoneId,
    required String code,
    required int row,
    required int index,
    required String kind,
    required bool active,
    String? stayClass,
    @Default([]) List<PlannedStayModel> stays,
  }) = _PlannedSpotModel;

  factory PlannedSpotModel.fromJson(Map<String, dynamic> json) => _$PlannedSpotModelFromJson(json);
}

@freezed
abstract class DayLoadModel with _$DayLoadModel {
  const factory DayLoadModel({required String date, required int placed, required int unplaced, required int capacity}) = _DayLoadModel;

  factory DayLoadModel.fromJson(Map<String, dynamic> json) => _$DayLoadModelFromJson(json);
}

/// over_capacity (date, count), unplaced (count), inactive_spot_used (spotCode, reference).
@freezed
abstract class PlanningAlertModel with _$PlanningAlertModel {
  const factory PlanningAlertModel({required String kind, String? date, int? count, String? spotCode, String? reference}) = _PlanningAlertModel;

  factory PlanningAlertModel.fromJson(Map<String, dynamic> json) => _$PlanningAlertModelFromJson(json);
}

@freezed
abstract class SpotPlanningModel with _$SpotPlanningModel {
  const factory SpotPlanningModel({
    required String from,
    required int days,
    @Default(0) int capacity,
    @Default([]) List<PlannedSpotModel> spots,
    @Default([]) List<PlannedStayModel> unplaced,
    @Default([]) List<DayLoadModel> load,
    @Default([]) List<PlanningAlertModel> alerts,
  }) = _SpotPlanningModel;

  factory SpotPlanningModel.fromJson(Map<String, dynamic> json) => _$SpotPlanningModelFromJson(json);
}

@freezed
abstract class PreassignedModel with _$PreassignedModel {
  const factory PreassignedModel({required String reservationId, required String reference, required String spotId, required String code}) = _PreassignedModel;

  factory PreassignedModel.fromJson(Map<String, dynamic> json) => _$PreassignedModelFromJson(json);
}

@freezed
abstract class PreassignResultModel with _$PreassignResultModel {
  const factory PreassignResultModel({@Default([]) List<PreassignedModel> assigned, @Default([]) List<Map<String, dynamic>> skipped}) = _PreassignResultModel;

  factory PreassignResultModel.fromJson(Map<String, dynamic> json) => _$PreassignResultModelFromJson(json);
}

/// `{ message, data }` of POST …/spot-planning/preassign.
@freezed
abstract class PreassignEnvelopeModel with _$PreassignEnvelopeModel {
  const factory PreassignEnvelopeModel({required PreassignResultModel data}) = _PreassignEnvelopeModel;

  factory PreassignEnvelopeModel.fromJson(Map<String, dynamic> json) => _$PreassignEnvelopeModelFromJson(json);
}
