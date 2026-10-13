import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/identity_sign_in_service.dart';
import '../../data/datasources/onboarding_data_source.dart';
import '../../data/models/onboarding_models.dart';
import '../../data/models/staff_model.dart';

/// Plazo Pro sign-in with Apple or Google, and « Rejoindre un parking » (13/10/2026).
abstract class OnboardingRepository {
  Future<Either<Failure, ProvidersModel>> providers();
  Future<Either<Failure, IdentitySignInResult>> signInWithApple(AppleCredential credential);
  Future<Either<Failure, IdentitySignInResult>> signInWithGoogle(String idToken);
  Future<Either<Failure, OnboardingModel?>> restore();
  Future<Either<Failure, OnboardingModel>> state();
  Future<Either<Failure, JoinRequestModel>> join(JoinInput input);
  Future<Either<Failure, StaffModel>> openSession();
  Future<Either<Failure, JoinRequestModel>> cancelRequest();
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, void>> deleteIdentity({String? authorizationCode});
}

class OnboardingRepositoryImpl implements OnboardingRepository {
  OnboardingRepositoryImpl(this._source);

  final OnboardingDataSource _source;

  @override
  Future<Either<Failure, ProvidersModel>> providers() => _source.providers().makeRequest();

  @override
  Future<Either<Failure, IdentitySignInResult>> signInWithApple(AppleCredential credential) => _source.signInWithApple(credential).makeRequest();

  @override
  Future<Either<Failure, IdentitySignInResult>> signInWithGoogle(String idToken) => _source.signInWithGoogle(idToken).makeRequest();

  @override
  Future<Either<Failure, OnboardingModel?>> restore() => _source.restore().makeRequest();

  @override
  Future<Either<Failure, OnboardingModel>> state() => _source.state().makeRequest();

  @override
  Future<Either<Failure, JoinRequestModel>> join(JoinInput input) => _source.join(input).makeRequest();

  @override
  Future<Either<Failure, StaffModel>> openSession() => _source.openSession().makeRequest();

  @override
  Future<Either<Failure, JoinRequestModel>> cancelRequest() => _source.cancelRequest().makeRequest();

  @override
  Future<Either<Failure, void>> logout() => _source.logout().makeRequest();

  @override
  Future<Either<Failure, void>> deleteIdentity({String? authorizationCode}) => _source.deleteIdentity(authorizationCode: authorizationCode).makeRequest();
}
