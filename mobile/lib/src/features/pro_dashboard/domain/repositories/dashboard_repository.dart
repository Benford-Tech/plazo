import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/dashboard_data_source.dart';
import '../../data/models/dashboard_model.dart';

abstract class DashboardRepository {
  Future<Either<Failure, DashboardModel>> getDashboard();
}

class DashboardRepositoryImpl implements DashboardRepository {
  DashboardRepositoryImpl(this._dataSource);

  final DashboardDataSource _dataSource;

  @override
  Future<Either<Failure, DashboardModel>> getDashboard() => _dataSource.getDashboard().makeRequest();
}
