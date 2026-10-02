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
}
