import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/arrival_data_source.dart';
import '../../data/models/arrival_model.dart';

abstract class ArrivalRepository {
  Future<Either<Failure, ArrivalModel>> getArrival(String reference);
  Future<Either<Failure, ArrivalModel>> start(String reference, ArrivalKind kind, {String? note});
  Future<Either<Failure, ArrivalModel>> sendPosition(String reference, GeoPosition position);
  Future<Either<Failure, ArrivalModel>> announce(String reference, ArrivalKind kind, int minutes, {String? note});
  Future<Either<Failure, ArrivalModel>> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position, {String? note});
  Future<Either<Failure, ArrivalModel>> stop(String reference, ArrivalKind? kind);
}

class ArrivalRepositoryImpl implements ArrivalRepository {
  ArrivalRepositoryImpl(this._dataSource);

  final ArrivalDataSource _dataSource;

  @override
  Future<Either<Failure, ArrivalModel>> getArrival(String reference) => _dataSource.getArrival(reference).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> start(String reference, ArrivalKind kind, {String? note}) => _dataSource.start(reference, kind, note: note).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> sendPosition(String reference, GeoPosition position) =>
      _dataSource.sendPosition(reference, position).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> announce(String reference, ArrivalKind kind, int minutes, {String? note}) =>
      _dataSource.announce(reference, kind, minutes, note: note).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> atMeetingPoint(String reference, ArrivalKind kind, GeoPosition? position, {String? note}) =>
      _dataSource.atMeetingPoint(reference, kind, position, note: note).makeRequest();

  @override
  Future<Either<Failure, ArrivalModel>> stop(String reference, ArrivalKind? kind) => _dataSource.stop(reference, kind).makeRequest();
}
