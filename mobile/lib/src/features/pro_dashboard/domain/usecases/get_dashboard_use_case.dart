import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/dashboard_model.dart';
import '../repositories/dashboard_repository.dart';

class GetDashboardUseCase with UseCase<DashboardModel, NoParams> {
  GetDashboardUseCase(this._repository);

  final DashboardRepository _repository;

  @override
  Future<Either<Failure, DashboardModel>> call(NoParams params) => _repository.getDashboard();
}
