// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'onboarding_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ProvidersModel _$ProvidersModelFromJson(Map<String, dynamic> json) =>
    _ProvidersModel(
      apple: json['apple'] as bool? ?? false,
      google: json['google'] as bool? ?? false,
    );

Map<String, dynamic> _$ProvidersModelToJson(_ProvidersModel instance) =>
    <String, dynamic>{'apple': instance.apple, 'google': instance.google};

_IdentityModel _$IdentityModelFromJson(Map<String, dynamic> json) =>
    _IdentityModel(
      provider: json['provider'] as String,
      email: json['email'] as String?,
      isPrivateEmail: json['isPrivateEmail'] as bool? ?? false,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
    );

Map<String, dynamic> _$IdentityModelToJson(_IdentityModel instance) =>
    <String, dynamic>{
      'provider': instance.provider,
      'email': instance.email,
      'isPrivateEmail': instance.isPrivateEmail,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
    };

_JoinRequestModel _$JoinRequestModelFromJson(Map<String, dynamic> json) =>
    _JoinRequestModel(
      id: json['id'] as String,
      status: json['status'] as String,
      operatorName: json['operatorName'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      wishedRole: json['wishedRole'] as String? ?? 'agent',
      role: json['role'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      decidedAt: json['decidedAt'] == null
          ? null
          : DateTime.parse(json['decidedAt'] as String),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );

Map<String, dynamic> _$JoinRequestModelToJson(_JoinRequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'operatorName': instance.operatorName,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'wishedRole': instance.wishedRole,
      'role': instance.role,
      'createdAt': instance.createdAt.toIso8601String(),
      'decidedAt': instance.decidedAt?.toIso8601String(),
      'expiresAt': instance.expiresAt.toIso8601String(),
    };

_OnboardingModel _$OnboardingModelFromJson(Map<String, dynamic> json) =>
    _OnboardingModel(
      identity: IdentityModel.fromJson(
        json['identity'] as Map<String, dynamic>,
      ),
      request: json['request'] == null
          ? null
          : JoinRequestModel.fromJson(json['request'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$OnboardingModelToJson(_OnboardingModel instance) =>
    <String, dynamic>{
      'identity': instance.identity,
      'request': instance.request,
    };

_JoinRequestEnvelope _$JoinRequestEnvelopeFromJson(Map<String, dynamic> json) =>
    _JoinRequestEnvelope(
      request: JoinRequestModel.fromJson(
        json['request'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$JoinRequestEnvelopeToJson(
  _JoinRequestEnvelope instance,
) => <String, dynamic>{'request': instance.request};
