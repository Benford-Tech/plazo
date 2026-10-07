import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_dashboard/data/models/dashboard_model.dart';
import 'package:parking_app/src/features/pro_dashboard/domain/usecases/get_dashboard_use_case.dart';
import 'package:parking_app/src/features/pro_dashboard/presentation/bloc/pro_dashboard_bloc.dart';
import 'package:parking_app/src/features/pro_dashboard/presentation/widgets/dashboard_view.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockGet extends Mock implements GetDashboardUseCase {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

final dashboard = DashboardModel(
  serverTime: t0,
  date: '2026-10-03',
  parking: const DashboardParkingModel(id: 'p1', name: 'Parking Démo LYS', plannedSpots: 3),
  counts: const DashboardCountsModel(onSite: 3, arrivalsToday: 5, arrivedToday: 3, returnsToday: 2, shuttlesRunning: 1, freeSpots: 1, toTreat: 2),
  services: const DashboardServicesModel(
    flights: DashboardFlightsModel(configured: true, provider: 'aerodatabox'),
    sms: DashboardSmsModel(mode: 'brevo', pending: 2),
    // Payments are centralised: the tile is OK as soon as the platform takes them online.
    stripe: DashboardStripeModel(online: true, connected: false),
  ),
  alerts: const [
    DashboardAlertModel(kind: 'no_spot', severity: 'urgent', reservationId: 'r3', customerName: 'Louis Leroy', plate: 'LM-789-NP', minutes: 10),
    DashboardAlertModel(kind: 'flight_delayed', severity: 'watch', reservationId: 'r1', customerName: 'Camille Martin', plate: 'AB-123-CD', detail: 'TO 3627', minutes: 60),
  ],
  breakdown: const DashboardBreakdownModel(returnsThisWeek: 9, toTreat: 2, freeSpots: 1),
  vehicles: [
    DashboardVehicleModel(
      id: 'r1',
      reference: 'R1',
      customerName: 'Camille Martin',
      plate: 'AB-123-CD',
      status: 'arrived',
      arrivalAt: t0.toIso8601String(),
      returnAt: DateTime.utc(2026, 10, 3, 21).toIso8601String(),
      spotCode: 'A-01-01',
      stayClass: 'short',
      keyHook: '12',
      returnFlight: 'TO 3627',
      flightStatus: 'delayed',
      flightScheduledAt: '2026-10-03T19:00:00Z',
      flightEstimatedAt: '2026-10-03T19:40:00Z',
      returnsToday: true,
    ),
    DashboardVehicleModel(
      id: 'r3',
      reference: 'R3',
      customerName: 'Louis Leroy',
      plate: 'LM-789-NP',
      status: 'arrived',
      arrivalAt: t0.toIso8601String(),
      returnAt: DateTime.utc(2026, 10, 9, 21).toIso8601String(),
    ),
  ],
);

void main() {
  setUpAll(() {
    registerFallbackValue(NoParams());
    return setUpLocalizedTests();
  });

  test('le bloc charge le tableau, interroge à chaque tick et garde les chiffres si un tick échoue', () async {
    final get = MockGet();
    when(() => get(any())).thenAnswer((_) async => Right(dashboard));
    final bloc = ProDashboardBloc(get, clock: () => t0, pollInterval: const Duration(milliseconds: 20))..add(const ProDashboardStarted());
    await bloc.stream.firstWhere((s) => s.data != null);
    expect(bloc.state.data!.urgent, 1);
    when(() => get(any())).thenAnswer((_) async => const Left(ServerFailure(message: 'Hors ligne')));
    await Future<void>.delayed(const Duration(milliseconds: 50));
    verify(() => get(any())).called(greaterThanOrEqualTo(2));
    expect(bloc.state.data, isNotNull);
    expect(bloc.state.errorMessage, 'Hors ligne');
    await bloc.close();
  });

  Future<void> show(WidgetTester tester, DashboardModel data) async {
    final get = MockGet();
    when(() => get(any())).thenAnswer((_) async => Right(data));
    final live = MockLiveBloc();
    whenListen(
      live,
      const Stream<LiveShuttlesState>.empty(),
      initialState: LiveShuttlesState(now: t0, data: LiveShuttlesModel(serverTime: t0, parking: const LiveParkingModel(id: 'p1', name: 'P'))),
    );
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProDashboardBloc>(create: (_) => ProDashboardBloc(get, clock: () => t0, autoPoll: false)..add(const ProDashboardStarted())),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
        ],
        child: const Scaffold(body: DashboardView()),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('tableau de bord : tuiles, services en pilules, alertes avec badge, véhicules avec badges d’état', (tester) async {
    await show(tester, dashboard);
    expect(find.descendant(of: find.byKey(const Key('kpi-on-site')), matching: find.text('1 libres sur 3')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('kpi-arrivals')), matching: find.text('3 / 5 sur place')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('kpi-to-treat')), matching: find.text('1 urgent(s)')), findsOneWidget);
    final services = find.byKey(const Key('dashboard-services'));
    expect(find.descendant(of: services, matching: find.text('suivi aerodatabox')), findsOneWidget);
    expect(find.descendant(of: services, matching: find.text('2 en attente')), findsOneWidget);
    expect(find.descendant(of: services, matching: find.text('À voir')), findsOneWidget);
    expect(find.descendant(of: services, matching: find.text('Off')), findsNWidgets(2));
    expect(find.descendant(of: services, matching: find.text('OK')), findsNWidgets(2));
    expect(find.descendant(of: services, matching: find.text('en ligne, encaissés par Plazo')), findsOneWidget);
    expect(find.text('Sur place sans place'), findsOneWidget);
    expect(find.text('Louis Leroy · depuis 10 min'), findsOneWidget);
    expect(find.text('Urgent'), findsOneWidget);
    expect(find.text('Vol retardé'), findsOneWidget);
    expect(find.text('Camille Martin · TO 3627'), findsOneWidget);
    expect(find.text('À surveiller'), findsOneWidget);
    expect(find.text('A-01-01 · zone court'), findsOneWidget);
    expect(find.text('Clés : crochet 12'), findsOneWidget);
    expect(find.text('Retour du jour'), findsOneWidget);
    expect(find.text('Retardé +40 min'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Clés ?'), 200, scrollable: find.byType(Scrollable).first);
    expect(find.text('Sans place'), findsNWidgets(2));
    expect(find.text('Clés ?'), findsOneWidget);
  });

  testWidgets('rien à traiter, aucun véhicule', (tester) async {
    await show(tester, dashboard.copyWith(alerts: const [], vehicles: const [], counts: const DashboardCountsModel()));
    expect(find.text('Rien à traiter : tout est en ordre.'), findsOneWidget);
    expect(find.text('Aucun véhicule sur le parking.'), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('kpi-to-treat')), matching: find.text("rien d'urgent")), findsOneWidget);
  });
}
