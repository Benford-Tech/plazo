import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_waves_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockShuttleBloc extends MockBloc<ShuttleEvent, ShuttleState> implements ShuttleBloc {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

class MockWavesBloc extends MockBloc<ShuttleWavesEvent, ShuttleWavesState> implements ShuttleWavesBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ShuttleTicked());
  });

  late MockShuttleBloc bloc;
  setUp(() => bloc = MockShuttleBloc());

  final pickupsModel = PickupsModel(
    serverTime: t0,
    meetingPoint: meetingT1,
    rows: [
      pickup('r1', 'Camille Martin', atMeetingPointAt: t0, flight: landedFlight()),
      pickup('r2', 'Léa Durand', passengers: 1, plate: 'GH-456-JK', flight: landedFlight(number: 'EJU 4412')),
      pickup('r3', 'Louis Leroy', passengers: 3, plate: 'LM-789-NP', flight: FlightViewModel(number: 'AF 7640', status: 'scheduled', scheduledAt: t0.add(const Duration(hours: 1)))),
    ],
  );

  Future<void> show(WidgetTester tester, ShuttleState state) async {
    whenListen(bloc, const Stream<ShuttleState>.empty(), initialState: state);
    final live = MockLiveBloc();
    whenListen(live, const Stream<LiveShuttlesState>.empty(), initialState: LiveShuttlesState(now: t0));
    final waves = MockWavesBloc();
    whenListen(
      waves,
      const Stream<ShuttleWavesState>.empty(),
      initialState: ShuttleWavesState(now: t0, data: ShuttleForecastModel(serverTime: t0, date: '2026-10-05')),
    );
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ShuttleBloc>.value(value: bloc),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
          BlocProvider<ShuttleWavesBloc>.value(value: waves),
        ],
        child: const ProShuttlePage(),
      ),
      // The waves card (V-A) sits above the lists: a tall screen keeps the buttons on screen.
      size: const Size(400, 1800),
    );
  }

  const airport = ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true);
  const station = ShuttleStopModel(id: 's1', kind: 'station', name: 'Gare Saint-Exupéry TGV', lat: 45.7209, lng: 5.0756, instructions: 'Dépose-minute, côté parvis.');

  testWidgets('D-A · dessertes : les puces n’apparaissent qu’avec une gare ; choisir la gare remplace le point de rendez-vous', (tester) async {
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, stops: const [airport]));
    expect(find.byKey(const Key('stop-choice')), findsNothing);
    bloc = MockShuttleBloc();
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, stops: const [airport, station]));
    expect(find.byKey(const Key('stop-choice')), findsOneWidget);
    expect(find.text('Aéroport'), findsOneWidget);
    expect(find.text('Gare Saint-Exupéry TGV'), findsOneWidget);
    expect(find.text('Point de rendez-vous : Terminal 1 · Porte 12'), findsOneWidget);
    await tester.tap(find.byKey(const Key('stop-s1')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttleStopChanged>().having((e) => e.stopId, 'stopId', 's1'));
    bloc = MockShuttleBloc();
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, stops: const [airport, station], stopId: 's1'));
    expect(find.text('Desserte : Gare Saint-Exupéry TGV'), findsOneWidget);
    expect(find.text('Dépose-minute, côté parvis.'), findsOneWidget);
    expect(find.text('Point de rendez-vous : Terminal 1 · Porte 12'), findsNothing);
  });

  testWidgets('R4 · liste : badges au point de RDV / atterri / vol prévu, sélection, « Partir à l’aéroport · 2 clients »', (tester) async {
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, selected: const {'r1', 'r2'}));
    expect(find.text('À récupérer · Terminal 1'), findsOneWidget);
    expect(find.text('Point de rendez-vous : Terminal 1 · Porte 12'), findsOneWidget);
    expect(find.text('Camille Martin · 2 pass.'), findsOneWidget);
    expect(find.textContaining('Au point de RDV '), findsOneWidget);
    expect(find.textContaining('Atterri '), findsWidgets);
    expect(find.textContaining('Vol prévu '), findsOneWidget);
    expect(find.text('Partir à l\'aéroport · 2 clients'), findsOneWidget);
    await tester.tap(find.byKey(const Key('pickup-r3')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttlePassengerToggled>().having((e) => e.reservationId, 'id', 'r3'));
  });

  testWidgets('R4 · le choix du véhicule puis le démarrage', (tester) async {
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, selected: const {'r1'}, vehicles: const [ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanche', plate: 'GH-456-JK')]));
    expect(find.text('Partir à l\'aéroport · 1 client'), findsOneWidget);
    await tester.tap(find.byKey(const Key('start-trip')));
    await tester.pumpAndSettle();
    expect(find.text('Votre navette'), findsOneWidget);
    expect(find.text('Mercedes Vito · blanche'), findsOneWidget);
    await tester.tap(find.byKey(const Key('vehicle-confirm')));
    await tester.pumpAndSettle();
    final events = verify(() => bloc.add(captureAny())).captured;
    expect(events[0], isA<ShuttleVehicleChosen>().having((e) => e.vehicle.vehicleId, 'vehicleId', 'v1'));
    expect(events[1], isA<ShuttleStartRequested>());
  });

  testWidgets('R4 · sans véhicule enregistré : saisie libre', (tester) async {
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, selected: const {'r1'}));
    await tester.tap(find.byKey(const Key('start-trip')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('vehicle-model')), 'Renault Trafic');
    await tester.enterText(find.byKey(const Key('vehicle-plate')), 'AA-111-BB');
    await tester.tap(find.byKey(const Key('vehicle-confirm')));
    await tester.pumpAndSettle();
    final chosen = verify(() => bloc.add(captureAny())).captured.first as ShuttleVehicleChosen;
    expect(chosen.vehicle.vehicleId, isNull);
    expect(chosen.vehicle.model, 'Renault Trafic');
    expect(chosen.vehicle.plate, 'AA-111-BB');
  });

  testWidgets('R4 · trajet en cours : carte peach, position partagée, « Clients récupérés »', (tester) async {
    final trip = staffTrip(passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')]);
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), pickups: pickupsModel, trip: trip, tracking: true));
    expect(find.byKey(const Key('trip-running')), findsOneWidget);
    expect(find.text('En route vers l\'aéroport · position partagée'), findsOneWidget);
    expect(find.text('Véhicule : Mercedes Vito blanche GH-456-JK · se coupe à l\'arrêt du trajet'), findsOneWidget);
    expect(find.textContaining('arrêt automatique dans 1 h 25'), findsOneWidget);
    expect(find.text('Sur un trajet'), findsOneWidget);
    expect(find.byKey(const Key('start-trip')), findsNothing);
    await tester.dragUntilVisible(find.byKey(const Key('end-trip')), find.byType(ListView), const Offset(0, -300));
    await tester.pump();
    await tester.tap(find.byKey(const Key('end-trip')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttleEndRequested>());
  });
}
