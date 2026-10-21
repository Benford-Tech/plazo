import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/extras_models.dart';

part 'extras_client.g.dart';

/// Services for the car (21/10/2026). The traveller's routes carry the booking's token in the x-booking-token header.
@RestApi()
abstract class ExtrasClient {
  factory ExtrasClient(Dio dio, {String? baseUrl}) = _ExtrasClient;

  // ---- Traveller (Plazo) ----

  @GET('public/bookings/{reference}/extras')
  Future<TravellerExtrasModel> traveller(@Path('reference') String reference, @Header('x-booking-token') String token);

  /// { kind }
  @POST('public/bookings/{reference}/extras')
  Future<ExtraOrderResponseModel> order(
    @Path('reference') String reference,
    @Header('x-booking-token') String token,
    @Body() Map<String, dynamic> body,
  );

  @POST('public/bookings/{reference}/extras/{id}/sync')
  Future<TravellerExtrasModel> sync(@Path('reference') String reference, @Header('x-booking-token') String token, @Path('id') String id);

  @DELETE('public/bookings/{reference}/extras/{id}')
  Future<TravellerExtrasModel> abandon(@Path('reference') String reference, @Header('x-booking-token') String token, @Path('id') String id);

  // ---- Staff (Plazo Pro) ----

  @GET('internal/reservations/{id}/extras')
  Future<StaffExtrasModel> staff(@Path('id') String id);

  @POST('internal/reservations/{id}/extras/{extraId}/done')
  Future<StaffExtrasModel> done(@Path('id') String id, @Path('extraId') String extraId);

  /// { reason? }
  @POST('internal/reservations/{id}/extras/{extraId}/refuse')
  Future<StaffExtrasModel> refuse(@Path('id') String id, @Path('extraId') String extraId, @Body() Map<String, dynamic> body);

  @GET('internal/parkings/{id}/extras')
  Future<ExtraSettingsModel> settings(@Path('id') String parkingId);

  /// { leadHours?, offers?: [{ kind, enabled, priceCents }] }
  @PUT('internal/parkings/{id}/extras')
  Future<ExtraSettingsModel> updateSettings(@Path('id') String parkingId, @Body() Map<String, dynamic> body);
}
