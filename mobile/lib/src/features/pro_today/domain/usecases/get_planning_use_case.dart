import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/planning_model.dart';
import '../repositories/planning_repository.dart';

class GetPlanningUseCase with UseCase<PlanningModel, NoParams> {
  GetPlanningUseCase(this._repository);

  final PlanningRepository _repository;

  @override
  Future<Either<Failure, PlanningModel>> call(NoParams params) => _repository.getPlanning();
}
