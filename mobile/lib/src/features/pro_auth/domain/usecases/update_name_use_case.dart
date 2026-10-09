import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';

class UpdateNameParams extends Equatable {
  const UpdateNameParams({required this.firstName, required this.lastName});
  final String firstName;
  final String lastName;
  @override
  List<Object?> get props => [firstName, lastName];
}

/// « Votre nom » (09/10/2026): one's own first and last name; the server rebuilds the display name.
class UpdateNameUseCase with UseCase<StaffModel, UpdateNameParams> {
  UpdateNameUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, StaffModel>> call(UpdateNameParams params) => _repository.updateName(firstName: params.firstName, lastName: params.lastName);
}
