import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

/// The arrival block of a booking (moment, meeting point, current signal).
class GetArrivalUseCase with UseCase<ArrivalModel, String> {
  GetArrivalUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(String params) => _repository.getArrival(params);
}
