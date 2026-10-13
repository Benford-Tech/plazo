import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/staff_model.dart';

part 'auth_client.g.dart';

/// The staff's existing auth routes (the same as the pro space's). Tokens are stored, rotated by
/// StaffTokenInterceptor and revocable on the server.
@RestApi()
abstract class AuthClient {
  factory AuthClient(Dio dio, {String? baseUrl}) = _AuthClient;

  @POST('internal/auth/login')
  Future<dynamic> login({@Body() required Map<String, dynamic> body});

  @POST('internal/auth/logout')
  Future<void> logout();

  @GET('internal/staff/me')
  Future<StaffModel> me();

  /// « Votre nom » (09/10/2026): { firstName, lastName }; answers like GET internal/staff/me.
  @PATCH('internal/staff/me')
  Future<StaffModel> updateMe(@Body() Map<String, dynamic> body);

  /// "Aujourd'hui, je suis…" (R-C): the post held for the day.
  @PATCH('internal/staff/me/post')
  Future<StaffModel> setPost(@Body() Map<String, dynamic> body);

  /// "Mon véhicule aujourd'hui" (V-A): { vehicleId } or { vehicleId: null } to hand it back.
  @PATCH('internal/staff/me/vehicle')
  Future<StaffModel> setVehicle(@Body() Map<String, dynamic> body);

  /// « Lier mon identifiant Apple » (13/10/2026): { identityToken, rawNonce } → { user }.
  @POST('internal/staff/me/identities/apple')
  Future<dynamic> linkApple(@Body() Map<String, dynamic> body);

  /// « Lier mon compte Google »: { idToken } → { user }.
  @POST('internal/staff/me/identities/google')
  Future<dynamic> linkGoogle(@Body() Map<String, dynamic> body);

  /// Removes the Apple or Google sign-in → { user } (409 sign_in_required when it is the last way in).
  @DELETE('internal/staff/me/identities/{provider}')
  Future<dynamic> unlinkIdentity(@Path('provider') String provider);

  /// « Quitter ce parking » → { onboarding: { onboardingToken, expiresAt, identity, request } | null }.
  @POST('internal/staff/me/leave')
  Future<dynamic> leave();

  /// « Supprimer mon compte »: { password? , appleAuthorizationCode?, googleIdToken? } → 204.
  @DELETE('internal/staff/me')
  Future<void> deleteMe(@Body() Map<String, dynamic> body);
}
