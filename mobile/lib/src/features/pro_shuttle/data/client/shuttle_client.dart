import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/shuttle_models.dart';

part 'shuttle_client.g.dart';

/// Driver mode (see the API's Shuttle docs). Staff session: the bearer token is added by the
/// interceptor.
@RestApi()
abstract class ShuttleClient {
  factory ShuttleClient(Dio dio, {String? baseUrl}) = _ShuttleClient;

  /// Polled every 12 s while the screen is open.
  @GET('internal/shuttle/pickups')
  Future<PickupsModel> pickups();

  @GET('internal/shuttle/vehicles')
  Future<DataList<ShuttleVehicleModel>> vehicles();

  @GET('internal/shuttle/trips/current')
  Future<CurrentTripModel> current();

  @POST('internal/shuttle/trips')
  Future<CurrentTripModel> start(@Body() Map<String, dynamic> body);

  @POST('internal/shuttle/trips/{id}/position')
  Future<CurrentTripModel> position(@Path('id') String id, @Body() Map<String, dynamic> body);

  @POST('internal/shuttle/trips/{id}/end')
  Future<CurrentTripModel> end(@Path('id') String id);
}

/// `{ data: [...] }` envelopes of the staff routes.
class DataList<T> {
  const DataList(this.data);
  final List<T> data;

  factory DataList.fromJson(Map<String, dynamic> json, T Function(Object? json) fromJsonT) =>
      DataList((json['data'] as List<dynamic>? ?? const []).map(fromJsonT).toList());
}
