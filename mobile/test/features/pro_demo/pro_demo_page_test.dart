import 'package:bloc_test/bloc_test.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_demo/demo_data_source.dart';
import 'package:parking_app/src/features/pro_demo/presentation/demo_banner.dart';
import 'package:parking_app/src/features/pro_demo/presentation/pro_demo_page.dart';

import '../../helpers/pump_app.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

const _demoDriver = StaffModel(
  id: 'st-demo-driver',
  name: 'Karim Démo',
  firstName: 'Karim',
  lastName: 'Démo',
  email: 'demo-chauffeur@demo.plazo.invalid',
  role: 'driver',
  operatorName: 'Parking des Cèdres (démo)',
  post: 'driver',
);

class FakeDemo implements DemoDataSource {
  DemoLinkState linkState = const DemoLinkState(status: 'valid', companyName: 'Parkair Lyon');
  Object? enterError;
  final entered = <(String, String?)>[];

  @override
  Future<DemoLinkState> link(String token) async => linkState;

  @override
  Future<StaffModel> enter(String role, {String? token}) async {
    entered.add((role, token));
    final error = enterError;
    if (error != null) throw error;
    return _demoDriver;
  }
}

DioException _apiError(int status, String code) {
  final options = RequestOptions(path: 'internal/auth/demo');
  return DioException(
    requestOptions: options,
    type: DioExceptionType.badResponse,
    response: Response<Map<String, dynamic>>(requestOptions: options, statusCode: status, data: {'message': 'x', 'code': code}),
  );
}

/// 19/11/2026 (« pouvoir lancer l'app mobile Plazo Pro en mode démo avec le lien », « Lien + bouton »).
void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProAuthLogoutRequested());
  });

  late MockAuthBloc auth;
  late FakeDemo demo;

  setUp(() {
    auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedOut));
    demo = FakeDemo();
    locator.registerSingleton<DemoDataSource>(demo);
  });
  tearDown(() => locator.unregister<DemoDataSource>());

  Future<void> pumpDemo(WidgetTester tester, {String? token}) async {
    await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: auth, child: ProDemoView(token: token)));
    await tester.pumpAndSettle();
  }

  testWidgets('le lien d’un prospect : bonjour, le rôle choisi, puis « Entrer dans la démo » ouvre la session', (tester) async {
    await pumpDemo(tester, token: 'abcdefghjkmn');
    expect(find.text('Essayez Plazo Pro sur un parking fictif'), findsOneWidget);
    expect(find.text('Bonjour Parkair Lyon : voici votre démo.'), findsOneWidget);
    expect(find.text('Gérant'), findsOneWidget);
    expect(find.text('Voiturier'), findsOneWidget);

    await tester.ensureVisible(find.byKey(const Key('demo-role-driver')));
    await tester.tap(find.byKey(const Key('demo-role-driver')));
    await tester.pump();
    await tester.ensureVisible(find.byKey(const Key('demo-enter')));
    await tester.tap(find.byKey(const Key('demo-enter')));
    // The button turns busy until the session opens the tabs: no settling.
    await tester.pump();
    await tester.pump();

    expect(demo.entered.single, ('driver', 'abcdefghjkmn'));
    final joined = verify(() => auth.add(captureAny())).captured.whereType<ProAuthJoined>().single;
    expect(joined.staff.id, 'st-demo-driver');
    expect(joined.staff.isDemo, isTrue);
  });

  testWidgets('un lien expiré laisse entrer sans le compter, comme sur le web', (tester) async {
    demo.linkState = const DemoLinkState(status: 'expired');
    await pumpDemo(tester, token: 'abcdefghjkmn');
    expect(find.text('Ce lien a expiré : vous pouvez tout de même entrer dans la démo.'), findsOneWidget);
    expect(find.byKey(const Key('demo-welcome')), findsNothing);

    await tester.ensureVisible(find.byKey(const Key('demo-enter')));
    await tester.tap(find.byKey(const Key('demo-enter')));
    await tester.pump();
    await tester.pump();
    expect(demo.entered.single, ('manager', null));
  });

  testWidgets('une erreur du serveur s’affiche en français', (tester) async {
    demo.enterError = _apiError(503, 'demo_unavailable');
    await pumpDemo(tester);
    await tester.ensureVisible(find.byKey(const Key('demo-enter')));
    await tester.tap(find.byKey(const Key('demo-enter')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('demo-error')), findsOneWidget);
    expect(find.text("La démo n'est pas prête. Réessayez dans un instant."), findsOneWidget);
    verifyNever(() => auth.add(any(that: isA<ProAuthJoined>())));
  });

  test('un membre de la démo se reconnaît à son adresse', () {
    expect(_demoDriver.isDemo, isTrue);
    expect(_demoDriver.copyWith(email: 'karim@parking.fr').isDemo, isFalse);
  });

  testWidgets('le bandeau de la démo : « Quitter » ferme la session', (tester) async {
    await pumpLocalized(tester, BlocProvider<ProAuthBloc>.value(value: auth, child: const Scaffold(body: ProDemoBanner())));
    await tester.pumpAndSettle();
    expect(find.text('Démo'), findsOneWidget);
    expect(find.text('· données fictives · remise à zéro cette nuit'), findsOneWidget);
    await tester.tap(find.byKey(const Key('demo-quit')));
    verify(() => auth.add(any(that: isA<ProAuthLogoutRequested>()))).called(1);
  });
}
