import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/networking/networking.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/domain/repositories/auth_repository.dart';
import 'package:parking_app/src/features/pro_auth/domain/repositories/onboarding_repository.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/identity_use_cases.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/login_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/logout_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/restore_session_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_post_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_vehicle_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/update_name_use_case.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/services/identity_sign_in_service.dart';

class MockLogin extends Mock implements LoginUseCase {}

class MockRestore extends Mock implements RestoreSessionUseCase {}

class MockLogout extends Mock implements LogoutUseCase {}

class MockSetPost extends Mock implements SetPostUseCase {}

class MockSetVehicle extends Mock implements SetVehicleUseCase {}

class MockUpdateName extends Mock implements UpdateNameUseCase {}

class MockProviders extends Mock implements GetProvidersUseCase {}

class MockSignIn extends Mock implements ProviderSignInUseCase {}

class MockRestoreOnboarding extends Mock implements RestoreOnboardingUseCase {}

class MockLogoutOnboarding extends Mock implements OnboardingLogoutUseCase {}

class MockDeleteIdentity extends Mock implements DeleteIdentityUseCase {}

class MockLink extends Mock implements LinkIdentityUseCase {}

class MockUnlink extends Mock implements UnlinkIdentityUseCase {}

class MockLeave extends Mock implements LeaveParkingUseCase {}

class MockDeleteAccount extends Mock implements DeleteAccountUseCase {}

class MockOnboardingRepository extends Mock implements OnboardingRepository {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockIdentityService extends Mock implements IdentitySignInService {}

const julie = StaffModel(
  id: 'st9',
  name: 'Julie Martin',
  firstName: 'Julie',
  lastName: 'Martin',
  email: 'julie.m@icloud.com',
  role: 'driver',
  operatorName: 'Parkair Lyon',
  hasPassword: false,
  identities: [StaffIdentityModel(provider: 'apple', email: 'julie.m@icloud.com')],
);
const appleIdentity = IdentityModel(provider: 'apple', email: 'julie.m@icloud.com', firstName: 'Julie', lastName: 'Martin');
final pending = JoinRequestModel(
  id: 'jr1',
  status: 'pending',
  operatorName: 'Parkair Lyon',
  firstName: 'Julie',
  lastName: 'Martin',
  wishedRole: 'driver',
  createdAt: DateTime.utc(2026, 10, 13, 7, 38),
  expiresAt: DateTime.utc(2026, 10, 20, 7, 38),
);
const credential = AppleCredential(identityToken: 'id.token', authorizationCode: 'fresh-code', rawNonce: 'raw');

void main() {
  late MockRestore restore;
  late MockLogout logout;
  late MockProviders providers;
  late MockSignIn signIn;
  late MockRestoreOnboarding restoreOnboarding;
  late MockLogoutOnboarding logoutOnboarding;
  late MockDeleteIdentity deleteIdentity;
  late MockLink link;
  late MockUnlink unlink;
  late MockLeave leave;
  late MockDeleteAccount deleteAccount;
  late SessionEvents session;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const DeleteAccountParams());
    registerFallbackValue(credential);
  });

  setUp(() {
    restore = MockRestore();
    logout = MockLogout();
    providers = MockProviders();
    signIn = MockSignIn();
    restoreOnboarding = MockRestoreOnboarding();
    logoutOnboarding = MockLogoutOnboarding();
    deleteIdentity = MockDeleteIdentity();
    link = MockLink();
    unlink = MockUnlink();
    leave = MockLeave();
    deleteAccount = MockDeleteAccount();
    session = SessionEvents();
  });

  ProAuthBloc build() => ProAuthBloc(
    MockLogin(),
    restore,
    logout,
    MockSetPost(),
    MockSetVehicle(),
    MockUpdateName(),
    session,
    identity: IdentityUseCases(
      providers: providers,
      signIn: signIn,
      restoreOnboarding: restoreOnboarding,
      logoutOnboarding: logoutOnboarding,
      deleteIdentity: deleteIdentity,
      link: link,
      unlink: unlink,
      leave: leave,
      deleteAccount: deleteAccount,
    ),
  );

  group('démarrage', () {
    blocTest<ProAuthBloc, ProAuthState>(
      'la session du personnel d’abord : connecté sans regarder l’inscription',
      build: build,
      setUp: () => when(() => restore(any())).thenAnswer((_) async => const Right(julie)),
      act: (b) => b.add(const ProAuthRestoreRequested()),
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedIn)],
      verify: (_) => verifyNever(() => restoreOnboarding(any())),
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'sans session du personnel, l’inscription gardée sur le téléphone : « Rejoindre un parking »',
      build: build,
      setUp: () {
        when(() => restore(any())).thenAnswer((_) async => const Right(null));
        when(() => restoreOnboarding(any())).thenAnswer((_) async => Right(OnboardingModel(identity: appleIdentity, request: pending)));
      },
      act: (b) => b.add(const ProAuthRestoreRequested()),
      expect: () => [
        isA<ProAuthState>()
            .having((s) => s.status, 'status', ProAuthStatus.onboarding)
            .having((s) => s.onboarding?.request?.operatorName, 'parking', 'Parkair Lyon'),
      ],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'ni l’un ni l’autre : déconnecté',
      build: build,
      setUp: () {
        when(() => restore(any())).thenAnswer((_) async => const Right(null));
        when(() => restoreOnboarding(any())).thenAnswer((_) async => const Right(null));
      },
      act: (b) => b.add(const ProAuthRestoreRequested()),
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedOut)],
    );
  });

  group('« Continuer avec Apple / Google »', () {
    blocTest<ProAuthBloc, ProAuthState>(
      'les boutons suivent ce que le téléphone et l’API permettent',
      build: build,
      setUp: () => when(() => providers(any())).thenAnswer((_) async => const Right(ProvidersModel(apple: true))),
      act: (b) => b.add(const ProAuthProvidersRequested()),
      expect: () => [isA<ProAuthState>().having((s) => s.providers, 'providers', const ProvidersModel(apple: true))],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'un membre : connecté comme avec un mot de passe',
      build: build,
      setUp: () => when(() => signIn('apple')).thenAnswer((_) async => const Right(IdentitySignedIn(julie))),
      act: (b) => b.add(const ProAuthProviderSignInRequested('apple')),
      expect: () => [
        isA<ProAuthState>().having((s) => s.signingInWith, 'with', 'apple').having((s) => s.signInState, 'state', ViewState.processing),
        isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedIn).having((s) => s.staff, 'staff', julie),
      ],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'pas encore membre : inscription, avec l’identité',
      build: build,
      setUp: () => when(() => signIn('google')).thenAnswer(
        (_) async => const Right(
          IdentityOnboarding(
            OnboardingModel(
              identity: IdentityModel(provider: 'google', email: 'karim.b@gmail.com'),
            ),
          ),
        ),
      ),
      act: (b) => b.add(const ProAuthProviderSignInRequested('google')),
      skip: 1,
      expect: () => [
        isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.onboarding).having((s) => s.onboarding?.identity.provider, 'provider', 'google'),
      ],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'feuille d’Apple fermée : rien à dire',
      build: build,
      setUp: () => when(() => signIn('apple')).thenAnswer((_) async => const Left(ServerFailure(code: signInCancelled))),
      act: (b) => b.add(const ProAuthProviderSignInRequested('apple')),
      skip: 1,
      expect: () => [isA<ProAuthState>().having((s) => s.signInState, 'state', ViewState.idle).having((s) => s.errorCode, 'error', isNull)],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'compte suspendu : le code de l’API pour l’écran',
      build: build,
      setUp: () => when(() => signIn('apple')).thenAnswer((_) async => const Left(ServerFailure(statusCode: 403, code: 'account_suspended'))),
      act: (b) => b.add(const ProAuthProviderSignInRequested('apple')),
      skip: 1,
      expect: () => [isA<ProAuthState>().having((s) => s.errorCode, 'error', 'account_suspended').having((s) => s.status, 'status', ProAuthStatus.unknown)],
    );
  });

  group('inscription en cours', () {
    blocTest<ProAuthBloc, ProAuthState>(
      'accepté : session ouverte ; « Utiliser un autre compte » ferme l’inscription, pas une session du personnel',
      build: build,
      seed: () => ProAuthState(
        status: ProAuthStatus.onboarding,
        onboarding: OnboardingModel(identity: appleIdentity, request: pending),
      ),
      setUp: () => when(() => logoutOnboarding(any())).thenAnswer((_) async => const Right(null)),
      act: (b) => b.add(const ProAuthLogoutRequested()),
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedOut)],
      verify: (_) {
        verify(() => logoutOnboarding(any())).called(1);
        verifyNever(() => logout(any()));
      },
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'le gérant a accepté : la session du personnel s’ouvre',
      build: build,
      seed: () => const ProAuthState(
        status: ProAuthStatus.onboarding,
        onboarding: OnboardingModel(identity: appleIdentity),
      ),
      act: (b) => b.add(const ProAuthJoined(julie)),
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedIn).having((s) => s.onboarding, 'onboarding', isNull)],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      'jeton d’inscription refusé par l’API : retour à la connexion',
      build: build,
      seed: () => const ProAuthState(
        status: ProAuthStatus.onboarding,
        onboarding: OnboardingModel(identity: appleIdentity),
      ),
      act: (b) => session.notifyOnboardingExpired(),
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedOut).having((s) => s.errorCode, 'error', 'session_expired')],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      '« Supprimer mon compte » avant d’avoir rejoint : l’identité seulement, confirmée par Apple',
      build: build,
      seed: () => const ProAuthState(
        status: ProAuthStatus.onboarding,
        onboarding: OnboardingModel(identity: appleIdentity),
      ),
      setUp: () => when(() => deleteIdentity('apple')).thenAnswer((_) async => const Right(null)),
      act: (b) => b.add(const ProAuthDeleteRequested(provider: 'apple')),
      expect: () => [
        isA<ProAuthState>().having((s) => s.deleteState, 'delete', ViewState.processing),
        isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedOut).having((s) => s.deleteState, 'delete', ViewState.success),
      ],
      verify: (_) => verifyNever(() => deleteAccount(any())),
    );
  });

  group('Mon compte', () {
    blocTest<ProAuthBloc, ProAuthState>(
      '« Lier mon identifiant Apple » : le compte rendu par l’API',
      build: build,
      seed: () => const ProAuthState(
        status: ProAuthStatus.signedIn,
        staff: StaffModel(id: 'st1', name: 'Claire Dubois', email: 'c@parkair.fr', role: 'manager'),
      ),
      setUp: () => when(() => link('apple')).thenAnswer((_) async => const Right(julie)),
      act: (b) => b.add(const ProAuthIdentityLinkRequested('apple')),
      skip: 1,
      expect: () => [
        isA<ProAuthState>()
            .having((s) => s.accountNotice, 'notice', 'account.linked')
            .having((s) => s.staff?.identity('apple')?.email, 'apple', 'julie.m@icloud.com'),
      ],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      '« Retirer » la dernière façon d’entrer : refusé (sign_in_required)',
      build: build,
      seed: () => const ProAuthState(status: ProAuthStatus.signedIn, staff: julie),
      setUp: () => when(() => unlink('apple')).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'sign_in_required'))),
      act: (b) => b.add(const ProAuthIdentityUnlinkRequested('apple')),
      skip: 1,
      expect: () => [isA<ProAuthState>().having((s) => s.linkState, 'link', ViewState.error).having((s) => s.errorCode, 'error', 'sign_in_required')],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      '« Quitter ce parking » avec Apple : directement « Rejoindre un parking »',
      build: build,
      seed: () => const ProAuthState(status: ProAuthStatus.signedIn, staff: julie, providers: ProvidersModel(apple: true)),
      setUp: () => when(() => leave(any())).thenAnswer((_) async => const Right(OnboardingModel(identity: appleIdentity))),
      act: (b) => b.add(const ProAuthLeaveRequested()),
      skip: 1,
      expect: () => [
        isA<ProAuthState>()
            .having((s) => s.status, 'status', ProAuthStatus.onboarding)
            .having((s) => s.staff, 'staff', isNull)
            .having((s) => s.providers.apple, 'providers kept', isTrue)
            .having((s) => s.leaveState, 'leave', ViewState.success),
      ],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      '« Quitter ce parking » : le dernier gérant ne peut pas',
      build: build,
      seed: () => const ProAuthState(status: ProAuthStatus.signedIn, staff: julie),
      setUp: () => when(() => leave(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'last_manager'))),
      act: (b) => b.add(const ProAuthLeaveRequested()),
      skip: 1,
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedIn).having((s) => s.errorCode, 'error', 'last_manager')],
    );

    blocTest<ProAuthBloc, ProAuthState>(
      '« Supprimer mon compte » (membre) : confirmé par Apple, puis déconnecté',
      build: build,
      seed: () => const ProAuthState(status: ProAuthStatus.signedIn, staff: julie),
      setUp: () => when(() => deleteAccount(any())).thenAnswer((_) async => const Right(null)),
      act: (b) => b.add(const ProAuthDeleteRequested(provider: 'apple')),
      skip: 1,
      expect: () => [isA<ProAuthState>().having((s) => s.status, 'status', ProAuthStatus.signedOut).having((s) => s.staff, 'staff', isNull)],
      verify: (_) {
        verify(() => deleteAccount(const DeleteAccountParams(provider: 'apple'))).called(1);
        verifyNever(() => deleteIdentity(any()));
      },
    );
  });

  group('cas d’usage', () {
    late MockOnboardingRepository onboardingRepo;
    late MockAuthRepository authRepo;
    late MockIdentityService service;

    setUp(() {
      onboardingRepo = MockOnboardingRepository();
      authRepo = MockAuthRepository();
      service = MockIdentityService();
      when(() => service.signOut()).thenAnswer((_) async {});
    });

    test('un téléphone sans Apple ni Google ne demande rien à l’API (web, captures des stores)', () async {
      when(() => service.appleSupported).thenReturn(false);
      when(() => service.googleSupported).thenReturn(false);
      final result = await GetProvidersUseCase(onboardingRepo, service)(NoParams());
      expect(result.fold((_) => null, (p) => p), const ProvidersModel());
      verifyNever(() => onboardingRepo.providers());
    });

    test('Apple sur l’iPhone seulement quand l’API sait le vérifier ; Google jamais sur l’iPhone', () async {
      when(() => service.appleSupported).thenReturn(true);
      when(() => service.googleSupported).thenReturn(false);
      when(() => onboardingRepo.providers()).thenAnswer((_) async => const Right(ProvidersModel(apple: true, google: true)));
      final result = await GetProvidersUseCase(onboardingRepo, service)(NoParams());
      expect(result.fold((_) => null, (p) => p), const ProvidersModel(apple: true));
    });

    test('feuille fermée : « cancelled », rien n’est envoyé', () async {
      when(() => service.apple()).thenThrow(const IdentitySignInCancelled());
      final result = await ProviderSignInUseCase(onboardingRepo, service)('apple');
      expect(result.fold((f) => f.code, (_) => null), signInCancelled);
      verifyNever(() => onboardingRepo.signInWithApple(any()));
    });

    test('Apple répond : le jeton, le nonce brut et le nom partent à l’API', () async {
      when(() => service.apple()).thenAnswer((_) async => credential);
      when(() => onboardingRepo.signInWithApple(any())).thenAnswer((_) async => const Right(IdentitySignedIn(julie)));
      final result = await ProviderSignInUseCase(onboardingRepo, service)('apple');
      expect(result.isRight, isTrue);
      verify(() => onboardingRepo.signInWithApple(credential)).called(1);
    });

    test('supprimer un compte sans mot de passe avec Apple : le code frais part pour la révocation', () async {
      when(() => service.apple()).thenAnswer((_) async => credential);
      when(
        () => authRepo.deleteAccount(
          password: any(named: 'password'),
          appleAuthorizationCode: any(named: 'appleAuthorizationCode'),
          googleIdToken: any(named: 'googleIdToken'),
        ),
      ).thenAnswer((_) async => const Right(null));
      final result = await DeleteAccountUseCase(authRepo, service)(const DeleteAccountParams(provider: 'apple'));
      expect(result.isRight, isTrue);
      verify(() => authRepo.deleteAccount(appleAuthorizationCode: 'fresh-code')).called(1);
      verify(() => service.signOut()).called(1);
    });

    test('supprimer avec le mot de passe : ni Apple ni Google ne sont sollicités', () async {
      when(
        () => authRepo.deleteAccount(
          password: any(named: 'password'),
          appleAuthorizationCode: any(named: 'appleAuthorizationCode'),
          googleIdToken: any(named: 'googleIdToken'),
        ),
      ).thenAnswer((_) async => const Right(null));
      await DeleteAccountUseCase(authRepo, service)(const DeleteAccountParams(password: 'secret', provider: 'apple'));
      verify(() => authRepo.deleteAccount(password: 'secret')).called(1);
      verifyNever(() => service.apple());
    });

    test('identité jamais rattachée, Apple : confirmée par Apple pour révoquer ; Google : rien de plus', () async {
      when(() => service.appleSupported).thenReturn(true);
      when(() => service.apple()).thenAnswer((_) async => credential);
      when(() => onboardingRepo.deleteIdentity(authorizationCode: any(named: 'authorizationCode'))).thenAnswer((_) async => const Right(null));
      await DeleteIdentityUseCase(onboardingRepo, service)('apple');
      verify(() => onboardingRepo.deleteIdentity(authorizationCode: 'fresh-code')).called(1);
      await DeleteIdentityUseCase(onboardingRepo, service)('google');
      verify(() => onboardingRepo.deleteIdentity()).called(1);
    });
  });

  group('service natif', () {
    test('jamais sur le web, Apple sur iOS avec la capacité, Google sur Android avec l’identifiant client', () {
      expect(NativeIdentitySignInService(appleEnabled: true, platform: TargetPlatform.iOS).appleSupported, isTrue);
      expect(NativeIdentitySignInService(appleEnabled: false, platform: TargetPlatform.iOS).appleSupported, isFalse);
      expect(NativeIdentitySignInService(appleEnabled: true, platform: TargetPlatform.android).appleSupported, isFalse);
      expect(NativeIdentitySignInService(googleServerClientId: 'web.apps.googleusercontent.com', platform: TargetPlatform.android).googleSupported, isTrue);
      expect(NativeIdentitySignInService(googleServerClientId: '', platform: TargetPlatform.android).googleSupported, isFalse);
      expect(NativeIdentitySignInService(googleServerClientId: 'x', platform: TargetPlatform.iOS).googleSupported, isFalse);
    });

    test('nonce : aléatoire, et son SHA-256 en hexadécimal pour Apple', () {
      final a = newRawNonce();
      expect(a, isNot(newRawNonce()));
      expect(a.length, greaterThanOrEqualTo(40));
      expect(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
  });
}
