import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_signal_model.dart';
import '../repositories/planning_repository.dart';

class GetLiveArrivalsUseCase with UseCase<LiveArrivalsModel, NoParams> {
  GetLiveArrivalsUseCase(this._repository);

  final PlanningRepository _repository;

  @override
  Future<Either<Failure, LiveArrivalsModel>> call(NoParams params) => _repository.getLiveArrivals();
}
