import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../models/public_models.dart';

part 'public_client.g.dart';

/// The traveller site's read-only API: airports, search, parking pages, payment settings. The same
/// endpoints as the site: every price and availability comes from here.
@RestApi()
abstract class PublicClient {
  factory PublicClient(Dio dio, {String? baseUrl}) = _PublicClient;

  @GET('public/airports')
  Future<List<AirportModel>> airports();

  @GET('public/search')
  Future<SearchResponseModel> search({
    @Query('airport') required String airport,
    @Query('arrivalAt') required String arrivalAt,
    @Query('returnAt') required String returnAt,
  });

  @GET('public/airports/{airport}/parkings/{slug}')
  Future<ParkingResponseModel> parking({
    @Path('airport') required String airport,
    @Path('slug') required String slug,
    @Query('arrivalAt') String? arrivalAt,
    @Query('returnAt') String? returnAt,
  });

  @GET('public/airports/{slug}/live')
  Future<AirportLiveModel> live({@Path('slug') required String slug});

  @GET('public/payments/config')
  Future<PaymentsConfigModel> paymentsConfig();
}
