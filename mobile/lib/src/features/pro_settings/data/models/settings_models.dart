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
    String? phone,
    required String role,
    @Default(true) bool isActive,
    DateTime? lastLoginAt,
  }) = _TeamMemberModel;

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) => _$TeamMemberModelFromJson(json);
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
    @Default(0) int bookableCapacity,
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
