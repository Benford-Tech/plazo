import '../client/public_client.dart';
import '../models/public_models.dart';

abstract class PublicDataSource {
  Future<List<AirportModel>> airports();
  Future<SearchResponseModel> search({required String airport, required String arrivalAt, required String returnAt});
  Future<ParkingResponseModel> parking({required String airport, required String slug, String? arrivalAt, String? returnAt});
  Future<PaymentsConfigModel> paymentsConfig();
  Future<AirportLiveModel> live(String slug);
}

class PublicDataSourceImpl implements PublicDataSource {
  PublicDataSourceImpl(this.client);

  final PublicClient client;

  @override
  Future<List<AirportModel>> airports() => client.airports();

  @override
  Future<SearchResponseModel> search({required String airport, required String arrivalAt, required String returnAt}) =>
      client.search(airport: airport, arrivalAt: arrivalAt, returnAt: returnAt);

  @override
  Future<ParkingResponseModel> parking({required String airport, required String slug, String? arrivalAt, String? returnAt}) =>
      client.parking(airport: airport, slug: slug, arrivalAt: arrivalAt, returnAt: returnAt);

  @override
  Future<PaymentsConfigModel> paymentsConfig() => client.paymentsConfig();

  @override
  Future<AirportLiveModel> live(String slug) => client.live(slug: slug);
}
