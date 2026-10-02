import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../repositories/auth_repository.dart';

class LogoutUseCase with UseCase<void, NoParams> {
  LogoutUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, void>> call(NoParams params) => _repository.logout();
}
