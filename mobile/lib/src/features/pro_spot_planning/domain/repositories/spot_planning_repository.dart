import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/spot_planning_data_source.dart';
import '../../data/models/spot_planning_models.dart';

abstract class SpotPlanningRepository {
  Future<Either<Failure, SpotPlanningModel>> get(String parkingId, String from, int days);
  Future<Either<Failure, PreassignResultModel>> preassign(String parkingId, String from, int days);
}

class SpotPlanningRepositoryImpl implements SpotPlanningRepository {
  SpotPlanningRepositoryImpl(this._source);
  final SpotPlanningDataSource _source;

  @override
  Future<Either<Failure, SpotPlanningModel>> get(String parkingId, String from, int days) => _source.get(parkingId, from, days).makeRequest();

  @override
  Future<Either<Failure, PreassignResultModel>> preassign(String parkingId, String from, int days) => _source.preassign(parkingId, from, days).makeRequest();
}
