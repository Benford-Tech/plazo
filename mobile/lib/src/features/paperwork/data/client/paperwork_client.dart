import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/paperwork_models.dart';

part 'paperwork_client.g.dart';

/// « Contrat signé et état des lieux » (19/10/2026). The staff's routes use the staff session; the traveller's carry
/// the booking's token in the x-booking-token header. The photos (bytes in, bytes out) go through the data source's Dio.
@RestApi()
abstract class PaperworkClient {
  factory PaperworkClient(Dio dio, {String? baseUrl}) = _PaperworkClient;

  // ---- Staff (Plazo Pro) ----

  @GET('internal/reservations/{id}/paperwork')
  Future<PaperworkModel> staff(@Path('id') String id);

  @POST('internal/reservations/{id}/contract/code')
  Future<CodeSentModel> staffSendCode(@Path('id') String id);

  /// { code } or { strokes }.
  @POST('internal/reservations/{id}/contract/sign')
  Future<PaperworkModel> staffSign(@Path('id') String id, @Body() Map<String, dynamic> body);

  @POST('internal/reservations/{id}/inspections/{kind}')
  Future<PaperworkModel> start(@Path('id') String id, @Path('kind') String kind);

  @PATCH('internal/reservations/{id}/inspections/{kind}')
  Future<PaperworkModel> update(@Path('id') String id, @Path('kind') String kind, @Body() Map<String, dynamic> body);

  @DELETE('internal/reservations/{id}/inspections/{kind}/photos/{photoId}')
  Future<PaperworkModel> removePhoto(@Path('id') String id, @Path('kind') String kind, @Path('photoId') String photoId);

  @POST('internal/reservations/{id}/inspections/{kind}/complete')
  Future<PaperworkModel> complete(@Path('id') String id, @Path('kind') String kind);

  /// { decision, reserveText?, strokes }: signed on the staff's phone.
  @POST('internal/reservations/{id}/inspections/{kind}/answer')
  Future<PaperworkModel> staffAnswer(@Path('id') String id, @Path('kind') String kind, @Body() Map<String, dynamic> body);

  // ---- Traveller ----

  @GET('public/bookings/{reference}/paperwork')
  Future<PaperworkModel> traveller(@Path('reference') String reference, @Header('x-booking-token') String token);

  @POST('public/bookings/{reference}/contract/code')
  Future<CodeSentModel> travellerSendCode(@Path('reference') String reference, @Header('x-booking-token') String token);

  @POST('public/bookings/{reference}/contract/sign')
  Future<PaperworkModel> travellerSign(@Path('reference') String reference, @Header('x-booking-token') String token, @Body() Map<String, dynamic> body);

  /// The traveller's own photos (20/10/2026). The draft starts with the first photo or note.
  @PATCH('public/bookings/{reference}/inspections/{kind}/mine')
  Future<PaperworkModel> travellerUpdate(
    @Path('reference') String reference,
    @Header('x-booking-token') String token,
    @Path('kind') String kind,
    @Body() Map<String, dynamic> body,
  );

  @DELETE('public/bookings/{reference}/inspections/{kind}/mine/photos/{photoId}')
  Future<PaperworkModel> travellerRemovePhoto(
    @Path('reference') String reference,
    @Header('x-booking-token') String token,
    @Path('kind') String kind,
    @Path('photoId') String photoId,
  );

  @POST('public/bookings/{reference}/inspections/{kind}/mine/complete')
  Future<PaperworkModel> travellerComplete(@Path('reference') String reference, @Header('x-booking-token') String token, @Path('kind') String kind);

  @POST('public/bookings/{reference}/inspections/{kind}/answer')
  Future<PaperworkModel> travellerAnswer(
    @Path('reference') String reference,
    @Header('x-booking-token') String token,
    @Path('kind') String kind,
    @Body() Map<String, dynamic> body,
  );
}
