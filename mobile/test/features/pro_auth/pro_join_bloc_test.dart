import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_auth/data/datasources/onboarding_data_source.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/identity_use_cases.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_join_bloc.dart';

class MockGet extends Mock implements GetOnboardingUseCase {}

class MockJoin extends Mock implements JoinParkingUseCase {}

class MockCancel extends Mock implements CancelJoinRequestUseCase {}

class MockOpen extends Mock implements OpenJoinedSessionUseCase {}

const identity = IdentityModel(provider: 'apple', email: 'julie.m@icloud.com', firstName: 'Julie', lastName: 'Martin');
JoinRequestModel request(String status) => JoinRequestModel(
  id: 'jr1',
  status: status,
  operatorName: 'Parkair Lyon',
  firstName: 'Julie',
  lastName: 'Martin',
  wishedRole: 'driver',
  createdAt: DateTime.utc(2026, 10, 13, 7, 38),
  expiresAt: DateTime.utc(2026, 10, 20, 7, 38),
);
const julie = StaffModel(id: 'st9', name: 'Julie Martin', email: 'julie.m@icloud.com', role: 'driver');

void main() {
  late MockGet get;
  late MockJoin join;
  late MockCancel cancel;
  late MockOpen open;

  setUpAll(() {
    registerFallbackValue(NoParams());
    registerFallbackValue(const JoinInput(code: '', firstName: '', lastName: '', wishedRole: 'agent'));
  });

  setUp(() {
    get = MockGet();
    join = MockJoin();
    cancel = MockCancel();
    open = MockOpen();
    when(() => get(any())).thenAnswer((_) async => const Right(OnboardingModel(identity: identity)));
  });

  ProJoinBloc build({Duration poll = const Duration(milliseconds: 40)}) => ProJoinBloc(get, join, cancel, open, pollInterval: poll);

  group('le formulaire', () {
    blocTest<ProJoinBloc, ProJoinState>(
      'code incomplet, nom vide, aucun poste : rien n’est envoyé, chaque erreur à sa place',
      build: build,
      act: (b) => b.add(const ProJoinSubmitted(code: 'K7QM2-XP9', firstName: 'Julie', lastName: ' ', wishedRole: null)),
      expect: () => [
        isA<ProJoinState>().having((s) => s.codeError, 'code', 'join_code_incomplete').having((s) => s.fieldErrors, 'fields', {
          'lastName': 'required',
          'wishedRole': 'wished_role_required',
        }),
      ],
      verify: (_) => verifyNever(() => join(any())),
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'code faux ou d’hier : le même message, sous le code',
      build: build,
      setUp: () => when(() => join(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'join_code_invalid'))),
      act: (b) => b.add(const ProJoinSubmitted(code: 'k7qm2-xp9tb', firstName: 'Julie', lastName: 'Martin', wishedRole: 'driver')),
      skip: 1,
      expect: () => [
        isA<ProJoinState>()
            .having((s) => s.codeError, 'code', 'join_code_invalid')
            .having((s) => s.errorCode, 'general', isNull)
            .having((s) => s.view, 'view', ProJoinView.form),
      ],
      verify: (_) => verify(() => join(const JoinInput(code: 'K7QM2XP9TB', firstName: 'Julie', lastName: 'Martin', wishedRole: 'driver'))).called(1),
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'trop d’essais, e-mail déjà pris : message général',
      build: build,
      setUp: () => when(() => join(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 429, code: 'too_many_attempts'))),
      act: (b) => b.add(const ProJoinSubmitted(code: 'K7QM2XP9TD', firstName: 'Julie', lastName: 'Martin', wishedRole: 'driver')),
      skip: 1,
      expect: () => [isA<ProJoinState>().having((s) => s.errorCode, 'general', 'too_many_attempts').having((s) => s.codeError, 'code', isNull)],
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'refus d’un champ par l’API : sous le champ',
      build: build,
      setUp: () =>
          when(() => join(any()))
              .thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'firstName': 'invalid_name'}))),
      act: (b) => b.add(const ProJoinSubmitted(code: 'K7QM2XP9TD', firstName: 'J0lie', lastName: 'Martin', wishedRole: 'driver')),
      skip: 1,
      expect: () => [
        isA<ProJoinState>().having((s) => s.fieldErrors, 'fields', {'firstName': 'invalid_name'}).having((s) => s.errorCode, 'general', isNull),
      ],
    );
  });

  group('l’attente du gérant', () {
    blocTest<ProJoinBloc, ProJoinState>(
      'demande envoyée : « Demande envoyée », puis l’API redemandée toutes les 10 s (ici 40 ms)',
      build: build,
      setUp: () {
        when(() => join(any())).thenAnswer((_) async => Right(request('pending')));
        when(() => get(any())).thenAnswer((_) async => Right(OnboardingModel(identity: identity, request: request('pending'))));
      },
      act: (b) async {
        b.add(const ProJoinSubmitted(code: 'K7QM2XP9TD', firstName: 'Julie', lastName: 'Martin', wishedRole: 'driver'));
        await Future<void>.delayed(const Duration(milliseconds: 150));
      },
      verify: (b) {
        expect(b.state.view, ProJoinView.waiting);
        verify(() => get(any())).called(greaterThanOrEqualTo(2));
      },
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'en arrière-plan : plus de question à l’API ; au retour, une tout de suite',
      build: build,
      seed: () => ProJoinState(identity: identity, request: request('pending')),
      setUp: () => when(() => get(any())).thenAnswer((_) async => Right(OnboardingModel(identity: identity, request: request('pending')))),
      act: (b) async {
        b.add(const ProJoinPaused());
        await Future<void>.delayed(const Duration(milliseconds: 150));
        verifyNever(() => get(any()));
        b.add(const ProJoinResumed());
        await Future<void>.delayed(const Duration(milliseconds: 10));
      },
      verify: (_) => verify(() => get(any())).called(greaterThanOrEqualTo(1)),
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'le gérant accepte : la session s’ouvre',
      build: build,
      setUp: () {
        when(() => get(any())).thenAnswer((_) async => Right(OnboardingModel(identity: identity, request: request('accepted'))));
        when(() => open(any())).thenAnswer((_) async => const Right(julie));
      },
      act: (b) => b.add(ProJoinStarted(OnboardingModel(identity: identity, request: request('pending')))),
      wait: const Duration(milliseconds: 20),
      verify: (b) {
        expect(b.state.view, ProJoinView.accepted);
        expect(b.state.session, julie);
        verify(() => open(any())).called(1);
      },
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'déjà acceptée à l’ouverture de l’app : la session s’ouvre sans attendre',
      build: build,
      setUp: () => when(() => open(any())).thenAnswer((_) async => const Right(julie)),
      act: (b) => b.add(ProJoinStarted(OnboardingModel(identity: identity, request: request('accepted')))),
      verify: (b) {
        expect(b.state.session, julie);
        verifyNever(() => get(any()));
      },
    );

    blocTest<ProJoinBloc, ProJoinState>(
      'refusée : « Demande refusée », puis « Taper un nouveau code » rouvre le formulaire',
      build: build,
      setUp: () => when(() => get(any())).thenAnswer((_) async => Right(OnboardingModel(identity: identity, request: request('refused')))),
      act: (b) async {
        b.add(const ProJoinStarted());
        await Future<void>.delayed(const Duration(milliseconds: 10));
        expect(b.state.view, ProJoinView.closed);
        b.add(const ProJoinNewCodeRequested());
      },
      verify: (b) => expect(b.state.view, ProJoinView.form),
    );

    blocTest<ProJoinBloc, ProJoinState>(
      '« Annuler la demande » : retour au formulaire, plus de question à l’API',
      build: build,
      seed: () => ProJoinState(identity: identity, request: request('pending')),
      setUp: () => when(() => cancel(any())).thenAnswer((_) async => Right(request('cancelled'))),
      act: (b) async {
        b.add(const ProJoinCancelRequested());
        await Future<void>.delayed(const Duration(milliseconds: 150));
      },
      verify: (b) {
        expect(b.state.view, ProJoinView.form);
        expect(b.state.cancelState, ViewState.success);
        verifyNever(() => get(any()));
      },
    );
  });
}
