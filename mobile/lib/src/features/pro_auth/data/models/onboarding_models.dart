import 'package:freezed_annotation/freezed_annotation.dart';

import 'staff_model.dart';

part 'onboarding_models.freezed.dart';
part 'onboarding_models.g.dart';

/// GET /internal/auth/providers (13/10/2026): which sign-ins the API can verify (its keys are set).
@freezed
abstract class ProvidersModel with _$ProvidersModel {
  const factory ProvidersModel({@Default(false) bool apple, @Default(false) bool google}) = _ProvidersModel;

  factory ProvidersModel.fromJson(Map<String, dynamic> json) => _$ProvidersModelFromJson(json);
}

/// The Apple or Google identity of a person who has not joined a parking yet (« Connecté avec Apple · email »).
@freezed
abstract class IdentityModel with _$IdentityModel {
  const IdentityModel._();

  const factory IdentityModel({
    /// apple, google
    required String provider,
    String? email,

    /// An Apple « Masquer mon adresse e-mail » relay address.
    @Default(false) bool isPrivateEmail,
    @Default('') String firstName,
    @Default('') String lastName,
  }) = _IdentityModel;

  factory IdentityModel.fromJson(Map<String, dynamic> json) => _$IdentityModelFromJson(json);

  bool get isApple => provider == 'apple';
}

/// A join request as its author sees it (JoinRequestView): « Demande envoyée », « Demande refusée »…
@freezed
abstract class JoinRequestModel with _$JoinRequestModel {
  const JoinRequestModel._();

  const factory JoinRequestModel({
    required String id,

    /// pending, accepted, refused, cancelled, expired
    required String status,
    @Default('') String operatorName,
    @Default('') String firstName,
    @Default('') String lastName,

    /// agent, driver, valet (« Je suis »)
    @Default('agent') String wishedRole,

    /// The role the manager gave, once accepted.
    String? role,
    required DateTime createdAt,
    DateTime? decidedAt,
    required DateTime expiresAt,
  }) = _JoinRequestModel;

  factory JoinRequestModel.fromJson(Map<String, dynamic> json) => _$JoinRequestModelFromJson(json);

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';

  /// Refused, expired or cancelled: « Taper un nouveau code ».
  bool get isClosed => !isPending && !isAccepted;
  String get name => [firstName, lastName].where((s) => s.trim().isNotEmpty).join(' ');
}

/// GET /internal/auth/onboarding, and the onboarding answer of a sign-in: the identity and its latest request.
@freezed
abstract class OnboardingModel with _$OnboardingModel {
  const factory OnboardingModel({required IdentityModel identity, JoinRequestModel? request}) = _OnboardingModel;

  factory OnboardingModel.fromJson(Map<String, dynamic> json) => _$OnboardingModelFromJson(json);
}

/// `{ request }` of POST …/onboarding/join and DELETE …/onboarding/request.
@freezed
abstract class JoinRequestEnvelope with _$JoinRequestEnvelope {
  const factory JoinRequestEnvelope({required JoinRequestModel request}) = _JoinRequestEnvelope;

  factory JoinRequestEnvelope.fromJson(Map<String, dynamic> json) => _$JoinRequestEnvelopeFromJson(json);
}

/// The answer of POST /internal/auth/apple or /google: a member signs in, anyone else starts « Rejoindre un parking ».
sealed class IdentitySignInResult {
  const IdentitySignInResult();
}

class IdentitySignedIn extends IdentitySignInResult {
  const IdentitySignedIn(this.staff);
  final StaffModel staff;
}

class IdentityOnboarding extends IdentitySignInResult {
  const IdentityOnboarding(this.onboarding);
  final OnboardingModel onboarding;
}
