import '../../../../core/error/failure.dart';
import '../../../../services/location_service.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/occupation_data_source.dart';
import '../../data/models/occupation_models.dart';

abstract class OccupationRepository {
  Future<Either<Failure, OccupationBoardModel>> board(String parkingId);
  Future<Either<Failure, List<OccupantModel>>> search(String parkingId, String query);
  Future<Either<Failure, OccupantModel>> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly, GeoPosition? car});
}

class OccupationRepositoryImpl implements OccupationRepository {
  OccupationRepositoryImpl(this._dataSource);

  final OccupationDataSource _dataSource;

  @override
  Future<Either<Failure, OccupationBoardModel>> board(String parkingId) => _dataSource.board(parkingId).makeRequest();

  @override
  Future<Either<Failure, List<OccupantModel>>> search(String parkingId, String query) => _dataSource.search(parkingId, query).makeRequest();

  @override
  Future<Either<Failure, OccupantModel>> assign(String reservationId, {required String? spotId, String? keyHook, bool keysOnly = false, GeoPosition? car}) =>
      _dataSource.assign(reservationId, spotId: spotId, keyHook: keyHook, keysOnly: keysOnly, car: car).makeRequest();
}
