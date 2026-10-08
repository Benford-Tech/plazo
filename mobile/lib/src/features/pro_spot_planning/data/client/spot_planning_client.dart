import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/files_planning_models.dart';
import '../models/spot_planning_models.dart';

part 'spot_planning_client.g.dart';

@RestApi()
abstract class SpotPlanningClient {
  factory SpotPlanningClient(Dio dio, {String? baseUrl}) = _SpotPlanningClient;

  @GET('internal/parkings/{id}/spot-planning')
  Future<SpotPlanningModel> get(@Path('id') String parkingId, @Query('from') String from, @Query('days') int days);

  @POST('internal/parkings/{id}/spot-planning/preassign')
  Future<PreassignEnvelopeModel> preassign(@Path('id') String parkingId, @Query('from') String from, @Query('days') int days);

  // Planning des files (08/10/2026): the returns to come against the room of the files.
  @GET('internal/parkings/{id}/files/planning')
  Future<FilesPlanningModel> filesPlanning(@Path('id') String parkingId, @Query('from') String from, @Query('days') int days);

  /// Body `{ day: 'YYYY-MM-DD' | null }`: keeps an empty file for that return day by hand, or frees it.
  @PUT('internal/parkings/{id}/files/{fileId}/keep')
  Future<KeptFileResponse> keepFile(@Path('id') String parkingId, @Path('fileId') String fileId, @Body() Map<String, dynamic> body);
}
