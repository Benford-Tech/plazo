import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/return_data_source.dart';
import '../../data/models/return_model.dart';

abstract class ReturnRepository {
  Future<Either<Failure, TravellerReturnModel>> getReturn(String reference);
  Future<Either<Failure, TravellerReturnModel>> landed(String reference);
  Future<Either<Failure, WalkingRouteModel>> route(String reference, GeoPosition? from);
  Future<Either<Failure, ShuttleStatusModel>> shuttle(String reference);
  Future<Either<Failure, StayShuttlesModel>> stayShuttles(String reference);
  bool get pushSupported;
  Future<Either<Failure, bool>> enableShuttlePushes(String reference);
}

class ReturnRepositoryImpl implements ReturnRepository {
  ReturnRepositoryImpl(this._dataSource);

  final ReturnDataSource _dataSource;

  @override
  Future<Either<Failure, TravellerReturnModel>> getReturn(String reference) => _dataSource.getReturn(reference).makeRequest();

  @override
  bool get pushSupported => _dataSource.pushSupported;

  @override
  Future<Either<Failure, bool>> enableShuttlePushes(String reference) => _dataSource.enableShuttlePushes(reference).makeRequest();

  @override
  Future<Either<Failure, TravellerReturnModel>> landed(String reference) => _dataSource.landed(reference).makeRequest();

  @override
  Future<Either<Failure, WalkingRouteModel>> route(String reference, GeoPosition? from) => _dataSource.route(reference, from).makeRequest();

  @override
  Future<Either<Failure, ShuttleStatusModel>> shuttle(String reference) => _dataSource.shuttle(reference).makeRequest();

  @override
  Future<Either<Failure, StayShuttlesModel>> stayShuttles(String reference) => _dataSource.stayShuttles(reference).makeRequest();
}
