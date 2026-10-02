import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/public_booking_model.dart';

part 'booking_client.g.dart';

/// The traveller's booking, managed without an account: the manage token travels in the
/// x-booking-token header (never in the URL). The same endpoints as the site.
@RestApi()
abstract class BookingClient {
  factory BookingClient(Dio dio, {String? baseUrl}) = _BookingClient;

  @POST('public/bookings')
  Future<CreatedBookingModel> create({@Body() required Map<String, dynamic> body});

  @POST('public/bookings/lookup')
  Future<BookingAccessModel> lookup({@Body() required Map<String, dynamic> body});

  @GET('public/bookings/{reference}')
  Future<PublicBookingModel> getBooking({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @PATCH('public/bookings/{reference}/flight')
  Future<PublicBookingModel> updateFlight({
    @Path('reference') required String reference,
    @Header('x-booking-token') required String token,
    @Body() required Map<String, dynamic> body,
  });

  @POST('public/bookings/{reference}/payment-intent')
  Future<PaymentIntentModel> paymentIntent({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @POST('public/bookings/{reference}/checkout')
  Future<CheckoutModel> checkout({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @POST('public/bookings/{reference}/release')
  Future<PublicBookingModel> release({@Path('reference') required String reference, @Header('x-booking-token') required String token});

  @POST('public/bookings/{reference}/cancel')
  Future<PublicBookingModel> cancel({@Path('reference') required String reference, @Header('x-booking-token') required String token});
}
