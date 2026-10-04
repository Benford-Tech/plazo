import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';

/// "Aujourd'hui, je suis…" (R-C): the post held for the day, stored on the account.
class SetPostUseCase with UseCase<StaffModel, String> {
  SetPostUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, StaffModel>> call(String post) => _repository.setPost(post);
}
