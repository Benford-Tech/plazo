import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';

class LoginParams extends Equatable {
  const LoginParams({required this.email, required this.password});
  final String email;
  final String password;
  @override
  List<Object?> get props => [email];
}

class LoginUseCase with UseCase<StaffModel, LoginParams> {
  LoginUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, StaffModel>> call(LoginParams params) => _repository.login(email: params.email, password: params.password);
}
