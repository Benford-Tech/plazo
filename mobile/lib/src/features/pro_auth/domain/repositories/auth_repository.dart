import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../data/datasources/auth_data_source.dart';
import '../../data/models/staff_model.dart';

abstract class AuthRepository {
  Future<Either<Failure, StaffModel>> login({required String email, required String password});
  Future<Either<Failure, StaffModel?>> restore();
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, StaffModel>> setPost(String post);
  Future<Either<Failure, StaffModel>> setVehicle(String? vehicleId);
  Future<Either<Failure, StaffModel>> updateName({required String firstName, required String lastName});
}

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._dataSource);

  final AuthDataSource _dataSource;

  @override
  Future<Either<Failure, StaffModel>> login({required String email, required String password}) =>
      _dataSource.login(email: email, password: password).makeRequest();

  @override
  Future<Either<Failure, StaffModel?>> restore() => _dataSource.restore().makeRequest();

  @override
  Future<Either<Failure, void>> logout() => _dataSource.logout().makeRequest();

  @override
  Future<Either<Failure, StaffModel>> setPost(String post) => _dataSource.setPost(post).makeRequest();

  @override
  Future<Either<Failure, StaffModel>> setVehicle(String? vehicleId) => _dataSource.setVehicle(vehicleId).makeRequest();

  @override
  Future<Either<Failure, StaffModel>> updateName({required String firstName, required String lastName}) =>
      _dataSource.updateName(firstName: firstName, lastName: lastName).makeRequest();
}
