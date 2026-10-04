import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/return_model.dart';

part 'return_client.g.dart';

/// "Votre retour aujourd'hui" (see the API's Return day docs). Authenticated by the booking's manage
/// token, in the x-booking-token header.
@RestApi()
abstract class ReturnClient {
  factory ReturnClient(Dio dio, {String? baseUrl}) = _ReturnClient;

  @GET('public/bookings/{reference}/return')
  Future<TravellerReturnModel> getReturn({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @POST('public/bookings/{reference}/return/landed')
  Future<TravellerReturnModel> landed({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  /// The position only serves the routing call (never stored); without it, from the terminal.
  @GET('public/bookings/{reference}/return/route')
  Future<WalkingRouteModel> route({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Query('lat') double? lat,
    @Query('lng') double? lng,
  });

  /// The parking's running shuttles during the stay; polled every 12 s while the booking is open.
  @GET('public/bookings/{reference}/shuttles')
  Future<StayShuttlesModel> stayShuttles({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  /// Polled every 10 s while the shuttle is on its way.
  @GET('public/bookings/{reference}/shuttle')
  Future<ShuttleStatusModel> shuttle({@Path('reference') required String reference, @Header('x-booking-token') required String token});
}
