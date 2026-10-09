import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/helpers/names.dart';
import 'package:parking_app/src/core/networking/networking.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/booking/presentation/pages/my_booking_page.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/login_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/logout_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/restore_session_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_post_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/set_vehicle_use_case.dart';
import 'package:parking_app/src/features/pro_auth/domain/usecases/update_name_use_case.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/domain/usecases/settings_use_cases.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_settings_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_team_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_account_page.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_team_page.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

class MockLogin extends Mock implements LoginUseCase {}

class MockRestore extends Mock implements RestoreSessionUseCase {}

class MockLogout extends Mock implements LogoutUseCase {}

class MockSetPost extends Mock implements SetPostUseCase {}

class MockSetVehicle extends Mock implements SetVehicleUseCase {}

class MockUpdateName extends Mock implements UpdateNameUseCase {}

class MockGetTeam extends Mock implements GetTeamUseCase {}

class MockCreate extends Mock implements CreateStaffUseCase {}

class MockUpdate extends Mock implements UpdateStaffUseCase {}

class MockReset extends Mock implements ResetStaffPasswordUseCase {}

class MockGetParking extends Mock implements GetParkingSettingsUseCase {}

class MockUpdateParking extends Mock implements UpdateParkingSettingsUseCase {}

class MockGetSms extends Mock implements GetSmsSettingsUseCase {}

class MockGetStatus extends Mock implements GetSmsStatusUseCase {}

class MockSaveSms extends Mock implements SaveSmsSettingsUseCase {}

class MockTestSms extends Mock implements TestSmsUseCase {}

class MockDisableSms extends Mock implements DisableSmsUseCase {}

class MockChangePassword extends Mock implements ChangePasswordUseCase {}

class MockSetTracking extends Mock implements SetShuttleTrackingUseCase {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

/// A manager whose account was created before 06/10/2026: only the display name is filled in.
const gerant = StaffModel(id: 'st1', name: 'Jeanne Martin', email: 'gerant@example.com', role: 'manager', operatorName: 'Parking Démo');

const alex = TeamMemberModel(id: 's1', email: 'alex@demo.fr', name: 'Alex Agent', firstName: 'Alex', lastName: 'Agent', role: 'agent');
const dan = TeamMemberModel(id: 's2', email: 'dan@demo.fr', name: 'Dan', firstName: 'Dan', role: 'driver');

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(NoParams());
    registerFallbackValue(const LoginParams(email: '', password: ''));
    registerFallbackValue(const UpdateNameParams(firstName: '', lastName: ''));
    registerFallbackValue(const UpdateStaffParams(id: ''));
  });

  group('noms en deux parties', () {
    test('découpe au premier espace, comme le serveur pour les anciennes lignes', () {
      expect(splitName('Jean de La Tour'), (firstName: 'Jean', lastName: 'de La Tour'));
      expect(splitName('  Dupont '), (firstName: 'Dupont', lastName: ''));
      expect(splitName(''), (firstName: '', lastName: ''));
      expect(nameParts('Marie Claire', 'Dupont', 'ignoré'), (firstName: 'Marie Claire', lastName: 'Dupont'));
      expect(nameParts('', '', 'Camille Martin'), (firstName: 'Camille', lastName: 'Martin'));
    });

    test('salutation : le prénom enregistré, sinon le premier mot du nom ; jamais un titre', () {
      expect(greetingName('Marie Claire', 'Marie Claire Dupont'), 'Marie Claire');
      expect(greetingName('', 'Camille Martin'), 'Camille');
      expect(greetingName(null, 'M. Dupont'), '');
      expect(greetingName('J.', 'J. Dupont'), '');
    });

    testWidgets('« C’est réservé, … ! » salue avec le prénom enregistré', (tester) async {
      await pumpLocalized(
        tester,
        Scaffold(body: ConfirmedHero(booking: booking().copyWith(customerName: 'Marie Claire Dupont', customerFirstName: 'Marie Claire', customerLastName: 'Dupont'))),
      );
      await tester.pumpAndSettle();
      expect(find.text('C\'est réservé, Marie Claire !'), findsOneWidget);
    });

    testWidgets('sans prénom enregistré (ancien serveur) : le premier mot du nom', (tester) async {
      await pumpLocalized(tester, Scaffold(body: ConfirmedHero(booking: booking().copyWith(customerFirstName: '', customerLastName: ''))));
      await tester.pumpAndSettle();
      expect(find.text('C\'est réservé, Camille !'), findsOneWidget);
    });
  });

  group('« Votre nom » (Mon compte)', () {
    late MockLogin login;
    late MockUpdateName updateName;

    setUp(() {
      login = MockLogin();
      updateName = MockUpdateName();
      when(() => login(any())).thenAnswer((_) async => const Right(gerant));
    });

    Future<ProAuthBloc> signedIn() async {
      final bloc = ProAuthBloc(login, MockRestore(), MockLogout(), MockSetPost(), MockSetVehicle(), updateName, SessionEvents());
      bloc.add(const ProAuthLoginSubmitted(email: 'gerant@example.com', password: 'secret'));
      await settle();
      return bloc;
    }

    test('enregistré : prénom et nom sans espaces autour, la session prend le nouveau nom', () async {
      when(() => updateName(any())).thenAnswer((_) async => Right(gerant.copyWith(name: 'Jeanne Dupont', firstName: 'Jeanne', lastName: 'Dupont')));
      final bloc = await signedIn();
      bloc.add(const ProAuthNameSubmitted(firstName: ' Jeanne ', lastName: 'Dupont  '));
      await settle();
      verify(() => updateName(const UpdateNameParams(firstName: 'Jeanne', lastName: 'Dupont'))).called(1);
      expect(bloc.state.nameState, ViewState.success);
      expect(bloc.state.staff?.name, 'Jeanne Dupont');
      expect(bloc.state.status, ProAuthStatus.signedIn);
      await bloc.close();
    });

    test('refusé par champ : l’erreur reste sous le champ, pas de message général', () async {
      when(() => updateName(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'lastName': 'required'})));
      final bloc = await signedIn();
      bloc.add(const ProAuthNameSubmitted(firstName: 'Jeanne', lastName: ''));
      await settle();
      expect(bloc.state.nameState, ViewState.error);
      expect(bloc.state.nameErrors, {'lastName': 'required'});
      expect(bloc.state.errorCode, isNull);
      expect(bloc.state.staff?.name, 'Jeanne Martin');
      await bloc.close();
    });

    Future<ProAuthBloc> pumpAccount(WidgetTester tester) async {
      // Signed in inside the test's own clock (the mocks answer at once).
      final auth = ProAuthBloc(login, MockRestore(), MockLogout(), MockSetPost(), MockSetVehicle(), updateName, SessionEvents())
        ..add(const ProAuthLoginSubmitted(email: 'gerant@example.com', password: 'secret'));
      addTearDown(auth.close);
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
          providers: [BlocProvider.value(value: auth), BlocProvider.value(value: settings)],
          child: const ProAccountPage(),
        ),
      );
      await tester.pumpAndSettle();
      expect(auth.state.staff?.id, 'st1');
      return auth;
    }

    testWidgets('Prénom et Nom remplis (découpés pour un ancien compte), « Enregistrer », « Nom enregistré. »', (tester) async {
      when(() => updateName(any())).thenAnswer((_) async => Right(gerant.copyWith(name: 'Jeanne Dupont', firstName: 'Jeanne', lastName: 'Dupont')));
      await pumpAccount(tester);
      expect(find.text('VOTRE NOM'), findsOneWidget);
      expect(tester.widget<TextField>(find.byKey(const Key('account-first-name'))).controller?.text, 'Jeanne');
      expect(tester.widget<TextField>(find.byKey(const Key('account-last-name'))).controller?.text, 'Martin');
      await tester.enterText(find.byKey(const Key('account-last-name')), 'Dupont');
      await tester.tap(find.byKey(const Key('account-name-submit')));
      await tester.pumpAndSettle();
      verify(() => updateName(const UpdateNameParams(firstName: 'Jeanne', lastName: 'Dupont'))).called(1);
      expect(find.text('Nom enregistré.'), findsOneWidget);
      expect(find.text('Jeanne Dupont'), findsOneWidget);
    });

    testWidgets('nom vide refusé : « Champ obligatoire. » sous « Nom »', (tester) async {
      when(() => updateName(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'lastName': 'required'})));
      await pumpAccount(tester);
      await tester.enterText(find.byKey(const Key('account-last-name')), '   ');
      await tester.tap(find.byKey(const Key('account-name-submit')));
      await tester.pumpAndSettle();
      expect(tester.widget<TextField>(find.byKey(const Key('account-last-name'))).decoration?.errorText, 'Champ obligatoire.');
      expect(find.text('Nom enregistré.'), findsNothing);
    });
  });

  group('« Modifier le nom » (Équipe)', () {
    late MockGetTeam get;
    late MockUpdate update;

    setUp(() {
      get = MockGetTeam();
      update = MockUpdate();
      when(() => get(any())).thenAnswer((_) async => const Right([alex, dan]));
    });

    test('le nom part avec l’identifiant du membre ; une erreur de champ reste sur le champ', () async {
      when(() => update(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'lastName': 'required'})));
      final b = ProTeamBloc(get, MockCreate(), update, MockReset())..add(const ProTeamStarted());
      await settle();
      b.add(const ProTeamMemberUpdated(UpdateStaffParams(id: 's2', firstName: 'Dan', lastName: '')));
      await settle();
      expect(b.state.fieldErrors, {'lastName': 'required'});
      expect(b.state.errorCode, isNull);
      // Closing the form leaves no error behind for the next one.
      b.add(const ProTeamNoticeShown());
      await settle();
      expect(b.state.fieldErrors, isEmpty);
      await b.close();
    });

    Future<void> pumpTeam(WidgetTester tester) async {
      final login = MockLogin();
      when(() => login(any())).thenAnswer((_) async => const Right(gerant));
      final auth = ProAuthBloc(login, MockRestore(), MockLogout(), MockSetPost(), MockSetVehicle(), MockUpdateName(), SessionEvents());
      addTearDown(auth.close);
      final team = ProTeamBloc(get, MockCreate(), update, MockReset())..add(const ProTeamStarted());
      addTearDown(team.close);
      await pumpLocalized(
        tester,
        MultiBlocProvider(
          providers: [BlocProvider.value(value: auth), BlocProvider.value(value: team)],
          child: const ProTeamPage(),
        ),
        size: const Size(400, 1400),
      );
      await tester.pumpAndSettle();
    }

    testWidgets('formulaire en ligne Prénom / Nom / Enregistrer / Annuler, refermé une fois le nom enregistré', (tester) async {
      const renamed = TeamMemberModel(id: 's2', email: 'dan@demo.fr', name: 'Dan Durand', firstName: 'Dan', lastName: 'Durand', role: 'driver');
      when(() => update(any())).thenAnswer((_) async => const Right(renamed));
      await pumpTeam(tester);
      expect(find.text('Modifier le nom'), findsNWidgets(2));
      await tester.tap(find.byKey(const Key('rename-s2')));
      await tester.pumpAndSettle();
      expect(find.text('Nom de Dan'), findsOneWidget);
      expect(tester.widget<TextField>(find.byKey(const Key('rename-first-s2'))).controller?.text, 'Dan');
      expect(tester.widget<TextField>(find.byKey(const Key('rename-last-s2'))).controller?.text, '');
      expect(find.text('Enregistrer'), findsOneWidget);
      expect(find.text('Annuler'), findsOneWidget);

      // « Annuler » closes it without sending anything.
      await tester.tap(find.byKey(const Key('rename-cancel-s2')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('rename-first-s2')), findsNothing);
      verifyNever(() => update(any()));

      await tester.tap(find.byKey(const Key('rename-s2')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('rename-last-s2')), ' Durand ');
      await tester.tap(find.byKey(const Key('rename-save-s2')));
      await tester.pumpAndSettle();
      verify(() => update(const UpdateStaffParams(id: 's2', firstName: 'Dan', lastName: 'Durand'))).called(1);
      expect(find.byKey(const Key('rename-first-s2')), findsNothing);
      expect(find.text('Dan Durand'), findsOneWidget);
      expect(find.text('Membre mis à jour'), findsOneWidget);
    });

    testWidgets('nom refusé par le serveur : « Champ obligatoire. » sous « Nom », le formulaire reste ouvert', (tester) async {
      when(() => update(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'lastName': 'required'})));
      await pumpTeam(tester);
      await tester.tap(find.byKey(const Key('rename-s2')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('rename-save-s2')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('rename-first-s2')), findsOneWidget);
      expect(tester.widget<TextField>(find.byKey(const Key('rename-last-s2'))).decoration?.errorText, 'Champ obligatoire.');
    });
  });
}
