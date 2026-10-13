import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/onboarding_models.dart';

part 'onboarding_client.g.dart';

/// Plazo Pro sign-in with Apple or Google, then « Rejoindre un parking » (13/10/2026). The sign-in routes are
/// public; the /internal/auth/onboarding* ones carry the onboarding token (OnboardingTokenInterceptor), never the
/// staff's.
@RestApi()
abstract class OnboardingClient {
  factory OnboardingClient(Dio dio, {String? baseUrl}) = _OnboardingClient;

  @GET('internal/auth/providers')
  Future<ProvidersModel> providers();

  /// { identityToken, rawNonce, givenName?, familyName? } → { status: signed_in, tokenData, user } or
  /// { status: onboarding, onboardingToken, expiresAt, identity, request }.
  @POST('internal/auth/apple')
  Future<dynamic> apple(@Body() Map<String, dynamic> body);

  /// { idToken } → same answers as Apple.
  @POST('internal/auth/google')
  Future<dynamic> google(@Body() Map<String, dynamic> body);

  @GET('internal/auth/onboarding')
  Future<OnboardingModel> state();

  /// { code, firstName, lastName, wishedRole } → 201 { request }.
  @POST('internal/auth/onboarding/join')
  Future<JoinRequestEnvelope> join(@Body() Map<String, dynamic> body);

  /// { tokenData, user } once a manager accepted the request.
  @POST('internal/auth/onboarding/session')
  Future<dynamic> session();

  /// « Annuler la demande » → { request } (cancelled).
  @DELETE('internal/auth/onboarding/request')
  Future<JoinRequestEnvelope> cancelRequest();

  @POST('internal/auth/onboarding/logout')
  Future<void> logout();

  /// « Supprimer mon compte » before joining: { authorizationCode? } (Apple: a fresh code, to revoke its access).
  @DELETE('internal/auth/onboarding')
  Future<void> deleteIdentity(@Body() Map<String, dynamic> body);
}
