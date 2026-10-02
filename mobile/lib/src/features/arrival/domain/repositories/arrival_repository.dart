import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/arrival_data_source.dart';
import '../../data/models/arrival_model.dart';

abstract class ArrivalRepository {
  Future<Either<Failure, ArrivalModel>> getArrival(String reference);
  Future<Either<Failure, ArrivalModel>> start(String reference, ArrivalKind kind);
  Future<Either<Failure, ArrivalModel>> sendPosition(String reference, GeoPosition position);
  Future<Either<Failure, ArrivalModel>> announce(String reference, ArrivalKind kind, int minutes);
  Future<Either<Failure, ArrivalModel>> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position);
  Future<Either<Failure, ArrivalModel>> stop(String reference, ArrivalKind? kind);
}

class ArrivalRepositoryImpl implements ArrivalRepository {
  ArrivalRepositoryImpl(this._dataSource);

  final ArrivalDataSource _dataSource;

  @override
  Future<Either<Failure, ArrivalModel>> getArrival(String reference) => _dataSource.getArrival(reference).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> start(String reference, ArrivalKind kind) => _dataSource.start(reference, kind).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> sendPosition(String reference, GeoPosition position) =>
      _dataSource.sendPosition(reference, position).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> announce(String reference, ArrivalKind kind, int minutes) =>
      _dataSource.announce(reference, kind, minutes).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position) =>
      _dataSource.atMeetingPoint(reference, kind, position).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> stop(String reference, ArrivalKind? kind) => _dataSource.stop(reference, kind).makeRequest();
}
