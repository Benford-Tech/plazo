import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/planning_data_source.dart';
import '../../data/models/planning_model.dart';
import '../../data/models/staff_signal_model.dart';

abstract class PlanningRepository {
  Future<Either<Failure, PlanningModel>> getPlanning({String? date});
  Future<Either<Failure, LiveArrivalsModel>> getLiveArrivals();
}

class PlanningRepositoryImpl implements PlanningRepository {
  PlanningRepositoryImpl(this._dataSource);

  final PlanningDataSource _dataSource;

  @override
  Future<Either<Failure, PlanningModel>> getPlanning({String? date}) => _dataSource.getPlanning(date: date).makeRequest();

  @override
  Future<Either<Failure, LiveArrivalsModel>> getLiveArrivals() => _dataSource.getLiveArrivals().makeRequest();
}
