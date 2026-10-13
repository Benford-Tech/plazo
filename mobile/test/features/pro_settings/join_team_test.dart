import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/onboarding_models.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/domain/usecases/settings_use_cases.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_settings_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_team_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_account_page.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_team_page.dart';
import 'package:parking_app/src/services/share_service.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class MockGetTeam extends Mock implements GetTeamUseCase {}

class MockCreate extends Mock implements CreateStaffUseCase {}

class MockUpdate extends Mock implements UpdateStaffUseCase {}

class MockReset extends Mock implements ResetStaffPasswordUseCase {}

class MockJoinCode extends Mock implements GetJoinCodeUseCase {}

class MockJoinRequests extends Mock implements GetJoinRequestsUseCase {}

class MockAccept extends Mock implements AcceptJoinRequestUseCase {}

class MockRefuse extends Mock implements RefuseJoinRequestUseCase {}

class MockGetParking extends Mock implements GetParkingSettingsUseCase {}

class MockUpdateParking extends Mock implements UpdateParkingSettingsUseCase {}

class MockGetSms extends Mock implements GetSmsSettingsUseCase {}

class MockGetStatus extends Mock implements GetSmsStatusUseCase {}

class MockSaveSms extends Mock implements SaveSmsSettingsUseCase {}

class MockTestSms extends Mock implements TestSmsUseCase {}

class MockDisableSms extends Mock implements DisableSmsUseCase {}

class MockChangePassword extends Mock implements ChangePasswordUseCase {}

class MockSetTracking extends Mock implements SetShuttleTrackingUseCase {}

class FakeShare implements ShareService {
  final shared = <String>[];
  @override
  Future<void> shareText(String text, {String? subject}) async => shared.add(text);
}

const claire = StaffModel(id: 'm1', name: 'Claire Dubois', email: 'claire@parkair.fr', role: 'manager', operatorName: 'Parkair Lyon');
const members = [
  TeamMemberModel(id: 'm1', email: 'claire@parkair.fr', name: 'Claire Dubois', role: 'manager', signIn: ['password']),
  TeamMemberModel(id: 'm2', email: 'karim.b@gmail.com', name: 'Karim Benali', role: 'valet', signIn: ['google']),
];
final julieRequest = PendingJoinRequestModel(
  id: 'jr1',
  firstName: 'Julie',
  lastName: 'Martin',
  email: 'julie.m@icloud.com',
  provider: 'apple',
  wishedRole: 'driver',
  createdAt: DateTime.now().subtract(const Duration(minutes: 3)),
);
// No validUntil here: the midnight timer would outlive the widget tests (tested on its own below).
const code = JoinCodeModel(code: 'K7QM2-XP9TD', day: '2026-10-13', operatorName: 'Parkair Lyon');

void main() {
  late FakeShare share;

  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(NoParams());
    registerFallbackValue(const AcceptJoinParams(id: '', role: 'agent'));
    registerFallbackValue(const ProAuthLeaveRequested());
  });

  setUp(() {
    share = FakeShare();
    if (locator.isRegistered<ShareService>()) locator.unregister<ShareService>();
    locator.registerSingleton<ShareService>(share);
  });

  group('Équipe (maquette 4) : code du jour et demandes', () {
    late MockJoinCode joinCode;
    late MockJoinRequests joinRequests;
    late MockAccept accept;
    late MockRefuse refuse;
    late MockGetTeam getTeam;

    setUp(() {
      getTeam = MockGetTeam();
      joinCode = MockJoinCode();
      joinRequests = MockJoinRequests();
      accept = MockAccept();
      refuse = MockRefuse();
      when(() => getTeam(any())).thenAnswer((_) async => const Right(members));
      when(() => joinCode(any())).thenAnswer((_) async => const Right(code));
      when(() => joinRequests(any())).thenAnswer((_) async => Right([julieRequest]));
    });

    Future<ProTeamBloc> pumpTeam(WidgetTester tester) async {
      final auth = MockAuthBloc();
      whenListen(
        auth,
        const Stream<ProAuthState>.empty(),
        initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: claire),
      );
      final team = ProTeamBloc(getTeam, MockCreate(), MockUpdate(), MockReset(), joinCode: joinCode, joinRequests: joinRequests, accept: accept, refuse: refuse)
        ..add(const ProTeamStarted());
      addTearDown(team.close);
      await pumpLocalized(
        tester,
        MultiBlocProvider(
          providers: [
            BlocProvider<ProAuthBloc>.value(value: auth),
            BlocProvider.value(value: team),
          ],
          child: const ProTeamPage(),
        ),
        size: const Size(400, 1600),
      );
      await tester.pumpAndSettle();
      return team;
    }

    testWidgets('le code en grand, « Copier » et « Partager » le message prêt à envoyer', (tester) async {
      final copied = <String>[];
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') copied.add((call.arguments as Map)['text'] as String);
        return null;
      });
      addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));
      await pumpTeam(tester);
      expect(find.text('CODE DU JOUR'), findsOneWidget);
      expect(find.text("jusqu'à minuit"), findsOneWidget);
      expect(find.text('K7QM2-XP9TD'), findsOneWidget);
      expect(find.text('Donnez-le à une nouvelle recrue. Vous validez ensuite sa demande.'), findsOneWidget);
      await tester.tap(find.byKey(const Key('join-code-copy')));
      await tester.pumpAndSettle();
      expect(copied, ['K7QM2-XP9TD']);
      expect(find.text('Code copié.'), findsOneWidget);
      await tester.tap(find.byKey(const Key('join-code-share')));
      await tester.pumpAndSettle();
      expect(share.shared.single, contains('Parkair Lyon'));
      expect(share.shared.single, contains('K7QM2-XP9TD'));
      expect(share.shared.single, contains('connectez-vous avec Apple ou Google'));
    });

    testWidgets('la demande : nom, poste, depuis quand, via Apple ; chaque membre montre comment il se connecte', (tester) async {
      await pumpTeam(tester);
      expect(find.text('DEMANDES'), findsOneWidget);
      expect(find.text('1 à valider'), findsOneWidget);
      expect(find.text('Julie Martin'), findsOneWidget);
      expect(find.text('Chauffeur · il y a 3 min'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('join-request-jr1')), matching: find.byKey(const Key('sign-in-apple'))), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('member-m1')), matching: find.text('E-mail')), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('member-m2')), matching: find.text('Google')), findsOneWidget);
    });

    testWidgets('« Accepter » : le rôle préréglé sur le poste demandé, changeable ; jamais « Gérant »', (tester) async {
      when(() => accept(any()))
          .thenAnswer((_) async => const Right(TeamMemberModel(id: 'm3', email: 'julie.m@icloud.com', name: 'Julie Martin', role: 'valet', signIn: ['apple'])));
      final team = await pumpTeam(tester);
      await tester.tap(find.byKey(const Key('join-accept-jr1')));
      await tester.pumpAndSettle();
      expect(find.text('Accepter Julie Martin'), findsOneWidget);
      expect(find.text('SON RÔLE'), findsOneWidget);
      expect(find.text('Accepter comme chauffeur'), findsOneWidget);
      expect(find.byKey(const Key('join-role-manager')), findsNothing);
      await tester.tap(find.byKey(const Key('join-role-valet')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Accepter comme voiturier'));
      await tester.pumpAndSettle();
      verify(() => accept(const AcceptJoinParams(id: 'jr1', role: 'valet'))).called(1);
      expect(team.state.joinRequests, isEmpty);
      expect(team.state.members.map((m) => m.id), contains('m3'));
      expect(find.text("Julie Martin a rejoint l'équipe."), findsOneWidget);
    });

    testWidgets('« Refuser » après une question ; la demande quitte la liste', (tester) async {
      when(() => refuse('jr1')).thenAnswer((_) async => const Right(null));
      final team = await pumpTeam(tester);
      await tester.tap(find.byKey(const Key('join-refuse-jr1')));
      await tester.pumpAndSettle();
      expect(find.text('Refuser la demande de Julie Martin ?'), findsOneWidget);
      await tester.tap(find.byKey(const Key('join-refuse-confirm')));
      await tester.pumpAndSettle();
      verify(() => refuse('jr1')).called(1);
      expect(team.state.joinRequests, isEmpty);
      expect(find.byKey(const Key('join-requests')), findsNothing);
    });

    test('à minuit, le code est relu de lui-même pendant que la page reste ouverte', () async {
      // validUntil just passed (the bloc waits 2 s after it): read again ~50 ms later.
      when(() => joinCode(any())).thenAnswer((_) async => Right(code.copyWith(validUntil: DateTime.now().subtract(const Duration(milliseconds: 1950)))));
      final team = ProTeamBloc(getTeam, MockCreate(), MockUpdate(), MockReset(), joinCode: joinCode, joinRequests: joinRequests)..add(const ProTeamStarted());
      await Future<void>.delayed(const Duration(milliseconds: 200));
      verify(() => joinCode(any())).called(greaterThanOrEqualTo(2));
      await team.close();
    });

    test('notification « Demande pour rejoindre l’équipe » ouverte, Équipe déjà affichée : les demandes sont relues', () async {
      final pushes = StreamController<Map<String, dynamic>>.broadcast();
      final team = ProTeamBloc(getTeam, MockCreate(), MockUpdate(), MockReset(), joinCode: joinCode, joinRequests: joinRequests, pushOpened: pushes.stream)
        ..add(const ProTeamStarted());
      await team.stream.firstWhere((s) => s.joinRequests.isNotEmpty);
      final second = PendingJoinRequestModel(
        id: 'jr2',
        firstName: 'Karim',
        lastName: 'Benali',
        provider: 'google',
        wishedRole: 'valet',
        createdAt: DateTime.now(),
      );
      when(() => joinRequests(any())).thenAnswer((_) async => Right([julieRequest, second]));
      pushes.add({'type': 'arrival'});
      pushes.add({'type': 'join_request', 'requestId': 'jr2'});
      await team.stream.firstWhere((s) => s.joinRequests.length == 2);
      verify(() => joinRequests(any())).called(2);
      await team.close();
      await pushes.close();
    });

    test('demande déjà traitée ailleurs : retirée, avec le message', () async {
      when(() => accept(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 409, code: 'join_request_closed')));
      final team = ProTeamBloc(getTeam, MockCreate(), MockUpdate(), MockReset(), joinCode: joinCode, joinRequests: joinRequests, accept: accept, refuse: refuse)
        ..add(const ProTeamStarted());
      await team.stream.firstWhere((s) => s.joinRequests.isNotEmpty);
      team.add(const ProTeamJoinAccepted(id: 'jr1', role: 'driver'));
      await team.stream.firstWhere((s) => s.errorCode != null);
      expect(team.state.errorCode, 'join_request_closed');
      expect(team.state.joinRequests, isEmpty);
      await team.close();
    });
  });

  group('Mon compte (maquette 5)', () {
    Future<MockAuthBloc> pumpAccount(WidgetTester tester, ProAuthState state) async {
      final auth = MockAuthBloc();
      whenListen(auth, const Stream<ProAuthState>.empty(), initialState: state);
      final settings = ProSettingsBloc(
        MockGetParking(),
        MockUpdateParking(),
        MockGetSms(),
        MockGetStatus(),
        MockSaveSms(),
        MockTestSms(),
        MockDisableSms(),
        MockChangePassword(),
        MockSetTracking(),
      );
      addTearDown(settings.close);
      await pumpLocalized(
        tester,
        MultiBlocProvider(
          providers: [
            BlocProvider<ProAuthBloc>.value(value: auth),
            BlocProvider.value(value: settings),
          ],
          child: const ProAccountPage(),
        ),
        size: const Size(400, 1800),
      );
      await tester.pumpAndSettle();
      return auth;
    }

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

    testWidgets('compte Apple : « Liée », pas de mot de passe ni de formulaire pour en changer', (tester) async {
      await pumpAccount(tester, const ProAuthState(status: ProAuthStatus.signedIn, staff: julie, providers: ProvidersModel(apple: true)));
      expect(find.text('CONNEXION'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('account-identity-apple')), matching: find.text('Liée')), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('account-password-row')), matching: find.text('aucun')), findsOneWidget);
      expect(find.byKey(const Key('account-current')), findsNothing);
      expect(find.text('PARKING'), findsOneWidget);
      expect(find.text('Quitter ce parking'), findsOneWidget);
    });

    testWidgets('« Quitter ce parking » après une question', (tester) async {
      final auth = await pumpAccount(tester, const ProAuthState(status: ProAuthStatus.signedIn, staff: julie));
      await tester.tap(find.byKey(const Key('account-leave')));
      await tester.pumpAndSettle();
      expect(find.text('Quitter Parkair Lyon ?'), findsOneWidget);
      await tester.tap(find.byKey(const Key('account-leave-confirm')));
      await tester.pumpAndSettle();
      verify(() => auth.add(any(that: isA<ProAuthLeaveRequested>()))).called(1);
    });

    testWidgets('« Supprimer mon compte » sans mot de passe : ce qui reste, puis « Confirmer avec Apple »', (tester) async {
      final auth = await pumpAccount(tester, const ProAuthState(status: ProAuthStatus.signedIn, staff: julie, providers: ProvidersModel(apple: true)));
      await tester.tap(find.byKey(const Key('account-delete')));
      await tester.pumpAndSettle();
      expect(find.text('Supprimer votre compte ?'), findsOneWidget);
      expect(find.textContaining('votre accès à Apple sera retiré'), findsOneWidget);
      expect(find.textContaining('« Compte supprimé »'), findsOneWidget);
      expect(find.byKey(const Key('delete-password')), findsNothing);
      await tester.tap(find.byKey(const Key('delete-confirm-apple')));
      await tester.pumpAndSettle();
      final event = verify(() => auth.add(captureAny())).captured.whereType<ProAuthDeleteRequested>().single;
      expect(event.provider, 'apple');
      expect(event.password, isNull);
    });

    testWidgets('session rétablie, connexions de l’API pas encore lues : « Confirmer avec Apple » quand même (Apple 5.1.1(v))', (tester) async {
      // A restored session never shows the login page: only what the phone offers is known.
      final auth = await pumpAccount(tester, const ProAuthState(status: ProAuthStatus.signedIn, staff: julie, deviceProviders: ProvidersModel(apple: true)));
      await tester.tap(find.byKey(const Key('account-delete')));
      await tester.pumpAndSettle();
      expect(find.textContaining('Vous ne pourrez plus vous connecter à Plazo Pro et votre accès à Apple sera retiré.'), findsOneWidget);
      expect(find.byKey(const Key('delete-elsewhere')), findsNothing);
      await tester.tap(find.byKey(const Key('delete-confirm-apple')));
      await tester.pumpAndSettle();
      expect(verify(() => auth.add(captureAny())).captured.whereType<ProAuthDeleteRequested>().single.provider, 'apple');
    });

    testWidgets('compte avec mot de passe sur Android : « Lier mon compte Google », suppression confirmée par le mot de passe', (tester) async {
      final auth = await pumpAccount(tester, const ProAuthState(status: ProAuthStatus.signedIn, staff: claire, providers: ProvidersModel(google: true)));
      expect(find.byKey(const Key('account-current')), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('account-password-row')), matching: find.text('défini')), findsOneWidget);
      await tester.tap(find.byKey(const Key('account-link-google')));
      verify(() => auth.add(any(that: isA<ProAuthIdentityLinkRequested>().having((e) => e.provider, 'provider', 'google')))).called(1);

      await tester.tap(find.byKey(const Key('account-delete')));
      await tester.pumpAndSettle();
      // A manager is warned: nobody may be left to accept the requests.
      expect(find.textContaining('Vous êtes gérant'), findsOneWidget);
      FilledButton confirm() => tester.widget<FilledButton>(find.descendant(of: find.byKey(const Key('delete-confirm')), matching: find.byType(FilledButton)));
      expect(confirm().onPressed, isNull);
      await tester.enterText(find.byKey(const Key('delete-password')), 'secret');
      await tester.pump();
      await tester.tap(find.byKey(const Key('delete-confirm')));
      await tester.pumpAndSettle();
      final event = verify(() => auth.add(captureAny())).captured.whereType<ProAuthDeleteRequested>().single;
      expect(event.password, 'secret');
    });
  });
}
