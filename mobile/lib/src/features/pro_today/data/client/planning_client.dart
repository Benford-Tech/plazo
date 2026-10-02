import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/planning_model.dart';
import '../models/staff_signal_model.dart';

part 'planning_client.g.dart';

@RestApi()
abstract class PlanningClient {
  factory PlanningClient(Dio dio, {String? baseUrl}) = _PlanningClient;

  @GET('internal/planning')
  Future<PlanningModel> getPlanning();

  /// Polled every 12 s (no websockets on Vercel).
  @GET('internal/arrivals/live')
  Future<LiveArrivalsModel> getLiveArrivals();
}
