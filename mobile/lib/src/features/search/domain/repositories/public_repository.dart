import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/public_data_source.dart';
import '../../data/models/public_models.dart';

abstract class PublicRepository {
  Future<Either<Failure, List<AirportModel>>> airports();
  Future<Either<Failure, SearchResponseModel>> search({required String airport, required String arrivalAt, required String returnAt});
  Future<Either<Failure, ParkingResponseModel>> parking({required String airport, required String slug, String? arrivalAt, String? returnAt});
  Future<Either<Failure, PaymentsConfigModel>> paymentsConfig();
}

class PublicRepositoryImpl implements PublicRepository {
  PublicRepositoryImpl(this._dataSource);

  final PublicDataSource _dataSource;

  @override
  Future<Either<Failure, List<AirportModel>>> airports() => _dataSource.airports().makeRequest();

  @override
  Future<Either<Failure, SearchResponseModel>> search({required String airport, required String arrivalAt, required String returnAt}) =>
      _dataSource.search(airport: airport, arrivalAt: arrivalAt, returnAt: returnAt).makeRequest();

  @override
  Future<Either<Failure, ParkingResponseModel>> parking({required String airport, required String slug, String? arrivalAt, String? returnAt}) =>
      _dataSource.parking(airport: airport, slug: slug, arrivalAt: arrivalAt, returnAt: returnAt).makeRequest();

  @override
  Future<Either<Failure, PaymentsConfigModel>> paymentsConfig() => _dataSource.paymentsConfig().makeRequest();
}
