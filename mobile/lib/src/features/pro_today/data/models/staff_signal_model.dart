import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../arrival/data/models/arrival_model.dart';

part 'staff_signal_model.freezed.dart';
part 'staff_signal_model.g.dart';

@freezed
abstract class SignalPositionModel with _$SignalPositionModel {
  const factory SignalPositionModel({required double lat, required double lng, double? accuracyM}) = _SignalPositionModel;

  factory SignalPositionModel.fromJson(Map<String, dynamic> json) => _$SignalPositionModelFromJson(json);
}

/// A traveller's live signal as the staff sees it (GET /internal/arrivals/live).
@freezed
abstract class StaffSignalModel with _$StaffSignalModel {
  const StaffSignalModel._();

  const factory StaffSignalModel({
    required String id,
    required String reservationId,
    required String reference,
    required ArrivalKind kind,
    @JsonKey(unknownEnumValue: ArrivalSignalState.ended) required ArrivalSignalState state,
    required String customerName,
    required String plate,
    required int passengers,
    String? returnFlight,
    required DateTime scheduledAt,
    required DateTime startedAt,
    required DateTime expiresAt,
    int? distanceM,
    int? etaMinutes,
    DateTime? etaAt,
    int? announcedMinutes,
    DateTime? atMeetingPointAt,
    SignalPositionModel? position,
    DateTime? positionUpdatedAt,
    int? positionAgeSeconds,
    MeetingPointModel? meetingPoint,

    /// E (06/10/2026): the traveller's word for the parking, sent with the signal.
    String? note,
  }) = _StaffSignalModel;

  factory StaffSignalModel.fromJson(Map<String, dynamic> json) => _$StaffSignalModelFromJson(json);

  /// One banner per event: a new sharing, a new announce (or new minutes), an arrival.
  String get eventKey => '$id:${state.name}:${startedAt.toIso8601String()}:${announcedMinutes ?? ''}';
}

@freezed
abstract class LiveArrivalsModel with _$LiveArrivalsModel {
  const factory LiveArrivalsModel({required DateTime serverTime, @Default([]) List<StaffSignalModel> signals}) = _LiveArrivalsModel;

  factory LiveArrivalsModel.fromJson(Map<String, dynamic> json) => _$LiveArrivalsModelFromJson(json);
}
