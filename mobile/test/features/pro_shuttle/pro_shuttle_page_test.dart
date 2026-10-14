import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/helpers/formatters.dart';
import 'package:parking_app/src/features/pro_shuttle/data/datasources/shuttle_data_source.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_waves_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/shared/widgets/status_badge.dart';

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
    // F-A: the started trip opens the "En route" band, with the passengers and "Clients récupérés".
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), pickups: pickupsModel, trip: trip, tracking: true, band: 1));
    expect(find.text('À récupérer · 3'), findsOneWidget);
    expect(find.text('En route · 1'), findsOneWidget);
    expect(find.text('Rendus · 0'), findsOneWidget);
    expect(find.byKey(const Key('trip-running')), findsOneWidget);
    expect(find.text('En route vers l\'aéroport · position partagée'), findsOneWidget);
    // 14/10/2026: « Parti à 09:47 · Vito blanc GH-456-JK », as the validated mockup.
    expect(find.text('Parti à ${hhmm(t0)} · Mercedes Vito blanche GH-456-JK'), findsOneWidget);
    expect(find.textContaining('arrêt automatique dans 1 h 25'), findsOneWidget);
    expect(find.byKey(const Key('route-r1')), findsOneWidget);
    expect(find.byKey(const Key('start-trip')), findsNothing);
    await tester.dragUntilVisible(find.byKey(const Key('end-trip')), find.byType(ListView), const Offset(0, -300));
    await tester.pump();
    await tester.tap(find.byKey(const Key('end-trip')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttleEndRequested>());
    // Back on the first band, the passenger on the trip is marked and not selectable.
    bloc = MockShuttleBloc();
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), pickups: pickupsModel, trip: trip, tracking: true, band: 0));
    expect(find.text('Sur un trajet'), findsOneWidget);
    await tester.tap(find.byKey(const Key('band-1')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttleBandChanged>().having((e) => e.band, 'band', 1));
  });

  testWidgets('F-A · À emmener : « Attendu HH:MM » en ambre et cochable (14/10/2026), départ conseillé par desserte, résumé des cochés', (tester) async {
    final departures = DeparturesModel(
      serverTime: t0,
      rows: [
        DepartureRowModel(reservationId: 'd1', reference: 'D1', customerName: 'Marco Rossi', passengers: 4, plate: 'CD-456-EF', status: 'arrived', arrivalAt: t0, arrivedAt: t0, spot: 'A12', leaveAt: t0.add(const Duration(hours: 2))),
        DepartureRowModel(reservationId: 'd2', reference: 'D2', customerName: 'Nadia Roux', passengers: 1, plate: 'EF-789-GH', status: 'upcoming', arrivalAt: t0.add(const Duration(minutes: 50)), stopName: 'Gare TGV', leaveAt: t0.add(const Duration(hours: 3)), expected: true),
      ],
    );
    await show(tester, ShuttleState(now: t0, direction: 'dropoff', departures: departures, selected: const {'d1'}));
    expect(find.text('À emmener · 2'), findsOneWidget);
    expect(find.text('En séjour · 0'), findsOneWidget);
    expect(find.text('À conduire au terminal'), findsOneWidget);
    expect(find.text('À conduire · Gare TGV'), findsOneWidget);
    expect(find.textContaining('Départ conseillé '), findsNWidgets(2));
    expect(find.byKey(const Key('on-site-d1')), findsOneWidget);
    expect(find.text('Attendu ${hhmm(t0.add(const Duration(minutes: 50)))}'), findsOneWidget);
    final pill = tester.widget<StatusBadge>(find.byKey(const Key('expected-d2')));
    expect(pill.tone, BadgeTone.warn);
    expect(find.ancestor(of: find.byKey(const Key('departure-d2')), matching: find.byType(Opacity)), findsNothing, reason: 'no greyed look any more');
    expect(find.text('1 voyageur · 4 pass. coché'), findsOneWidget);
    expect(find.text('Embarquer et partir · 1 client'), findsOneWidget);
    expect(find.byKey(const Key('not-checked-in')), findsNothing);
    // An expected traveller is ticked like the others.
    await tester.tap(find.byKey(const Key('departure-d2')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ShuttlePassengerToggled>().having((e) => e.reservationId, 'id', 'd2'));
  });

  testWidgets('À emmener (14/10/2026) : la consigne des clients pas encore pointés, au singulier et au pluriel', (tester) async {
    final departures = DeparturesModel(
      serverTime: t0,
      rows: [
        DepartureRowModel(reservationId: 'd1', reference: 'D1', customerName: 'Chloé Moreau', passengers: 2, plate: 'BN-655-RT', status: 'arrived', arrivalAt: t0, arrivedAt: t0),
        DepartureRowModel(reservationId: 'd2', reference: 'D2', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: t0, expected: true),
        DepartureRowModel(reservationId: 'd3', reference: 'D3', customerName: 'Sarah Cohen', passengers: 2, plate: 'KL-204-BA', status: 'upcoming', arrivalAt: t0, expected: true),
      ],
    );
    await show(tester, ShuttleState(now: t0, direction: 'dropoff', departures: departures, selected: const {'d1', 'd2'}));
    expect(find.text('Vincent Blanc n\'est pas encore pointé : il passera « Sur place » à l\'embarquement.'), findsOneWidget);
    expect(find.text('Embarquer et partir · 2 clients'), findsOneWidget);
    bloc = MockShuttleBloc();
    await show(tester, ShuttleState(now: t0, direction: 'dropoff', departures: departures, selected: const {'d1', 'd2', 'd3'}));
    expect(find.text('2 clients ne sont pas encore pointés : ils passeront « Sur place » à l\'embarquement.'), findsOneWidget);
  });

  testWidgets('départ refusé (14/10/2026) : le message d\'origine, puis les clients ajoutés à la main retirés de la sélection', (tester) async {
    final departures = DeparturesModel(serverTime: t0, rows: [DepartureRowModel(reservationId: 'd1', reference: 'D1', customerName: 'Chloé Moreau', passengers: 2, plate: 'BN-655-RT', status: 'arrived', arrivalAt: t0, arrivedAt: t0)]);
    final refused = ShuttleState(now: t0, direction: 'dropoff', departures: departures, actionState: ViewState.error, errorCode: 'invalid_passengers', unpinned: const ['Vincent Blanc']);
    await show(tester, refused);
    expect(find.text('Un de ces clients ne peut pas monter dans ce trajet (statut de la réservation).'), findsOneWidget);
    expect(find.text('Vincent Blanc, ajouté à la main, a été retiré de la sélection : vérifiez sa réservation.'), findsOneWidget);
    bloc = MockShuttleBloc();
    await show(tester, refused.copyWith(unpinned: const ['Vincent Blanc', 'Sarah Cohen']));
    expect(find.text('Vincent Blanc et Sarah Cohen, ajoutés à la main, ont été retirés de la sélection : vérifiez leurs réservations.'), findsOneWidget);
    bloc = MockShuttleBloc();
    await show(tester, refused.copyWith(unpinned: const []));
    expect(find.byKey(const Key('unpinned')), findsNothing);
  });

  testWidgets('un geste (14/10/2026) : avec le véhicule du jour, « Embarquer et partir » démarre sans feuille ; « Changer » ouvre la feuille', (tester) async {
    final departures = DeparturesModel(
      serverTime: t0,
      rows: [
        DepartureRowModel(reservationId: 'd1', reference: 'D1', customerName: 'Chloé Moreau', passengers: 2, plate: 'BN-655-RT', status: 'arrived', arrivalAt: t0, arrivedAt: t0),
        DepartureRowModel(reservationId: 'd2', reference: 'D2', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', status: 'upcoming', arrivalAt: t0, expected: true),
      ],
    );
    final state = ShuttleState(
      now: t0,
      direction: 'dropoff',
      departures: departures,
      selected: const {'d1', 'd2'},
      vehicles: const [ShuttleVehicleModel(id: 'v1', model: 'Vito', colour: 'blanc', plate: 'GH456JK', seats: 8), ShuttleVehicleModel(id: 'v2', model: 'Trafic', seats: 6)],
      vehicle: const TripVehicleChoice(vehicleId: 'v1'),
      dayVehicleId: 'v1',
    );
    await show(tester, state);
    expect(find.text('Vito blanc · GH-456-JK · 3 pass. sur 8'), findsOneWidget);
    await tester.tap(find.byKey(const Key('start-trip')));
    await tester.pumpAndSettle();
    expect(find.text('Votre navette'), findsNothing);
    expect(verify(() => bloc.add(captureAny())).captured, [isA<ShuttleStartRequested>()]);

    await tester.tap(find.byKey(const Key('vehicle-change')));
    await tester.pumpAndSettle();
    expect(find.text('Votre navette'), findsOneWidget);
    await tester.tap(find.byKey(const Key('vehicle-v2')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('vehicle-confirm')));
    await tester.pumpAndSettle();
    final events = verify(() => bloc.add(captureAny())).captured;
    expect(events[0], isA<ShuttleVehicleChosen>().having((e) => e.vehicle.vehicleId, 'vehicleId', 'v2'));
    expect(events[1], isA<ShuttleStartRequested>());

    // Nothing ticked: the vehicle and its seats; « Changer » only picks the vehicle.
    bloc = MockShuttleBloc();
    await show(tester, state.copyWith(selected: const {}));
    expect(find.text('Vito blanc · GH-456-JK · 8 places'), findsOneWidget);
    await tester.tap(find.byKey(const Key('vehicle-change')));
    await tester.pumpAndSettle();
    expect(find.text('Choisir ce véhicule'), findsOneWidget);
    await tester.tap(find.byKey(const Key('vehicle-confirm')));
    await tester.pumpAndSettle();
    expect(verify(() => bloc.add(captureAny())).captured, [isA<ShuttleVehicleChosen>()]);

    // Without the vehicle of the day: no line, the sheet before the start (as before).
    bloc = MockShuttleBloc();
    await show(tester, state.copyWith(dayVehicleId: null));
    expect(find.byKey(const Key('vehicle-line')), findsNothing);
    await tester.tap(find.byKey(const Key('start-trip')));
    await tester.pumpAndSettle();
    expect(find.text('Votre navette'), findsOneWidget);
  });

  testWidgets('En route (14/10/2026) : « Sur place · HH:MM » pour les clients pointés à l\'embarquement, et la note pour le voiturier', (tester) async {
    final boarded = t0.add(const Duration(minutes: 2));
    final trip = staffTrip(
      passengers: [
        const TripPassengerModel(reservationId: 'd1', reference: 'D1', customerName: 'Chloé Moreau', passengers: 2, plate: 'BN-655-RT'),
        TripPassengerModel(reservationId: 'd2', reference: 'D2', customerName: 'Vincent Blanc', passengers: 1, plate: 'DJ-150-MX', checkedInAtBoarding: true, arrivedAt: boarded),
      ],
    ).copyWith(direction: 'dropoff');
    final departures = DeparturesModel(serverTime: t0);
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), direction: 'dropoff', departures: departures, trip: trip, tracking: true, band: 1));
    expect(find.text('Sur place'), findsOneWidget);
    expect(find.text('Sur place · ${hhmm(boarded)}'), findsOneWidget);
    expect(find.text('1 voiture pointée à l\'embarquement : le voiturier la retrouve dans « Arrivées à placer », avec ses clés.'), findsOneWidget);
    bloc = MockShuttleBloc();
    final both = trip.copyWith(passengers: [for (final p in trip.passengers) p.copyWith(checkedInAtBoarding: true, arrivedAt: boarded)]);
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), direction: 'dropoff', departures: departures, trip: both, tracking: true, band: 1));
    expect(find.text('2 voitures pointées à l\'embarquement : le voiturier les retrouve dans « Arrivées à placer », avec leurs clés.'), findsOneWidget);
    // A pick-up trip shows no pill nor note.
    bloc = MockShuttleBloc();
    final pickupTrip = staffTrip(passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')]);
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), pickups: pickupsModel, trip: pickupTrip, tracking: true, band: 1));
    expect(find.byKey(const Key('route-on-site-r1')), findsNothing);
    expect(find.byKey(const Key('checked-in-note')), findsNothing);
  });

  testWidgets('F-A · En séjour : les déposés rangés par jour de retour ; Rendus côté retours', (tester) async {
    final row = StayingRowModel(reservationId: 's1', reference: 'S1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD', status: 'shuttled_out', returnAt: t0.add(const Duration(days: 2)), returnFlight: 'AF 7642', spot: 'A-07');
    final staying = StayingModel(serverTime: t0, days: [StayingDayModel(date: '2026-10-05', rows: [row])], returnedToday: [row.copyWith(status: 'back_at_parking', returnedAt: t0)]);
    await show(tester, ShuttleState(now: t0, direction: 'dropoff', departures: DeparturesModel(serverTime: t0), staying: staying, band: 2));
    expect(find.text('En séjour · 1'), findsOneWidget);
    expect(find.textContaining('· 1 retour'), findsOneWidget);
    expect(find.byKey(const Key('staying-s1')), findsOneWidget);
    expect(find.textContaining('AF 7642'), findsOneWidget);
    expect(find.text('A-07'), findsOneWidget);
    bloc = MockShuttleBloc();
    await show(tester, ShuttleState(now: t0, pickups: pickupsModel, staying: staying, band: 2));
    expect(find.text('Rendus · 1'), findsOneWidget);
    expect(find.text('Revenus aujourd\'hui'), findsOneWidget);
    expect(find.text('De retour au parking'), findsOneWidget);
  });
}
