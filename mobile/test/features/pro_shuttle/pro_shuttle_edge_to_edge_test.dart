import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_shuttle/data/models/shuttle_models.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/pro_vehicles_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/shuttle_waves_bloc.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/pages/pro_shuttle_page.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/pages/pro_vehicles_page.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/widgets/shuttle_waves_card.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockShuttleBloc extends MockBloc<ShuttleEvent, ShuttleState> implements ShuttleBloc {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

class MockWavesBloc extends MockBloc<ShuttleWavesEvent, ShuttleWavesState> implements ShuttleWavesBloc {}

class MockVehiclesBloc extends MockBloc<ProVehiclesEvent, ProVehiclesState> implements ProVehiclesBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): the Navette screen pushed above the shell (Plus › Navette, a
/// tile) and its « Votre navette » sheet keep their buttons clear of the navigation bar; the day chips of « Ligne du
/// jour » add no side inset of their own; « Véhicules de navette » keeps clear of a side bar in landscape.
void main() {
  setUpAll(setUpLocalizedTests);

  final pickups = PickupsModel(serverTime: t0, meetingPoint: meetingT1, rows: [pickup('r1', 'Camille Martin', flight: landedFlight())]);

  MockWavesBloc wavesBloc() {
    final waves = MockWavesBloc();
    whenListen(
      waves,
      const Stream<ShuttleWavesState>.empty(),
      initialState: ShuttleWavesState(now: t0, data: ShuttleForecastModel(serverTime: t0, date: '2026-10-05')),
    );
    return waves;
  }

  /// The Navette screen on its own, as when it is pushed above the shell (no tab bar under it).
  Future<MockShuttleBloc> show(WidgetTester tester, ShuttleState state, {Size size = const Size(400, 1800)}) async {
    final bloc = MockShuttleBloc();
    whenListen(bloc, const Stream<ShuttleState>.empty(), initialState: state);
    final live = MockLiveBloc();
    whenListen(live, const Stream<LiveShuttlesState>.empty(), initialState: LiveShuttlesState(now: t0));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ShuttleBloc>.value(value: bloc),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
          BlocProvider<ShuttleWavesBloc>.value(value: wavesBloc()),
        ],
        child: const ProShuttlePage(),
      ),
      size: size,
    );
    return bloc;
  }

  testWidgets('« Votre navette » : le bouton « Confirmer et démarrer » reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await show(tester, ShuttleState(now: t0, pickups: pickups, selected: const {'r1'}));
    await tester.tap(find.byKey(const Key('start-trip')));
    await tester.pumpAndSettle();
    expect(find.text('Votre navette'), findsOneWidget);
    expectClearOfSystemBars(tester, find.byKey(const Key('vehicle-confirm')));
  });

  testWidgets('Navette ouverte au-dessus des onglets : « Clients récupérés », en fin de liste, reste au-dessus de la barre', (tester) async {
    setSystemBars(tester);
    final trip = staffTrip(passengers: const [TripPassengerModel(reservationId: 'r1', reference: 'Rr1', customerName: 'Camille Martin', passengers: 2, plate: 'AB-123-CD')]);
    await show(tester, ShuttleState(now: t0.add(const Duration(minutes: 5)), pickups: pickups, trip: trip, tracking: true, band: 1), size: const Size(400, 560));
    final list = find.byKey(const ValueKey('band-list-1'));
    final position = tester.state<ScrollableState>(find.descendant(of: list, matching: find.byType(Scrollable)).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 20 && position.pixels < position.maxScrollExtent; i++) {
      await tester.drag(list, const Offset(0, -300));
      await tester.pumpAndSettle();
    }
    expect(position.pixels, position.maxScrollExtent);
    expectClearOfSystemBars(tester, find.byKey(const Key('end-trip')));
  });

  testWidgets('paysage : « Véhicules de navette » s\'écarte de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    final bloc = MockVehiclesBloc();
    whenListen(
      bloc,
      const Stream<ProVehiclesState>.empty(),
      initialState: const ProVehiclesState(vehicles: [ShuttleVehicleModel(id: 'v1', model: 'Mercedes Vito', colour: 'blanc', plate: 'GH-456-JK', seats: 8)]),
    );
    await pumpLocalized(tester, BlocProvider<ProVehiclesBloc>.value(value: bloc, child: const ProVehiclesPage()), size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('vehicle-v1')));
    expectClearOfSystemBars(tester, find.byKey(const Key('remove-v1')));
  });

  testWidgets('paysage : les jours de « Ligne du jour » ne s\'écartent pas une seconde fois du bord', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await pumpLocalized(
      tester,
      BlocProvider<ShuttleWavesBloc>.value(
        value: wavesBloc(),
        // No SafeArea above: the card's own list must not add the side insets it still sees.
        child: const Scaffold(body: SingleChildScrollView(child: ShuttleWavesCard())),
      ),
      size: const Size(800, 400),
    );
    final chips = find.descendant(of: find.byType(ShuttleWavesCard), matching: find.byType(ListView));
    expect(tester.getTopLeft(find.byKey(const Key('waves-day-0'))).dx, tester.getTopLeft(chips).dx);
  });
}
