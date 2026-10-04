import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/occupation_models.dart';

part 'occupation_client.g.dart';

/// Bloc 2, step "Occupation" in the app (04/10/2026).
@RestApi()
abstract class OccupationClient {
  factory OccupationClient(Dio dio, {String? baseUrl}) = _OccupationClient;

  @GET('internal/parkings/{id}/occupation')
  Future<OccupationBoardModel> board(@Path('id') String parkingId);

  @GET('internal/parkings/{id}/occupation/search')
  Future<VehicleSearchModel> search(@Path('id') String parkingId, @Query('q') String query);

  @POST('internal/reservations/{id}/spot')
  Future<AssignedModel> assign(@Path('id') String reservationId, @Body() Map<String, dynamic> body);
}
