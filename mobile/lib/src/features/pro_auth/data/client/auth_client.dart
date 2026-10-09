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
}
