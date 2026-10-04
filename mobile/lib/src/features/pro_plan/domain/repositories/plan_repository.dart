import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/plan_data_source.dart';
import '../../data/models/plan_models.dart';

abstract class PlanRepository {
  Future<Either<Failure, ParkingSummaryModel>> getParking();
  Future<Either<Failure, ParkingPlanViewModel>> getPlan(String parkingId);
  Future<Either<Failure, ParkingPlanViewModel>> saveOutline(String parkingId, List<List<double>> ring);
  Future<Either<Failure, PlanEstimateModel>> estimate(String parkingId);
  Future<Either<Failure, ParkingPlanViewModel>> generate(String parkingId, String layout);
  Future<Either<Failure, List<GeocodeResultModel>>> geocode(String query);
}

class PlanRepositoryImpl implements PlanRepository {
  PlanRepositoryImpl(this._dataSource);

  final PlanDataSource _dataSource;

  @override
  Future<Either<Failure, ParkingSummaryModel>> getParking() => _dataSource.getParking().makeRequest();

  @override
  Future<Either<Failure, ParkingPlanViewModel>> getPlan(String parkingId) => _dataSource.getPlan(parkingId).makeRequest();

  @override
  Future<Either<Failure, ParkingPlanViewModel>> saveOutline(String parkingId, List<List<double>> ring) =>
      _dataSource.saveOutline(parkingId, ring).makeRequest();

  @override
  Future<Either<Failure, PlanEstimateModel>> estimate(String parkingId) => _dataSource.estimate(parkingId).makeRequest();

  @override
  Future<Either<Failure, ParkingPlanViewModel>> generate(String parkingId, String layout) => _dataSource.generate(parkingId, layout).makeRequest();

  @override
  Future<Either<Failure, List<GeocodeResultModel>>> geocode(String query) => _dataSource.geocode(query).makeRequest();
}
