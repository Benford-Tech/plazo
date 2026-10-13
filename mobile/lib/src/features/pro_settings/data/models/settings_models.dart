import 'package:freezed_annotation/freezed_annotation.dart';

part 'settings_models.freezed.dart';
part 'settings_models.g.dart';

/// A member of the operator's team (GET /internal/staff).
@freezed
abstract class TeamMemberModel with _$TeamMemberModel {
  const factory TeamMemberModel({
    required String id,
    required String email,
    required String name,
    @Default('') String firstName,
    @Default('') String lastName,
    String? phone,
    required String role,
    @Default(true) bool isActive,
    DateTime? lastLoginAt,

    /// The post held today (R-C), when it differs from the role.
    String? post,
    DateTime? postSetAt,

    /// How the member signs in (13/10/2026): password, apple, google.
    @Default([]) List<String> signIn,
  }) = _TeamMemberModel;

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) => _$TeamMemberModelFromJson(json);
}

/// GET /internal/staff/join-code (13/10/2026, managers): the code du jour of the parking, valid until local midnight.
@freezed
abstract class JoinCodeModel with _$JoinCodeModel {
  const factory JoinCodeModel({
    /// `K7QM2-XP9TD`
    required String code,
    String? day,
    DateTime? validUntil,
    @Default('') String operatorName,
  }) = _JoinCodeModel;

  factory JoinCodeModel.fromJson(Map<String, dynamic> json) => _$JoinCodeModelFromJson(json);
}

/// A request to join the team, waiting for a manager (GET /internal/staff/join-requests).
@freezed
abstract class PendingJoinRequestModel with _$PendingJoinRequestModel {
  const PendingJoinRequestModel._();

  const factory PendingJoinRequestModel({
    required String id,
    @Default('') String firstName,
    @Default('') String lastName,
    String? email,
    @Default(false) bool isPrivateEmail,

    /// apple, google
    required String provider,

    /// agent, driver, valet: the post asked for, preset in « Accepter… ».
    @Default('agent') String wishedRole,
    required DateTime createdAt,
    DateTime? expiresAt,
  }) = _PendingJoinRequestModel;

  factory PendingJoinRequestModel.fromJson(Map<String, dynamic> json) => _$PendingJoinRequestModelFromJson(json);

  String get name => [firstName, lastName].where((s) => s.trim().isNotEmpty).join(' ');

  /// « JM ».
  String get initials => [firstName, lastName].where((s) => s.trim().isNotEmpty).map((s) => s.trim()[0].toUpperCase()).join();
}

/// `{ data }` of GET /internal/staff/join-requests.
@freezed
abstract class PendingJoinRequestsModel with _$PendingJoinRequestsModel {
  const factory PendingJoinRequestsModel({@Default([]) List<PendingJoinRequestModel> data}) = _PendingJoinRequestsModel;

  factory PendingJoinRequestsModel.fromJson(Map<String, dynamic> json) => _$PendingJoinRequestsModelFromJson(json);
}

/// The parking's settings (GET /internal/parking, PATCH /internal/parkings/:id).
@freezed
abstract class ParkingSettingsModel with _$ParkingSettingsModel {
  const factory ParkingSettingsModel({
    required String id,
    required String name,
    String? address,
    @Default('Europe/Paris') String timezone,
    required int totalCapacity,
    @Default(0) int safetyMarginPct,
    @Default(8) int shuttleTravelMinutes,
    @Default(120) int terminalLeadMinutes,
    @Default(30) int landingDelayMinutes,

    /// R-B (07/10/2026): who sees the shuttles' position: "off", "team" or "everyone".
    @Default('team') String shuttleTracking,
    @Default(0) int bookableCapacity,

    /// 09/10/2026: the capacity used everywhere (the plan's files, else its active spots, else
    /// `totalCapacity`, the declared figure) and where it comes from: "files", "spots" or
    /// "declared" (the default, for an older server).
    @Default(0) int effectiveCapacity,
    @Default('declared') String capacitySource,
  }) = _ParkingSettingsModel;

  factory ParkingSettingsModel.fromJson(Map<String, dynamic> json) => _$ParkingSettingsModelFromJson(json);
}

@freezed
abstract class SmsGatewayModel with _$SmsGatewayModel {
  const factory SmsGatewayModel({String? baseUrl, required String login, String? senderPhone, String? linkedAt}) = _SmsGatewayModel;

  factory SmsGatewayModel.fromJson(Map<String, dynamic> json) => _$SmsGatewayModelFromJson(json);
}

/// GET /internal/sms/settings: gateway (the parking's Android phone), brevo, or none.
@freezed
abstract class SmsSettingsModel with _$SmsSettingsModel {
  const factory SmsSettingsModel({@Default('none') String mode, @Default(false) bool brevoAvailable, SmsGatewayModel? gateway}) = _SmsSettingsModel;

  factory SmsSettingsModel.fromJson(Map<String, dynamic> json) => _$SmsSettingsModelFromJson(json);
}

@freezed
abstract class SmsMonthModel with _$SmsMonthModel {
  const factory SmsMonthModel({@Default(0) int sent, @Default(0) int failed}) = _SmsMonthModel;

  factory SmsMonthModel.fromJson(Map<String, dynamic> json) => _$SmsMonthModelFromJson(json);
}

/// GET /internal/sms/status.
@freezed
abstract class SmsStatusModel with _$SmsStatusModel {
  const factory SmsStatusModel({
    @Default('none') String mode,
    String? linkedAt,
    String? lastSentAt,
    String? senderPhone,
    @Default(SmsMonthModel()) SmsMonthModel month,
    @Default(0) int pending,
    @Default(false) bool pendingStale,
    String? lastError,
  }) = _SmsStatusModel;

  factory SmsStatusModel.fromJson(Map<String, dynamic> json) => _$SmsStatusModelFromJson(json);
}

/// POST /internal/sms/test: { outcome: sent | queued }.
@freezed
abstract class SmsTestModel with _$SmsTestModel {
  const factory SmsTestModel({required String outcome}) = _SmsTestModel;

  factory SmsTestModel.fromJson(Map<String, dynamic> json) => _$SmsTestModelFromJson(json);
}
