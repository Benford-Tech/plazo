import 'package:auto_route/auto_route.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/pages/pro_reservation_page.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_boarding.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/shared/theme/theme.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

class MockReservationBloc extends MockBloc<ProReservationEvent, ProReservationState> implements ProReservationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// « Embarquer » / « Récupérer » / « Déposer » (14/10/2026) hand the traveller to the Navette tab of the driver's shell,
/// on a router shaped like the app's: the shell's tabs, and the screens pushed above it.
void main() {
  setUpAll(setUpLocalizedTests);

  late ShuttleBoardingRequests requests;
  setUp(() {
    requests = ShuttleBoardingRequests();
    locator
      ..registerSingleton<LinkService>(FakeLinks())
      ..registerSingleton<ShuttleBoardingRequests>(requests);
  });
  tearDown(locator.reset);

  final now = DateTime.now();
  final early = ShuttleBoarding.dropoff(
    DepartureRowModel(reservationId: 'r1', reference: 'PLZ-R1', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: now, expected: true),
  );

  /// A page under the app's route name, so that `openShuttleTab` finds it as in the app.
  AutoRoute page(String name, String path, Widget Function(BuildContext, RouteData) build, {List<AutoRoute>? children}) =>
      AutoRoute(page: PageInfo.builder(name, builder: build), path: path, initial: name == ProShellRoute.name, children: children);

  Widget label(String text) => Scaffold(body: Center(child: Text(text)));

  /// The shell: its tabs, the active one named under them.
  Widget shell(List<PageRouteInfo> tabs) => AutoTabsRouter(
    routes: tabs,
    builder: (context, child) => Scaffold(body: child, bottomNavigationBar: Text('onglet ${context.tabsRouter.activeIndex}', key: const Key('active-tab'))),
  );

  /// The planning tab's « Embarquer », as the driver's Arrivées tab calls it.
  Widget arrivals(BuildContext context) => Scaffold(
    body: Center(child: TextButton(key: const Key('board'), onPressed: () => openShuttleTab(context, requests, early), child: const Text('Embarquer'))),
  );

  Future<RootStackRouter> pumpRouter(WidgetTester tester, List<AutoRoute> routes) async {
    final router = RootStackRouter.build(routes: routes);
    tester.view.physicalSize = const Size(400, 1800) * tester.view.devicePixelRatio;
    addTearDown(tester.view.resetPhysicalSize);
    await tester.runAsync(() async {
      await tester.pumpWidget(
        EasyLocalization(
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
      );
      await Future<void>.delayed(const Duration(milliseconds: 100));
    });
    await tester.pumpAndSettle();
    return router;
  }

  String activeTab(WidgetTester tester) => tester.widget<Text>(find.byKey(const Key('active-tab'))).data!;

  testWidgets('depuis l\'onglet Arrivées : l\'onglet Navette s\'ouvre et reçoit le client', (tester) async {
    final router = await pumpRouter(tester, [
      page(ProShellRoute.name, '/pro', (_, _) => shell([ProShuttleRoute(), const ProArrivalsRoute()]), children: [
        page(ProShuttleRoute.name, 'navette', (_, _) => label('Navette')),
        page(ProArrivalsRoute.name, 'arrivees', (context, _) => arrivals(context)),
      ]),
    ]);
    router.innerRouterOf<TabsRouter>(ProShellRoute.name)!.setActiveIndex(1);
    await tester.pumpAndSettle();
    expect(activeTab(tester), 'onglet 1');

    await tester.tap(find.byKey(const Key('board')));
    await tester.pumpAndSettle();
    expect(activeTab(tester), 'onglet 0');
    // No Navette list listened yet: the request waits for it.
    expect(requests.take()?.departure?.customerName, 'Vincent Blanc');
  });

  testWidgets('depuis la fiche d\'une réservation : la fiche se ferme, l\'onglet Navette du chauffeur reçoit le client', (tester) async {
    const karim = StaffModel(id: 'd1', name: 'Karim Benali', email: 'k@example.com', role: 'driver', post: 'driver', effectivePost: 'driver');
    final booking = ReservationModel(
      id: 'r1',
      reference: 'PLZ-R1',
      channel: 'phone',
      status: 'upcoming',
      arrivalAt: now.add(const Duration(hours: 2)),
      returnAt: now.add(const Duration(days: 3)),
      passengers: 1,
      customerName: 'Vincent Blanc',
      customerPhone: '0600000000',
      plate: 'DJ-150-MX',
      stopId: 's1',
      nextStatuses: const ['arrived', 'cancelled', 'no_show'],
    );
    final bloc = MockReservationBloc();
    whenListen(bloc, const Stream<ProReservationState>.empty(), initialState: ProReservationState(reservation: booking));
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: karim));
    final router = await pumpRouter(tester, [
      page(ProShellRoute.name, '/pro', (_, _) => shell([ProShuttleRoute(), const ProArrivalsRoute()]), children: [
        page(ProShuttleRoute.name, 'navette', (_, _) => label('Navette')),
        page(ProArrivalsRoute.name, 'arrivees', (_, _) => label('Arrivées')),
      ]),
      page(
        ProReservationRoute.name,
        '/pro/reservations/:id',
        (_, _) => MultiBlocProvider(
          providers: [
            BlocProvider<ProReservationBloc>.value(value: bloc),
            BlocProvider<ProAuthBloc>.value(value: auth),
          ],
          child: const ProReservationPage(id: 'r1'),
        ),
      ),
    ]);
    // Opened from the Arrivées tab.
    router.innerRouterOf<TabsRouter>(ProShellRoute.name)!.setActiveIndex(1);
    await tester.pumpAndSettle();
    final heard = <ShuttleBoarding>[];
    final listening = requests.stream.listen(heard.add);
    addTearDown(listening.cancel);
    unawaitedPush(router, ProReservationRoute(id: 'r1'));
    await tester.pumpAndSettle();
    expect(find.byType(ProReservationPage), findsOneWidget);

    await tester.tap(find.byKey(const Key('more-actions')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('status-board')));
    await tester.pumpAndSettle();
    expect(find.byType(ProReservationPage), findsNothing, reason: 'back to the shell, where the trip keeps running');
    expect(activeTab(tester), 'onglet 0');
    final boarding = heard.single;
    expect(boarding.direction, 'dropoff');
    expect(boarding.departure?.reservationId, 'r1');
    expect(boarding.departure?.expected, isTrue);
    expect(boarding.departure?.stopId, 's1');
  });

  testWidgets('« Déposer au terminal » : le client sur place part avec sa ligne, lue comme celle du serveur', (tester) async {
    const karim = StaffModel(id: 'd1', name: 'Karim Benali', email: 'k@example.com', role: 'driver', post: 'driver', effectivePost: 'driver');
    // Arrived long ago (the drop-off list keeps 6 h): the Navette list may not hold them.
    final arrivedAt = now.subtract(const Duration(hours: 8));
    final booking = ReservationModel.fromJson({
      'id': 'r1',
      'reference': 'PLZ-R1',
      'channel': 'phone',
      'status': 'arrived',
      'arrivalAt': arrivedAt.toUtc().toIso8601String(),
      'arrivedAt': arrivedAt.toUtc().toIso8601String(),
      'returnAt': now.add(const Duration(days: 3)).toUtc().toIso8601String(),
      'passengers': 2,
      'customerName': 'Sarah Cohen',
      'customerPhone': '0600000000',
      'plate': 'EF-321-GH',
      'stopId': 's1',
      'nextStatuses': ['shuttled_out', 'cancelled'],
      'spot': {'code': 'B04'},
      'file': {'id': 'f7', 'code': 'F07'},
      'filePosition': 2,
    });
    expect(booking.arrivedAt, arrivedAt.toUtc());
    final bloc = MockReservationBloc();
    whenListen(bloc, const Stream<ProReservationState>.empty(), initialState: ProReservationState(reservation: booking));
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: karim));
    final router = await pumpRouter(tester, [
      page(ProShellRoute.name, '/pro', (_, _) => shell([ProShuttleRoute(), const ProArrivalsRoute()]), children: [
        page(ProShuttleRoute.name, 'navette', (_, _) => label('Navette')),
        page(ProArrivalsRoute.name, 'arrivees', (_, _) => label('Arrivées')),
      ]),
      page(
        ProReservationRoute.name,
        '/pro/reservations/:id',
        (_, _) => MultiBlocProvider(
          providers: [
            BlocProvider<ProReservationBloc>.value(value: bloc),
            BlocProvider<ProAuthBloc>.value(value: auth),
          ],
          child: const ProReservationPage(id: 'r1'),
        ),
      ),
    ]);
    router.innerRouterOf<TabsRouter>(ProShellRoute.name)!.setActiveIndex(1);
    await tester.pumpAndSettle();
    final heard = <ShuttleBoarding>[];
    final listening = requests.stream.listen(heard.add);
    addTearDown(listening.cancel);
    unawaitedPush(router, ProReservationRoute(id: 'r1'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.byKey(const Key('next-drop_off')));
    await tester.tap(find.byKey(const Key('next-drop_off')));
    await tester.pumpAndSettle();
    expect(find.byType(ProReservationPage), findsNothing);
    expect(activeTab(tester), 'onglet 0');
    final departure = heard.single.departure;
    expect(heard.single.direction, 'dropoff');
    expect(departure, isNotNull, reason: 'pinned when the Navette list does not hold the traveller');
    expect(departure!.reservationId, 'r1');
    expect(departure.expected, isFalse);
    expect(departure.arrivedAt, arrivedAt.toUtc());
    expect(departure.spot, 'B04', reason: 'the spot\'s code only, as the server\'s rows');
    expect(departure.stopId, 's1');
  });

  testWidgets('sans onglet Navette (autre poste) : l\'écran Navette s\'ouvre au-dessus avec le client', (tester) async {
    await pumpRouter(tester, [
      page(ProShellRoute.name, '/pro', (_, _) => shell(const [ProTodayRoute(), ProReservationsRoute()]), children: [
        page(ProTodayRoute.name, '', (context, _) => arrivals(context)),
        page(ProReservationsRoute.name, 'reservations', (_, _) => label('Réservations')),
      ]),
      page(ProShuttleRoute.name, '/pro/navette', (_, data) => label('Écran Navette ${data.argsAs<ProShuttleRouteArgs>().boarding?.reservationId}')),
    ]);
    await tester.tap(find.byKey(const Key('board')));
    await tester.pumpAndSettle();
    expect(find.text('Écran Navette r1'), findsOneWidget);
    expect(requests.take(), isNull, reason: 'the screen carries the traveller itself');
  });
}

/// Pushes without awaiting the route's result (the page pops later).
void unawaitedPush(StackRouter router, PageRouteInfo route) => router.push(route).ignore();
