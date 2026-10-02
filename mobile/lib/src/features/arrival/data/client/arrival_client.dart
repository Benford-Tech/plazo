import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/arrival_model.dart';

part 'arrival_client.g.dart';

/// "Prévenir de son arrivée" (see the API's Arrivals docs). Authenticated by the booking's
/// manage token, in the x-booking-token header.
@RestApi()
abstract class ArrivalClient {
  factory ArrivalClient(Dio dio, {String? baseUrl}) = _ArrivalClient;

  @GET('public/bookings/{reference}/arrival')
  Future<ArrivalModel> getArrival({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @POST('public/bookings/{reference}/arrival/start')
  Future<ArrivalModel> start({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });

  @POST('public/bookings/{reference}/arrival/position')
  Future<ArrivalModel> sendPosition({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });

  @POST('public/bookings/{reference}/arrival/announce')
  Future<ArrivalModel> announce({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });

  @POST('public/bookings/{reference}/arrival/at-meeting-point')
  Future<ArrivalModel> atMeetingPoint({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });

  @POST('public/bookings/{reference}/arrival/stop')
  Future<ArrivalModel> stop({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });
}
