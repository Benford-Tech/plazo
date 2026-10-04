// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TeamMemberModel _$TeamMemberModelFromJson(Map<String, dynamic> json) =>
    _TeamMemberModel(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      role: json['role'] as String,
      isActive: json['isActive'] as bool? ?? true,
      lastLoginAt: json['lastLoginAt'] == null
          ? null
          : DateTime.parse(json['lastLoginAt'] as String),
    );

Map<String, dynamic> _$TeamMemberModelToJson(_TeamMemberModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'name': instance.name,
      'phone': instance.phone,
      'role': instance.role,
      'isActive': instance.isActive,
      'lastLoginAt': instance.lastLoginAt?.toIso8601String(),
    };

_ParkingSettingsModel _$ParkingSettingsModelFromJson(
  Map<String, dynamic> json,
) => _ParkingSettingsModel(
  id: json['id'] as String,
  name: json['name'] as String,
  address: json['address'] as String?,
  timezone: json['timezone'] as String? ?? 'Europe/Paris',
  totalCapacity: (json['totalCapacity'] as num).toInt(),
  safetyMarginPct: (json['safetyMarginPct'] as num?)?.toInt() ?? 0,
  shuttleTravelMinutes: (json['shuttleTravelMinutes'] as num?)?.toInt() ?? 8,
  bookableCapacity: (json['bookableCapacity'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$ParkingSettingsModelToJson(
  _ParkingSettingsModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'address': instance.address,
  'timezone': instance.timezone,
  'totalCapacity': instance.totalCapacity,
  'safetyMarginPct': instance.safetyMarginPct,
  'shuttleTravelMinutes': instance.shuttleTravelMinutes,
  'bookableCapacity': instance.bookableCapacity,
};

_SmsGatewayModel _$SmsGatewayModelFromJson(Map<String, dynamic> json) =>
    _SmsGatewayModel(
      baseUrl: json['baseUrl'] as String?,
      login: json['login'] as String,
      senderPhone: json['senderPhone'] as String?,
      linkedAt: json['linkedAt'] as String?,
    );

Map<String, dynamic> _$SmsGatewayModelToJson(_SmsGatewayModel instance) =>
    <String, dynamic>{
      'baseUrl': instance.baseUrl,
      'login': instance.login,
      'senderPhone': instance.senderPhone,
      'linkedAt': instance.linkedAt,
    };

_SmsSettingsModel _$SmsSettingsModelFromJson(Map<String, dynamic> json) =>
    _SmsSettingsModel(
      mode: json['mode'] as String? ?? 'none',
      brevoAvailable: json['brevoAvailable'] as bool? ?? false,
      gateway: json['gateway'] == null
          ? null
          : SmsGatewayModel.fromJson(json['gateway'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$SmsSettingsModelToJson(_SmsSettingsModel instance) =>
    <String, dynamic>{
      'mode': instance.mode,
      'brevoAvailable': instance.brevoAvailable,
      'gateway': instance.gateway,
    };

_SmsMonthModel _$SmsMonthModelFromJson(Map<String, dynamic> json) =>
    _SmsMonthModel(
      sent: (json['sent'] as num?)?.toInt() ?? 0,
      failed: (json['failed'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$SmsMonthModelToJson(_SmsMonthModel instance) =>
    <String, dynamic>{'sent': instance.sent, 'failed': instance.failed};

_SmsStatusModel _$SmsStatusModelFromJson(Map<String, dynamic> json) =>
    _SmsStatusModel(
      mode: json['mode'] as String? ?? 'none',
      linkedAt: json['linkedAt'] as String?,
      lastSentAt: json['lastSentAt'] as String?,
      senderPhone: json['senderPhone'] as String?,
      month: json['month'] == null
          ? const SmsMonthModel()
          : SmsMonthModel.fromJson(json['month'] as Map<String, dynamic>),
      pending: (json['pending'] as num?)?.toInt() ?? 0,
      pendingStale: json['pendingStale'] as bool? ?? false,
      lastError: json['lastError'] as String?,
    );

Map<String, dynamic> _$SmsStatusModelToJson(_SmsStatusModel instance) =>
    <String, dynamic>{
      'mode': instance.mode,
      'linkedAt': instance.linkedAt,
      'lastSentAt': instance.lastSentAt,
      'senderPhone': instance.senderPhone,
      'month': instance.month,
      'pending': instance.pending,
      'pendingStale': instance.pendingStale,
      'lastError': instance.lastError,
    };

_SmsTestModel _$SmsTestModelFromJson(Map<String, dynamic> json) =>
    _SmsTestModel(outcome: json['outcome'] as String);

Map<String, dynamic> _$SmsTestModelToJson(_SmsTestModel instance) =>
    <String, dynamic>{'outcome': instance.outcome};
