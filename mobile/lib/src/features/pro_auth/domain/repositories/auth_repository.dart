import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/identity_sign_in_service.dart';
import '../../data/datasources/auth_data_source.dart';
import '../../data/models/onboarding_models.dart';
import '../../data/models/staff_model.dart';

abstract class AuthRepository {
  Future<Either<Failure, StaffModel>> login({required String email, required String password});
  Future<Either<Failure, StaffModel?>> restore();
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, StaffModel>> setPost(String post);
  Future<Either<Failure, StaffModel>> setVehicle(String? vehicleId);
  Future<Either<Failure, StaffModel>> updateName({required String firstName, required String lastName});
  Future<Either<Failure, StaffModel>> linkApple(AppleCredential credential);
  Future<Either<Failure, StaffModel>> linkGoogle(String idToken);
  Future<Either<Failure, StaffModel>> unlinkIdentity(String provider);
  Future<Either<Failure, OnboardingModel?>> leave();
  Future<Either<Failure, void>> deleteAccount({String? password, String? appleAuthorizationCode, String? googleIdToken});
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

  @override
  Future<Either<Failure, StaffModel>> linkApple(AppleCredential credential) => _dataSource.linkApple(credential).makeRequest();

  @override
  Future<Either<Failure, StaffModel>> linkGoogle(String idToken) => _dataSource.linkGoogle(idToken).makeRequest();

  @override
  Future<Either<Failure, StaffModel>> unlinkIdentity(String provider) => _dataSource.unlinkIdentity(provider).makeRequest();

  @override
  Future<Either<Failure, OnboardingModel?>> leave() => _dataSource.leave().makeRequest();

  @override
  Future<Either<Failure, void>> deleteAccount({String? password, String? appleAuthorizationCode, String? googleIdToken}) =>
      _dataSource.deleteAccount(password: password, appleAuthorizationCode: appleAuthorizationCode, googleIdToken: googleIdToken).makeRequest();
}
