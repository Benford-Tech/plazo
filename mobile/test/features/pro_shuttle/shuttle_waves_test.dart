import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/domain/usecases/shuttle_use_cases.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_waves_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/widgets/shuttle_waves_card.dart';

import '../../helpers/pump_app.dart';

/// V-A "Ligne du jour" (05/10/2026): the bloc and the card.

class MockForecast extends Mock implements GetShuttleForecastUseCase {}

class MockWavesBloc extends MockBloc<ShuttleWavesEvent, ShuttleWavesState> implements ShuttleWavesBloc {}

final t0 = DateTime(2026, 10, 6, 5, 0);

WaveFlightModel flight(String number, String? status, DateTime scheduledAt, {DateTime? estimatedAt}) =>
    WaveFlightModel(number: number, status: status, scheduledAt: scheduledAt, estimatedAt: estimatedAt);

WaveMemberModel member(
  String id,
  String name,
  int passengers, {
  String direction = 'dropoff',
  WaveFlightModel? f,
  bool noFlight = false,
  String state = 'planned',
}) => WaveMemberModel(
  reservationId: id,
  reference: id.toUpperCase(),
  customerName: name,
  passengers: passengers,
  plate: 'AB-123-CD',
  direction: direction,
  leaveAt: DateTime(2026, 10, 6, 5, 40),
  meetAt: direction == 'pickup' ? DateTime(2026, 10, 6, 10, 30) : null,
  flight: f,
  noFlight: noFlight,
  state: state,
);

final forecast = ShuttleForecastModel(
  serverTime: t0,
  date: '2026-10-06',
  times: const WaveTimesModel(shuttleTravelMinutes: 10, terminalLeadMinutes: 120, landingDelayMinutes: 30),
  seats: 8,
  vehiclesInService: 1,
  waves: [
    ShuttleWaveModel(
      id: 'w1',
      direction: 'dropoff',
      leaveAt: DateTime(2026, 10, 6, 5, 40),
      passengers: 11,
      seats: 8,
      vehiclesNeeded: 2,
      noFlight: 1,
      flights: const ['AF 7641'],
      members: [
        member('r1', 'Camille Martin', 4, f: flight('AF 7641', 'delayed', DateTime(2026, 10, 6, 7, 45), estimatedAt: DateTime(2026, 10, 6, 8, 10))),
        member('r2', 'Paul Dupont', 4, f: flight('AF 7641', 'scheduled', DateTime(2026, 10, 6, 7, 45))),
        member('r3', 'Lan Nguyen', 3, noFlight: true),
      ],
    ),
    ShuttleWaveModel(
      id: 'w2',
      direction: 'pickup',
      stopId: 's1',
      stopName: 'Gare TGV',
      leaveAt: DateTime(2026, 10, 6, 10, 20),
      meetAt: DateTime(2026, 10, 6, 10, 30),
      passengers: 2,
      seats: 8,
      vehiclesNeeded: 1,
      flights: const ['TO 3628'],
      state: 'done',
      members: [member('r4', 'Marco Rossi', 2, direction: 'pickup', state: 'done', f: flight('TO 3628', 'landed', DateTime(2026, 10, 6, 9, 50)))],
    ),
  ],
);

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
  });

  test('le bloc charge le jour, change de jour (date locale) et interroge à chaque tour', () async {
    final get = MockForecast();
    when(() => get(any())).thenAnswer((_) async => Right(forecast));
    final bloc = ShuttleWavesBloc(get, clock: () => t0, pollInterval: const Duration(milliseconds: 20))..add(const ShuttleWavesStarted());
    await bloc.stream.firstWhere((s) => s.loaded);
    expect(bloc.state.waves.length, 2);
    expect(bloc.state.next?.id, 'w1');
    await Future<void>.delayed(const Duration(milliseconds: 70));
    verify(() => get(null)).called(greaterThanOrEqualTo(3));
    bloc.add(const ShuttleWavesDayChanged(1));
    await bloc.stream.firstWhere((s) => s.loaded && s.dayOffset == 1);
    verify(() => get('2026-10-07')).called(greaterThanOrEqualTo(1));
    expect(bloc.state.next, isNull);
    await bloc.close();
  });

  testWidgets('la carte : heure, sens, passagers / places, 2 navettes, vols, et « Démarrer ce trajet » sur une vague à venir', (tester) async {
    final bloc = MockWavesBloc();
    whenListen(
      bloc,
      const Stream<ShuttleWavesState>.empty(),
      initialState: ShuttleWavesState(now: t0, data: forecast),
    );
    ShuttleWaveModel? started;
    await pumpLocalized(
      tester,
      BlocProvider<ShuttleWavesBloc>.value(
        value: bloc,
        child: Scaffold(
          body: SingleChildScrollView(child: ShuttleWavesCard(onStart: (w) => started = w)),
        ),
      ),
    );
    expect(find.text('Ligne du jour'), findsOneWidget);
    // 06/10/2026: only the waves ahead are listed; the done one is folded under "1 créneau passé".
    expect(find.text('1 à venir'), findsOneWidget);
    expect(find.text('05:40'), findsOneWidget);
    expect(find.text('Faite'), findsNothing);
    expect(find.text('1 créneau passé'), findsOneWidget);
    await tester.tap(find.byKey(const Key('waves-past')));
    await tester.pump();
    expect(find.text('Vers le terminal · Aéroport'), findsOneWidget);
    expect(find.text('11 / 8'), findsOneWidget);
    expect(find.text('2 navettes'), findsOneWidget);
    expect(find.text('1 sans vol'), findsOneWidget);
    expect(find.text('AF 7641 · décollage 08:10 · retardé +25'), findsOneWidget);
    expect(find.text('heure saisie 05:40'), findsOneWidget);
    expect(find.text("Depuis l'aéroport · Gare TGV"), findsOneWidget);
    expect(find.text('rendez-vous 10:30'), findsOneWidget);
    expect(find.text('Faite'), findsOneWidget);
    expect(find.text('1 véhicule(s) en service · 8 places'), findsOneWidget);
    // Only the planned wave can start.
    expect(find.byKey(const Key('wave-start-w1')), findsOneWidget);
    expect(find.byKey(const Key('wave-start-w2')), findsNothing);
    await tester.tap(find.byKey(const Key('wave-start-w1')));
    expect(started?.id, 'w1');
    // The day chips.
    expect(find.byKey(const Key('waves-day-1')), findsOneWidget);
  });
}
