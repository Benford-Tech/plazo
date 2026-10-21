import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_settings/data/models/settings_models.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_settings_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/bloc/pro_team_bloc.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_account_page.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_parking_settings_page.dart';
import 'package:parking_app/src/features/pro_settings/presentation/pages/pro_team_page.dart';

import 'package:parking_app/src/di/locator.dart';

import '../../helpers/paperwork.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

class MockSettingsBloc extends MockBloc<ProSettingsEvent, ProSettingsState> implements ProSettingsBloc {}

class MockTeamBloc extends MockBloc<ProTeamEvent, ProTeamState> implements ProTeamBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): « Mon compte », « Réglages du parking » and « Équipe », pushed
/// above the shell, end above the navigation bar (« Supprimer mon compte », the SMS note, the last member clear of
/// « Ajouter ») and keep clear of a side bar in landscape; « Ajouter un membre » stops below the status bar.
void main() {
  setUpAll(setUpLocalizedTests);
  setUp(registerQuietExtras);
  tearDown(locator.reset);

  const gerant = StaffModel(id: 'st1', name: 'Jeanne Martin', email: 'gerant@example.com', role: 'manager', operatorName: 'Parking Démo');

  MockAuthBloc auth() {
    final bloc = MockAuthBloc();
    whenListen(bloc, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: gerant));
    return bloc;
  }

  MockSettingsBloc settings({ParkingSettingsModel? parking}) {
    final bloc = MockSettingsBloc();
    whenListen(
      bloc,
      const Stream<ProSettingsState>.empty(),
      initialState: ProSettingsState(viewState: ViewState.success, parking: parking, sms: const SmsSettingsModel()),
    );
    return bloc;
  }

  /// Scrolls the page's list (not a text field's own scrollable) to its very end.
  Future<void> scrollToEnd(WidgetTester tester) async {
    final position = tester.state<ScrollableState>(find.descendant(of: find.byType(ListView).first, matching: find.byType(Scrollable)).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 10 && position.pixels != position.maxScrollExtent; i++) {
      position.jumpTo(position.maxScrollExtent);
      await tester.pump();
    }
  }

  Future<void> showAccount(WidgetTester tester, {Size size = const Size(400, 800)}) => pumpLocalized(
    tester,
    MultiBlocProvider(
      providers: [BlocProvider<ProAuthBloc>.value(value: auth()), BlocProvider<ProSettingsBloc>.value(value: settings())],
      child: const ProAccountPage(),
    ),
    size: size,
  );

  testWidgets('Mon compte : « Supprimer mon compte », en fin de page, reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await showAccount(tester);
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('account-delete')));
  });

  testWidgets('paysage : Mon compte s\'écarte de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await showAccount(tester, size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('account-name')));
    expectClearOfSystemBars(tester, find.byKey(const Key('account-first-name')));
  });

  testWidgets('Réglages du parking : la note sur les SMS, en fin de page, reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await pumpLocalized(
      tester,
      BlocProvider<ProSettingsBloc>.value(
        value: settings(parking: const ParkingSettingsModel(id: 'p1', name: 'Parkair', totalCapacity: 150, effectiveCapacity: 150)),
        child: const ProParkingSettingsPage(),
      ),
      size: const Size(400, 800),
    );
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.textContaining('Tant que rien n\'est configuré'));
  });

  group('Équipe', () {
    final members = [
      for (var i = 1; i <= 6; i++) TeamMemberModel(id: 's$i', email: 'membre$i@demo.fr', name: 'Membre $i', firstName: 'Membre', lastName: '$i', role: 'agent'),
    ];

    Future<void> showTeam(WidgetTester tester, {Size size = const Size(400, 800)}) async {
      final team = MockTeamBloc();
      whenListen(team, const Stream<ProTeamState>.empty(), initialState: ProTeamState(viewState: ViewState.success, members: members));
      await pumpLocalized(
        tester,
        MultiBlocProvider(
          providers: [BlocProvider<ProAuthBloc>.value(value: auth()), BlocProvider<ProTeamBloc>.value(value: team)],
          child: const ProTeamPage(),
        ),
        size: size,
      );
    }

    testWidgets('en fin de liste, le dernier membre reste au-dessus de « Ajouter », lui-même au-dessus de la barre', (tester) async {
      setSystemBars(tester);
      await showTeam(tester);
      await scrollToEnd(tester);
      final fab = find.byKey(const Key('team-add'));
      expectClearOfSystemBars(tester, fab);
      // The tile's own rect counts its 10 dp bottom margin.
      expect(tester.getRect(find.byKey(const Key('member-s6'))).bottom - 10, lessThanOrEqualTo(tester.getRect(fab).top));
    });

    testWidgets('« Ajouter un membre » plein écran (petit téléphone) : la feuille s\'arrête sous la barre d\'état', (tester) async {
      setSystemBars(tester);
      await showTeam(tester, size: const Size(400, 500));
      await tester.tap(find.byKey(const Key('team-add')));
      for (var i = 0; i < 10; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }
      expect(find.byKey(const Key('new-first-name')), findsOneWidget);
      expect(tester.getRect(find.byType(BottomSheet)).top, greaterThanOrEqualTo(24));
    });

    testWidgets('paysage : les membres s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
      setSystemBars(tester, bottom: 0, left: 32, right: 48);
      await showTeam(tester, size: const Size(800, 400));
      expectClearOfSystemBars(tester, find.byKey(const Key('member-s1')));
    });
  });
}
