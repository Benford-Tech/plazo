import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/spot_planning_models.dart';

part 'spot_planning_client.g.dart';

@RestApi()
abstract class SpotPlanningClient {
  factory SpotPlanningClient(Dio dio, {String? baseUrl}) = _SpotPlanningClient;

  @GET('internal/parkings/{id}/spot-planning')
  Future<SpotPlanningModel> get(@Path('id') String parkingId, @Query('from') String from, @Query('days') int days);

  @POST('internal/parkings/{id}/spot-planning/preassign')
  Future<PreassignEnvelopeModel> preassign(@Path('id') String parkingId, @Query('from') String from, @Query('days') int days);
}
