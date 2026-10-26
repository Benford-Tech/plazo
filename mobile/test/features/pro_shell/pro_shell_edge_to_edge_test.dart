import 'package:auto_route/auto_route.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_shell/presentation/pages/pro_more_tab_page.dart';
import 'package:parking_app/src/features/pro_shell/presentation/pages/pro_shell_page.dart';
import 'package:parking_app/src/shared/theme/theme.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): a phone in landscape (a driver's phone in its car mount) has
/// the 3-button bar on one side and the cutout on the other; the shell keeps every tab's rows clear of both.
void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    PackageInfo.setMockInitialValues(appName: 'Plazo Pro', packageName: 'p', version: '1.0.0', buildNumber: '1', buildSignature: '');
  });

  const agent = StaffModel(id: 'a1', name: 'Sarah Cohen', email: 's@example.com', role: 'agent', post: 'agent');

  /// A page under the app's route name, so that the shell's tabs find it as in the app.
  AutoRoute page(String name, String path, Widget Function(BuildContext, RouteData) build, {List<AutoRoute>? children}) =>
      AutoRoute(page: PageInfo.builder(name, builder: build), path: path, initial: name == ProShellRoute.name, children: children);

  Widget label(String text) => Scaffold(body: Center(child: Text(text)));

  testWidgets('paysage : les lignes de l\'onglet Plus s\'écartent de l\'encoche et de la barre de navigation', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    tester.view.physicalSize = const Size(800, 400) * tester.view.devicePixelRatio;
    addTearDown(tester.view.resetPhysicalSize);
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: agent));
    final router = RootStackRouter.build(
      routes: [
        page(
          ProShellRoute.name,
          '/pro',
          (_, _) => const ProShellPage(),
          children: [
            page(ProTodayRoute.name, 'aujourdhui', (_, _) => label('Aujourd\'hui')),
            page(ProReservationsRoute.name, 'reservations', (_, _) => label('Réservations')),
            page(ProOccupationRoute.name, 'parking', (_, _) => label('Parking')),
            page(ProMoreTabRoute.name, 'plus', (_, _) => const ProMoreTabPage()),
          ],
        ),
      ],
    );
    await tester.runAsync(() async {
      await tester.pumpWidget(
        BlocProvider<ProAuthBloc>.value(
          value: auth,
          child: EasyLocalization(
            supportedLocales: const [Locale('fr', 'FR')],
            startLocale: const Locale('fr', 'FR'),
            fallbackLocale: const Locale('fr', 'FR'),
            useOnlyLangCode: false,
            saveLocale: false,
            path: 'assets/l10n',
            child: Builder(
              builder: (context) => MaterialApp.router(
                theme: appTheme(),
                locale: context.locale,
                supportedLocales: context.supportedLocales,
                localizationsDelegates: context.localizationDelegates,
                routerConfig: router.config(),
              ),
            ),
          ),
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 100));
    });
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('ptab-more')));
    await tester.pumpAndSettle();

    expectClearOfSystemBars(tester, find.byKey(const Key('pmore-name')));
    // M-A (26/10/2026): the shuttle row sits in the « Chauffeur » block, below the fold of a landscape phone.
    final shuttle = find.byKey(const Key('pmore-shuttle'));
    await tester.scrollUntilVisible(
      shuttle,
      80,
      scrollable: find.descendant(of: find.byType(ProMoreTabPage), matching: find.byType(Scrollable)),
    );
    await tester.ensureVisible(shuttle);
    await tester.pumpAndSettle();
    expectClearOfSystemBars(tester, shuttle);
  });
}
