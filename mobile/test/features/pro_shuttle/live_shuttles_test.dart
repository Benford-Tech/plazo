import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/core/utils/use_case.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/domain/usecases/shuttle_use_cases.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/widgets/live_shuttles_card.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockLive extends Mock implements GetLiveShuttlesUseCase {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

final live = LiveShuttlesModel(
  serverTime: t0,
  parking: const LiveParkingModel(id: 'p1', name: 'Parking LYS', lat: 45.73, lng: 5.05),
  stops: const [ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true)],
  trips: [
    LiveTripModel(
      id: 't1',
      driverId: 'd1',
      driverName: 'Karim Benali',
      vehicle: const TripVehicleModel(model: 'Vito', colour: 'blanc'),
      stop: const ShuttleStopModel(kind: 'airport', name: 'Terminal 1 · Porte 12', lat: 45.7205, lng: 5.0817, builtIn: true),
      passengers: 3,
      startedAt: t0,
      expiresAt: t0.add(const Duration(minutes: 90)),
      position: const ShuttlePositionModel(lat: 45.7255, lng: 5.065),
      toStop: const LiveEstimateModel(distanceM: 2100, etaMinutes: 4),
    ),
    LiveTripModel(
      id: 't2',
      direction: 'dropoff',
      driverId: 'd2',
      driverName: 'Léa Durand',
      stop: const ShuttleStopModel(id: 's1', kind: 'station', name: 'Gare TGV', lat: 45.7209, lng: 5.0756),
      passengers: 1,
      startedAt: t0,
      expiresAt: t0.add(const Duration(minutes: 90)),
    ),
  ],
);

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(NoParams());
  });

  test('P-A · le bloc interroge l’API à l’ouverture puis à chaque tour', () async {
    final get = MockLive();
    when(() => get(any())).thenAnswer((_) async => Right(live));
    final bloc = LiveShuttlesBloc(get, clock: () => t0, pollInterval: const Duration(milliseconds: 20))..add(const LiveShuttlesStarted());
    await bloc.stream.firstWhere((s) => s.loaded);
    expect(bloc.state.trips.map((t) => t.id), ['t1', 't2']);
    await Future<void>.delayed(const Duration(milliseconds: 70));
    verify(() => get(any())).called(greaterThanOrEqualTo(3));
    await bloc.close();
  });

  Future<void> show(WidgetTester tester, LiveShuttlesState state, Widget child) async {
    final bloc = MockLiveBloc();
    whenListen(bloc, const Stream<LiveShuttlesState>.empty(), initialState: state);
    await pumpLocalized(tester, BlocProvider<LiveShuttlesBloc>.value(value: bloc, child: Scaffold(body: ListView(children: [child]))));
  }

  testWidgets('P-A · carte « Navettes en cours » : une ligne par navette, la carte quand une position existe', (tester) async {
    await show(tester, LiveShuttlesState(now: t0, data: live), const LiveShuttlesCard());
    expect(find.text('Navettes en cours · 2'), findsOneWidget);
    expect(find.text('Vito blanc · Karim → aéroport'), findsOneWidget);
    expect(find.textContaining('3 client(s) · à 2,1 km de la desserte'), findsOneWidget);
    expect(find.text('Navette · Léa → Gare TGV'), findsOneWidget);
    expect(find.textContaining('position en attente'), findsOneWidget);
    expect(find.byKey(const Key('live-bus-t1')), findsOneWidget);
    expect(find.byKey(const Key('live-bus-t2')), findsNothing);
  });

  testWidgets('P-A · sans navette : « Aucune navette en route » ; le bandeau d’Aujourd’hui disparaît', (tester) async {
    final empty = LiveShuttlesState(now: t0, data: live.copyWith(trips: const []));
    await show(tester, empty, const LiveShuttlesCard());
    expect(find.byKey(const Key('live-shuttles-none')), findsOneWidget);
    await show(tester, empty, LiveShuttlesStrip(onTap: () {}));
    expect(find.byKey(const Key('live-shuttles-strip')), findsNothing);
    var tapped = false;
    await show(tester, LiveShuttlesState(now: t0, data: live), LiveShuttlesStrip(onTap: () => tapped = true));
    expect(find.byKey(const Key('live-strip-t1')), findsOneWidget);
    await tester.tap(find.byKey(const Key('live-shuttles-strip')));
    expect(tapped, isTrue);
  });
}
