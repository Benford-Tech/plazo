import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/dashboard_model.dart';

part 'dashboard_client.g.dart';

@RestApi()
abstract class DashboardClient {
  factory DashboardClient(Dio dio, {String? baseUrl}) = _DashboardClient;

  /// The pro home: figures, services, alerts, vehicles (polled every 30 s).
  @GET('internal/dashboard')
  Future<DashboardModel> getDashboard();
}
