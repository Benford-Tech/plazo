import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/identity_sign_in_service.dart';
import '../../data/datasources/onboarding_data_source.dart';
import '../../data/models/onboarding_models.dart';
import '../../data/models/staff_model.dart';
import '../repositories/auth_repository.dart';
import '../repositories/onboarding_repository.dart';

/// The person closed Apple's or Google's sheet: the screens say nothing.
const signInCancelled = 'cancelled';

/// Apple or Google gave no credential (network, build without the capability…).
const signInProviderFailed = 'provider_failed';

/// Asks Apple or Google for a credential; their errors become failures with [signInCancelled] or
/// [signInProviderFailed] (never a token in a failure).
Future<Either<Failure, T>> _native<T>(Future<T> Function() ask) async {
  try {
    return Right(await ask());
  } on IdentitySignInCancelled {
    return const Left(ServerFailure(code: signInCancelled));
  } catch (_) {
    return const Left(ServerFailure(code: signInProviderFailed));
  }
}

/// Runs `next` with the value of `first`, or passes its failure on.
Future<Either<Failure, R>> _andThen<T, R>(Either<Failure, T> first, Future<Either<Failure, R>> Function(T value) next) =>
    first.fold((failure) async => Left<Failure, R>(failure), next);

/// The sign-ins this phone offers (13/10/2026): Apple on an iPhone built with the capability, Google on Android and
/// iPhone (22/10/2026) with the client ids, each one only when the API can verify it. Nothing is asked when the phone offers none.
class GetProvidersUseCase with UseCase<ProvidersModel, NoParams> {
  GetProvidersUseCase(this._repository, this._signIn);
  final OnboardingRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, ProvidersModel>> call(NoParams params) async {
    if (!_signIn.appleSupported && !_signIn.googleSupported) return const Right(ProvidersModel());
    final result = await _repository.providers();
    return result.fold(
      Left.new,
      (server) => Right(ProvidersModel(apple: _signIn.appleSupported && server.apple, google: _signIn.googleSupported && server.google)),
    );
  }
}

/// « Continuer avec Apple / Google »: the provider's sheet, then the API (a member signs in, anyone else onboards).
class ProviderSignInUseCase with UseCase<IdentitySignInResult, String> {
  ProviderSignInUseCase(this._repository, this._signIn);
  final OnboardingRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, IdentitySignInResult>> call(String provider) async => provider == 'apple'
      ? _andThen(await _native(_signIn.apple), _repository.signInWithApple)
      : _andThen(await _native(_signIn.googleIdToken), _repository.signInWithGoogle);
}

/// The onboarding session saved on this phone, if any (start-up, after the staff session).
class RestoreOnboardingUseCase with UseCase<OnboardingModel?, NoParams> {
  RestoreOnboardingUseCase(this._repository);
  final OnboardingRepository _repository;

  @override
  Future<Either<Failure, OnboardingModel?>> call(NoParams params) => _repository.restore();
}

/// « Utiliser un autre compte »: ends the onboarding session and forgets the Google account chosen on this phone.
class OnboardingLogoutUseCase with UseCase<void, NoParams> {
  OnboardingLogoutUseCase(this._repository, this._signIn);
  final OnboardingRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, void>> call(NoParams params) async {
    final result = await _repository.logout();
    await _signIn.signOut();
    return result;
  }
}

/// « Supprimer mon compte » before joining a parking. An Apple identity confirms with Apple (its fresh code lets the
/// API revoke Plazo's access); a Google one needs nothing more.
class DeleteIdentityUseCase with UseCase<void, String> {
  DeleteIdentityUseCase(this._repository, this._signIn);
  final OnboardingRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, void>> call(String provider) async {
    final result = provider == 'apple' && _signIn.appleSupported
        ? await _andThen(await _native(_signIn.apple), (credential) => _repository.deleteIdentity(authorizationCode: credential.authorizationCode))
        : await _repository.deleteIdentity();
    if (result.isRight) await _signIn.signOut();
    return result;
  }
}

/// Mon compte › « Lier mon identifiant Apple » / « Lier mon compte Google ».
class LinkIdentityUseCase with UseCase<StaffModel, String> {
  LinkIdentityUseCase(this._repository, this._signIn);
  final AuthRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, StaffModel>> call(String provider) async => provider == 'apple'
      ? _andThen(await _native(_signIn.apple), _repository.linkApple)
      : _andThen(await _native(_signIn.googleIdToken), _repository.linkGoogle);
}

/// Mon compte › Connexion › « Retirer ».
class UnlinkIdentityUseCase with UseCase<StaffModel, String> {
  UnlinkIdentityUseCase(this._repository, this._signIn);
  final AuthRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, StaffModel>> call(String provider) async {
    final result = await _repository.unlinkIdentity(provider);
    if (result.isRight && provider == 'google') await _signIn.signOut();
    return result;
  }
}

/// « Quitter ce parking »: the onboarding session that follows when Apple or Google was linked (null: signed out).
class LeaveParkingUseCase with UseCase<OnboardingModel?, NoParams> {
  LeaveParkingUseCase(this._repository);
  final AuthRepository _repository;

  @override
  Future<Either<Failure, OnboardingModel?>> call(NoParams params) => _repository.leave();
}

class DeleteAccountParams extends Equatable {
  const DeleteAccountParams({this.password, this.provider});

  /// The account's password, when it has one (the API then asks for it).
  final String? password;

  /// Otherwise the provider to confirm with: apple (a fresh code) or google (a fresh ID token).
  final String? provider;

  @override
  List<Object?> get props => [provider];
}

/// « Supprimer mon compte » (Apple 5.1.1(v), Google Play): the API anonymises the member; the phone forgets it.
class DeleteAccountUseCase with UseCase<void, DeleteAccountParams> {
  DeleteAccountUseCase(this._repository, this._signIn);
  final AuthRepository _repository;
  final IdentitySignInService _signIn;

  @override
  Future<Either<Failure, void>> call(DeleteAccountParams params) async {
    final password = (params.password ?? '').isEmpty ? null : params.password;
    final Either<Failure, void> result;
    if (password == null && params.provider == 'apple') {
      result = await _andThen(await _native(_signIn.apple), (c) => _repository.deleteAccount(appleAuthorizationCode: c.authorizationCode));
    } else if (password == null && params.provider == 'google') {
      result = await _andThen(await _native(_signIn.googleIdToken), (token) => _repository.deleteAccount(googleIdToken: token));
    } else {
      result = await _repository.deleteAccount(password: password);
    }
    if (result.isRight) await _signIn.signOut();
    return result;
  }
}

/// What ProAuthBloc needs for Apple and Google (13/10/2026), in one piece: the older screens and tests build the
/// bloc without it.
class IdentityUseCases {
  const IdentityUseCases({
    required this.providers,
    required this.signIn,
    required this.restoreOnboarding,
    required this.logoutOnboarding,
    required this.deleteIdentity,
    required this.link,
    required this.unlink,
    required this.leave,
    required this.deleteAccount,
    this.device = const ProvidersModel(),
  });

  final GetProvidersUseCase providers;
  final ProviderSignInUseCase signIn;
  final RestoreOnboardingUseCase restoreOnboarding;
  final OnboardingLogoutUseCase logoutOnboarding;
  final DeleteIdentityUseCase deleteIdentity;
  final LinkIdentityUseCase link;
  final UnlinkIdentityUseCase unlink;
  final LeaveParkingUseCase leave;
  final DeleteAccountUseCase deleteAccount;

  /// What this phone and build offer without asking the API (Apple on an iPhone built with the capability, Google on
  /// Android with the client id): « Supprimer mon compte » confirms with them even when the API's answer is missing.
  final ProvidersModel device;
}

// « Rejoindre un parking » (ProJoinBloc).

class GetOnboardingUseCase with UseCase<OnboardingModel, NoParams> {
  GetOnboardingUseCase(this._repository);
  final OnboardingRepository _repository;

  @override
  Future<Either<Failure, OnboardingModel>> call(NoParams params) => _repository.state();
}

class JoinParkingUseCase with UseCase<JoinRequestModel, JoinInput> {
  JoinParkingUseCase(this._repository);
  final OnboardingRepository _repository;

  @override
  Future<Either<Failure, JoinRequestModel>> call(JoinInput params) => _repository.join(params);
}

class CancelJoinRequestUseCase with UseCase<JoinRequestModel, NoParams> {
  CancelJoinRequestUseCase(this._repository);
  final OnboardingRepository _repository;

  @override
  Future<Either<Failure, JoinRequestModel>> call(NoParams params) => _repository.cancelRequest();
}

/// The staff session once a manager accepted the request.
class OpenJoinedSessionUseCase with UseCase<StaffModel, NoParams> {
  OpenJoinedSessionUseCase(this._repository);
  final OnboardingRepository _repository;

  @override
  Future<Either<Failure, StaffModel>> call(NoParams params) => _repository.openSession();
}
