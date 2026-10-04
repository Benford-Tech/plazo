import 'package:freezed_annotation/freezed_annotation.dart';

part 'plan_models.freezed.dart';
part 'plan_models.g.dart';

/// GET /internal/parking (the fields the plan needs).
@freezed
abstract class ParkingSummaryModel with _$ParkingSummaryModel {
  const factory ParkingSummaryModel({required String id, required String name, required int totalCapacity}) = _ParkingSummaryModel;
  factory ParkingSummaryModel.fromJson(Map<String, dynamic> json) => _$ParkingSummaryModelFromJson(json);
}

/// The stored plan: GeoJSON kept as maps (the app only reads the outline ring).
@freezed
abstract class ParkingPlanModel with _$ParkingPlanModel {
  const factory ParkingPlanModel({
    required String id,
    required String parkingId,
    Map<String, dynamic>? outline,
    @Default([]) List<Map<String, dynamic>> zones,
    @Default([]) List<Map<String, dynamic>> landmarks,
    String? layout,
    String? generatedAt,
  }) = _ParkingPlanModel;
  factory ParkingPlanModel.fromJson(Map<String, dynamic> json) => _$ParkingPlanModelFromJson(json);
}

@freezed
abstract class SpotModel with _$SpotModel {
  const factory SpotModel({
    required String id,
    required String code,
    required int row,
    required int index,
    required String kind,
    required bool active,
    String? stayClass,

    /// Closed ring, [lon, lat] × 5.
    required List<List<double>> geometry,
  }) = _SpotModel;
  factory SpotModel.fromJson(Map<String, dynamic> json) => _$SpotModelFromJson(json);
}

/// GET /internal/parkings/:id/plan
@freezed
abstract class ParkingPlanViewModel with _$ParkingPlanViewModel {
  const factory ParkingPlanViewModel({
    required ParkingPlanModel plan,
    @Default([]) List<SpotModel> spots,
    required int activeSpots,
    required int totalCapacity,
  }) = _ParkingPlanViewModel;
  factory ParkingPlanViewModel.fromJson(Map<String, dynamic> json) => _$ParkingPlanViewModelFromJson(json);
}

/// POST /internal/parkings/:id/plan/estimate: the three layouts compared.
@freezed
abstract class PlanEstimateModel with _$PlanEstimateModel {
  const factory PlanEstimateModel({required int usableArea, required Map<String, int> totals}) = _PlanEstimateModel;
  factory PlanEstimateModel.fromJson(Map<String, dynamic> json) => _$PlanEstimateModelFromJson(json);
}

@freezed
abstract class GeocodeResultModel with _$GeocodeResultModel {
  const factory GeocodeResultModel({required String label, required String type, required double lon, required double lat}) = _GeocodeResultModel;
  factory GeocodeResultModel.fromJson(Map<String, dynamic> json) => _$GeocodeResultModelFromJson(json);
}

@freezed
abstract class GeocodeResponseModel with _$GeocodeResponseModel {
  const factory GeocodeResponseModel({@Default([]) List<GeocodeResultModel> results}) = _GeocodeResponseModel;
  factory GeocodeResponseModel.fromJson(Map<String, dynamic> json) => _$GeocodeResponseModelFromJson(json);
}

/// Envelope of the writing routes: `{ message, data }`.
@freezed
abstract class PlanViewEnvelope with _$PlanViewEnvelope {
  const factory PlanViewEnvelope({required ParkingPlanViewModel data}) = _PlanViewEnvelope;
  factory PlanViewEnvelope.fromJson(Map<String, dynamic> json) => _$PlanViewEnvelopeFromJson(json);
}
