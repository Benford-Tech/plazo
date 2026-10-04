import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/reservation_models.dart';

part 'reservations_client.g.dart';

@RestApi()
abstract class ReservationsClient {
  factory ReservationsClient(Dio dio, {String? baseUrl}) = _ReservationsClient;

  @GET('internal/reservations')
  Future<ReservationPageModel> list(@Query('q') String? q, @Query('page') int page, @Query('limit') int limit);

  @GET('internal/reservations/{id}')
  Future<ReservationModel> get(@Path('id') String id);

  @POST('internal/reservations')
  Future<DataEnvelope<ReservationModel>> create(@Body() Map<String, dynamic> body);

  @PATCH('internal/reservations/{id}')
  Future<DataEnvelope<ReservationModel>> update(@Path('id') String id, @Body() Map<String, dynamic> body);

  @POST('internal/reservations/{id}/status')
  Future<DataEnvelope<ReservationModel>> changeStatus(@Path('id') String id, @Body() Map<String, dynamic> body);

  @POST('internal/imports/email')
  Future<ParsedEmailModel> parseEmail(@Body() Map<String, dynamic> body);

  @GET('internal/capacity')
  Future<CapacityPreviewModel> capacity(@Query('arrivalAt') String arrivalAt, @Query('returnAt') String returnAt, @Query('excludeId') String? excludeId);
}

/// `{ message, data }` envelope of the write routes.
class DataEnvelope<T> {
  const DataEnvelope(this.data);
  final T data;

  factory DataEnvelope.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) => DataEnvelope(fromJsonT(json['data']));
}
