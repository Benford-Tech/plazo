import 'package:freezed_annotation/freezed_annotation.dart';

import 'staff_signal_model.dart';

part 'planning_model.freezed.dart';
part 'planning_model.g.dart';

/// A booking of the day sheet, with its traveller's live signal (if any).
@freezed
abstract class PlanningRowModel with _$PlanningRowModel {
  const factory PlanningRowModel({
    required String id,
    required String reference,
    required String status,
    required DateTime arrivalAt,
    required DateTime returnAt,
    required int passengers,
    required String customerName,
    required String plate,
    String? returnFlight,
    StaffSignalModel? arrivalSignal,
  }) = _PlanningRowModel;

  factory PlanningRowModel.fromJson(Map<String, dynamic> json) => _$PlanningRowModelFromJson(json);
}

@freezed
abstract class PlanningParkingModel with _$PlanningParkingModel {
  const factory PlanningParkingModel({required String id, required String name}) = _PlanningParkingModel;

  factory PlanningParkingModel.fromJson(Map<String, dynamic> json) => _$PlanningParkingModelFromJson(json);
}

/// GET /internal/planning: arrivals and returns of the day.
@freezed
abstract class PlanningModel with _$PlanningModel {
  const factory PlanningModel({
    required String date,
    required PlanningParkingModel parking,
    @Default([]) List<PlanningRowModel> arrivals,
    @Default([]) List<PlanningRowModel> returns,
  }) = _PlanningModel;

  factory PlanningModel.fromJson(Map<String, dynamic> json) => _$PlanningModelFromJson(json);
}
