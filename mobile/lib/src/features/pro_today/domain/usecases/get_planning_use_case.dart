import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/planning_model.dart';
import '../repositories/planning_repository.dart';

/// The planning of one day: `date` as YYYY-MM-DD (the parking's day), null for today.
class GetPlanningUseCase with UseCase<PlanningModel, String?> {
  GetPlanningUseCase(this._repository);

  final PlanningRepository _repository;

  @override
  Future<Either<Failure, PlanningModel>> call(String? params) => _repository.getPlanning(date: params);
}
