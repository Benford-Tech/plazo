import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_shell/presentation/pages/pro_more_tab_page.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// M-A (26/10/2026, « réorganise le menu par rôle »): « Plus » shows the post of the day, the manager's tools, one block
/// per post the member can hold, then the account.
void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    PackageInfo.setMockInitialValues(appName: 'Plazo Pro', packageName: 'p', version: '1.0.0', buildNumber: '1', buildSignature: '');
  });

  Future<void> show(WidgetTester tester, StaffModel staff) async {
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: ProAuthState(status: ProAuthStatus.signedIn, staff: staff));
    await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: auth, child: const ProMoreTabPage()), size: const Size(400, 1600));
    await tester.pumpAndSettle();
  }

  testWidgets('le gérant voit tous les blocs : poste du jour, Gérant, Chauffeur, Accueil, Voiturier, Compte', (tester) async {
    await show(
      tester,
      const StaffModel(
        id: 'm1',
        name: 'Joanny Simpore',
        email: 'j@example.com',
        role: 'manager',
        post: 'manager',
        allowedPosts: ['manager', 'agent', 'driver', 'valet'],
      ),
    );
    for (final title in ['MON POSTE DU JOUR', 'GÉRANT', 'CHAUFFEUR', 'ACCUEIL', 'VOITURIER', 'COMPTE']) {
      expect(find.text(title), findsOneWidget, reason: title);
    }
    for (final key in ['pmore-post', 'pmore-start', 'pmore-revenue', 'pmore-team', 'pmore-plan', 'pmore-vehicles', 'pmore-settings', 'pmore-shuttle', 'pmore-reservations', 'pmore-services', 'pmore-planning', 'pmore-tutorials', 'pmore-account', 'pmore-logout']) {
      expect(find.byKey(Key(key)), findsOneWidget, reason: key);
    }
    expect(find.byKey(const Key('pmore-vehicle')), findsNothing);
  });

  testWidgets('un chauffeur ne voit que son poste, la navette et le compte', (tester) async {
    await show(
      tester,
      const StaffModel(id: 'd1', name: 'Karim Benali', email: 'k@example.com', role: 'driver', post: 'driver', allowedPosts: ['driver']),
    );
    expect(find.text('MON POSTE DU JOUR'), findsOneWidget);
    expect(find.text('CHAUFFEUR'), findsOneWidget);
    expect(find.text('COMPTE'), findsOneWidget);
    expect(find.text('GÉRANT'), findsNothing);
    expect(find.text('ACCUEIL'), findsNothing);
    expect(find.text('VOITURIER'), findsNothing);
    expect(find.byKey(const Key('pmore-vehicle')), findsOneWidget);
    expect(find.byKey(const Key('pmore-shuttle')), findsOneWidget);
    expect(find.byKey(const Key('pmore-start')), findsOneWidget);
    expect(find.byKey(const Key('pmore-revenue')), findsNothing);
    expect(find.byKey(const Key('pmore-planning')), findsNothing);
  });

  testWidgets('sans allowedPosts (ancienne API), l\'accueil couvre aussi la navette et les places', (tester) async {
    await show(tester, const StaffModel(id: 'a1', name: 'Sarah Cohen', email: 's@example.com', role: 'agent', post: 'agent'));
    expect(find.text('ACCUEIL'), findsOneWidget);
    expect(find.text('CHAUFFEUR'), findsOneWidget);
    expect(find.text('VOITURIER'), findsOneWidget);
    expect(find.text('GÉRANT'), findsNothing);
  });
}
