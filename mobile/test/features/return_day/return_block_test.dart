import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/arrival/presentation/bloc/arrival_bloc.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/return_bloc.dart';
import 'package:parking_app/src/features/return_day/presentation/widgets/return_block.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockReturnBloc extends MockBloc<ReturnEvent, ReturnState> implements ReturnBloc {}

class MockArrivalBloc extends MockBloc<ArrivalEvent, ArrivalState> implements ArrivalBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ReturnTicked());
    registerFallbackValue(const ArrivalTicked());
  });

  late MockReturnBloc bloc;
  late MockArrivalBloc arrivalBloc;
  setUp(() {
    bloc = MockReturnBloc();
    arrivalBloc = MockArrivalBloc();
    whenListen(arrivalBloc, const Stream<ArrivalState>.empty(), initialState: ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(kind: ArrivalKind.returnTrip)));
  });

  Future<void> show(WidgetTester tester, ReturnState state) async {
    whenListen(bloc, const Stream<ReturnState>.empty(), initialState: state);
    await pumpLocalized(
      tester,
      Scaffold(
        body: MultiBlocProvider(
          providers: [BlocProvider<ReturnBloc>.value(value: bloc), BlocProvider<ArrivalBloc>.value(value: arrivalBloc)],
          child: const SingleChildScrollView(child: ReturnBlock()),
        ),
      ),
    );
  }

  testWidgets('R1 · vol prévu : ligne de temps, itinéraire, « Je suis au point de rendez-vous »', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flight: const FlightViewModel(number: 'TO 3627', status: 'scheduled', scheduledAt: null))));
    expect(find.byKey(const Key('return-timeline')), findsOneWidget);
    expect(find.text('Vol TO 3627 · atterrissage prévu 10:30'), findsOneWidget);
    expect(find.text('suivi automatique du vol'), findsOneWidget);
    expect(find.text('Rejoignez le point de rendez-vous'), findsOneWidget);
    expect(find.text('Terminal 1 · Porte 12 · 6 min à pied'), findsOneWidget);
    expect(find.text('La navette vient vous chercher'), findsOneWidget);
    expect(find.text('Récupérez votre voiture'), findsOneWidget);
    expect(find.text("clés à l'accueil · AB-123-CD"), findsOneWidget);
    expect(find.byKey(const Key('directions-button')), findsOneWidget);
    // The flight is tracked: no "J'ai atterri".
    expect(find.byKey(const Key('landed-button')), findsNothing);

    await tester.tap(find.byKey(const Key('at-point-button')));
    expect(verify(() => arrivalBloc.add(captureAny())).captured.single, isA<ArrivalAtMeetingPointRequested>());
  });

  testWidgets('R1 · sans suivi de vol : « J’ai atterri »', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flightTracked: false)));
    expect(find.text('Sans numéro de vol, dites-nous quand vous avez atterri.'), findsOneWidget);
    await tester.tap(find.byKey(const Key('landed-button')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ReturnLandedDeclared>());
  });

  testWidgets('R1 · vol atterri : l’étape « point de rendez-vous » est en cours', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flight: landedFlight())));
    expect(find.text('Vol TO 3627 atterri · ${_hhmm(t0.subtract(const Duration(minutes: 5)))}'), findsOneWidget);
    expect(find.text('Terminal 1 · Porte 12 · 6 min à pied'), findsOneWidget);
    expect(find.byKey(const Key('landed-button')), findsNothing);
  });

  testWidgets('R1 · au point de rendez-vous : plus de bouton, le chauffeur est prévenu', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flight: landedFlight(), atMeetingPointAt: t0)));
    expect(find.byKey(const Key('at-point-button')), findsNothing);
    expect(find.byKey(const Key('at-point-done')), findsOneWidget);
    expect(find.text('le chauffeur sait que vous êtes là'), findsOneWidget);
  });

  testWidgets('R3 · navette en route : carte, ETA, véhicule, chauffeur, consignes', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flight: landedFlight(), atMeetingPointAt: t0, shuttle: travellerShuttle())));
    expect(find.byKey(const Key('shuttle-live')), findsOneWidget);
    expect(find.byKey(const Key('return-timeline')), findsNothing);
    expect(find.text('Navette en route vers vous'), findsOneWidget);
    expect(find.byType(IgnMap), findsOneWidget);
    expect(find.text('4 min'), findsWidgets);
    expect(find.text('arrivée vers ${_hhmm(t0.add(const Duration(minutes: 4)))}'), findsOneWidget);
    expect(find.text('Navette blanche'), findsOneWidget);
    expect(find.textContaining('Mercedes Vito', findRichText: true), findsOneWidget);
    expect(find.text('chauffeur : Karim'), findsOneWidget);
    expect(find.textContaining('Sortez de la zone bagages'), findsOneWidget);
  });

  testWidgets('R3 · navette sans position encore : en attente', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', data: travellerReturn(flight: landedFlight(), shuttle: travellerShuttle(etaMinutes: null, withPosition: false))));
    expect(find.text('—'), findsOneWidget);
    expect(find.text('en attente de la position du chauffeur…'), findsOneWidget);
  });

  testWidgets('trajet terminé : la ligne de temps revient avec une note', (tester) async {
    await show(tester, ReturnState(now: t0, reference: 'R7KQ2M', shuttleEndedAt: t0, data: travellerReturn(flight: landedFlight(), atMeetingPointAt: t0)));
    expect(find.text('La navette est arrivée : votre chauffeur vous attend.'), findsOneWidget);
    expect(find.byKey(const Key('return-timeline')), findsOneWidget);
  });
}

String _hhmm(DateTime t) {
  final l = t.toLocal();
  return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
}
