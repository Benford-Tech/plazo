import 'package:freezed_annotation/freezed_annotation.dart';

part 'arrival_model.freezed.dart';
part 'arrival_model.g.dart';

/// Which moment of the stay: the drop-off at the parking, or the pick-up at the airport.
enum ArrivalKind {
  @JsonValue('outbound')
  outbound,
  @JsonValue('return')
  returnTrip;

  String get apiValue => this == outbound ? 'outbound' : 'return';
}

enum ArrivalSignalState {
  @JsonValue('sharing')
  sharing,
  @JsonValue('announced')
  announced,
  @JsonValue('at_meeting_point')
  atMeetingPoint,
  @JsonValue('ended')
  ended,
}

@freezed
abstract class MeetingPointModel with _$MeetingPointModel {
  const factory MeetingPointModel({
    required double lat,
    required double lng,
    /// parking (its reception), return_point (set by the operator) or airport.
    required String source,
    String? label,
    /// The operator's written directions and photo (return point only).
    String? instructions,
    String? photoUrl,
  }) = _MeetingPointModel;

  factory MeetingPointModel.fromJson(Map<String, dynamic> json) => _$MeetingPointModelFromJson(json);
}

@freezed
abstract class ArrivalMomentModel with _$ArrivalMomentModel {
  const factory ArrivalMomentModel({
    @JsonKey(unknownEnumValue: ArrivalKind.outbound) required ArrivalKind kind,
    required bool open,
    required DateTime opensAt,
    required DateTime closesAt,
  }) = _ArrivalMomentModel;

  factory ArrivalMomentModel.fromJson(Map<String, dynamic> json) => _$ArrivalMomentModelFromJson(json);
}

@freezed
abstract class ArrivalSignalModel with _$ArrivalSignalModel {
  const factory ArrivalSignalModel({
    required ArrivalKind kind,
    @JsonKey(unknownEnumValue: ArrivalSignalState.ended) required ArrivalSignalState state,
    String? endReason,
    required DateTime startedAt,
    required DateTime expiresAt,
    required int secondsLeft,
    int? distanceM,
    int? etaMinutes,
    DateTime? etaAt,
    int? announcedMinutes,
    DateTime? atMeetingPointAt,
    DateTime? positionUpdatedAt,

    /// E (06/10/2026): the traveller's word for the parking, sent with the signal.
    String? note,
  }) = _ArrivalSignalModel;

  factory ArrivalSignalModel.fromJson(Map<String, dynamic> json) => _$ArrivalSignalModelFromJson(json);
}

@freezed
abstract class ArrivalRulesModel with _$ArrivalRulesModel {
  const factory ArrivalRulesModel({
    @Default(120) int maxMinutes,
    @Default(150) int arrivedWithinMeters,
    @Default(10) int positionIntervalSeconds,
    @Default([10, 20, 30]) List<int> announceMinutes,
  }) = _ArrivalRulesModel;

  factory ArrivalRulesModel.fromJson(Map<String, dynamic> json) => _$ArrivalRulesModelFromJson(json);
}

/// GET /public/bookings/:reference/arrival (and every arrival route's answer).
@freezed
abstract class ArrivalModel with _$ArrivalModel {
  const ArrivalModel._();

  const factory ArrivalModel({
    required String reference,
    ArrivalMomentModel? moment,
    MeetingPointModel? meetingPoint,
    ArrivalSignalModel? signal,
    @Default(ArrivalRulesModel()) ArrivalRulesModel rules,
  }) = _ArrivalModel;

  factory ArrivalModel.fromJson(Map<String, dynamic> json) => _$ArrivalModelFromJson(json);

  bool get isSharing => signal?.state == ArrivalSignalState.sharing;
  bool get isAnnounced => signal?.state == ArrivalSignalState.announced;
  bool get isAtMeetingPoint => signal?.state == ArrivalSignalState.atMeetingPoint;
}
