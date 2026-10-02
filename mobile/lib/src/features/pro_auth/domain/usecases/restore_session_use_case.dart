import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';

/// The staff member of the saved session (null: signed out).
class RestoreSessionUseCase with UseCase<StaffModel?, NoParams> {
  RestoreSessionUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, StaffModel?>> call(NoParams params) => _repository.restore();
}
