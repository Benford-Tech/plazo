import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/public_booking_model.dart';

part 'booking_client.g.dart';

/// The traveller's booking, managed without an account: the manage token travels in the
/// x-booking-token header (never in the URL).
@RestApi()
abstract class BookingClient {
  factory BookingClient(Dio dio, {String? baseUrl}) = _BookingClient;

  @POST('public/bookings/lookup')
  Future<BookingAccessModel> lookup({@Body() required Map<String, dynamic> body});

  @GET('public/bookings/{reference}')
  Future<PublicBookingModel> getBooking({@Path('reference') required String reference, @Header('x-booking-token') required String token});
}
