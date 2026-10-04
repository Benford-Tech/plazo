import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/plan_models.dart';

part 'plan_client.g.dart';

/// Bloc 2, step "Plan", from the app (M-A, 04/10/2026): the engine runs on the server.
@RestApi()
abstract class PlanClient {
  factory PlanClient(Dio dio, {String? baseUrl}) = _PlanClient;

  @GET('internal/parking')
  Future<ParkingSummaryModel> getParking();

  @GET('internal/parkings/{id}/plan')
  Future<ParkingPlanViewModel> getPlan(@Path('id') String parkingId);

  @PATCH('internal/parkings/{id}/plan')
  Future<PlanViewEnvelope> updatePlan(@Path('id') String parkingId, @Body() Map<String, dynamic> patch);

  @POST('internal/parkings/{id}/plan/estimate')
  Future<PlanEstimateModel> estimate(@Path('id') String parkingId);

  @POST('internal/parkings/{id}/plan/generate')
  Future<PlanViewEnvelope> generate(@Path('id') String parkingId, @Body() Map<String, dynamic> body);

  @GET('internal/geo/geocode')
  Future<GeocodeResponseModel> geocode(@Query('q') String query);
}
