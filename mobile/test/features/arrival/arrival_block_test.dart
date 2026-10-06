import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/arrival/data/models/arrival_model.dart';
import 'package:parking_app/src/features/arrival/presentation/bloc/arrival_bloc.dart';
import 'package:parking_app/src/features/arrival/presentation/widgets/arrival_block.dart';
import 'package:parking_app/src/services/location_service.dart';
import 'package:parking_app/src/shared/widgets/ign_map.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockArrivalBloc extends MockBloc<ArrivalEvent, ArrivalState> implements ArrivalBloc {}

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ArrivalTicked());
  });

  late MockArrivalBloc bloc;
  setUp(() => bloc = MockArrivalBloc());

  Future<void> show(WidgetTester tester, ArrivalState state) async {
    whenListen(bloc, const Stream<ArrivalState>.empty(), initialState: state);
    await pumpLocalized(
      tester,
      Scaffold(
        body: BlocProvider<ArrivalBloc>.value(value: bloc, child: const SingleChildScrollView(child: ArrivalBlock())),
      ),
    );
  }

  testWidgets('écran 1 : explication, consentement par le bouton, « Prévenir sans partager »', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival()));
    expect(find.text('Prévenez le parking de votre arrivée'), findsOneWidget);
    expect(find.textContaining('uniquement', findRichText: true), findsOneWidget);
    expect(find.textContaining('(2 h maximum), puis effacée', findRichText: true), findsOneWidget);
    expect(find.text('Vous pouvez arrêter le partage à tout moment.'), findsOneWidget);

    await tester.tap(find.byKey(const Key('share-button')));
    final events = verify(() => bloc.add(captureAny())).captured;
    expect(events.single, isA<ArrivalShareRequested>().having((e) => e.consent, 'consent', isTrue));

    await tester.tap(find.text('Prévenir sans partager ma position'));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ArrivalAnnounceToggled>());

    // E: the word typed for the parking goes to the bloc, sent with the next signal.
    await tester.enterText(find.byKey(const Key('arrival-note')), '2 enfants, poussette');
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ArrivalNoteChanged>().having((e) => e.note, 'note', '2 enfants, poussette'));
  });

  testWidgets('écran 1 : les choix 10 / 20 / 30 min', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(), showAnnounceOptions: true));
    expect(find.text("J'arrive dans 10 min"), findsOneWidget);
    expect(find.text("J'arrive dans 30 min"), findsOneWidget);
    await tester.tap(find.byKey(const Key('announce-20')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ArrivalAnnounced>().having((e) => e.minutes, 'minutes', 20));
  });

  testWidgets('écran 2 : partage en cours, ETA, carte, arrêt automatique, « Arrêter le partage »', (tester) async {
    final state = ArrivalState(
      now: t0.add(const Duration(minutes: 8)),
      reference: 'R7KQ2M',
      tracking: true,
      lastPosition: position(45.8),
      arrival: arrival(signal: signal(etaMinutes: 12, distanceM: 8400)),
    );
    await show(tester, state);
    expect(find.text('Position partagée avec le parking'), findsOneWidget);
    expect(find.text('Arrivée estimée'), findsOneWidget);
    expect(find.text('12 min'), findsOneWidget);
    expect(find.text('8,4 km'), findsOneWidget);
    expect(find.textContaining('arrivée vers '), findsOneWidget);
    expect(find.text("Le parking a été prévenu · le voiturier vous attend à l'accueil"), findsOneWidget);
    expect(find.byType(IgnMap), findsOneWidget);
    expect(find.text('© IGN – Plan IGN'), findsOneWidget);
    expect(find.text("Arrêt automatique à l'arrivée, ou dans 1 h 52"), findsOneWidget);

    await tester.tap(find.byKey(const Key('stop-button')));
    expect(verify(() => bloc.add(captureAny())).captured.single, isA<ArrivalStopRequested>());
  });

  testWidgets('arrivé : partage arrêté, position effacée', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(signal: signal(state: ArrivalSignalState.atMeetingPoint))));
    expect(find.text('Vous êtes arrivé·e'), findsOneWidget);
    expect(find.textContaining('votre position a été effacée'), findsOneWidget);
    expect(find.byKey(const Key('share-button')), findsNothing);
  });

  testWidgets('expiré : le dit, et propose de recommencer', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(signal: signal(state: ArrivalSignalState.ended, endReason: 'expired'))));
    expect(find.text('Le partage s\'est arrêté au bout de 2 h et votre position a été effacée.'), findsOneWidget);
    expect(find.byKey(const Key('share-button')), findsOneWidget);
  });

  testWidgets('position refusée : propose de prévenir sans la partager', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(), locationProblem: LocationAccess.denied));
    expect(find.text('Sans accès à votre position, vous pouvez prévenir le parking sans la partager.'), findsOneWidget);
  });

  testWidgets('avant l’heure : le bloc dit quand il s’ouvrira', (tester) async {
    await show(tester, ArrivalState(now: t0, reference: 'R7KQ2M', arrival: arrival(open: false)));
    expect(find.textContaining('Le jour de votre dépôt, à partir de'), findsOneWidget);
    expect(find.byKey(const Key('share-button')), findsNothing);
  });

  testWidgets('retour : « Je suis au point de rendez-vous », position facultative', (tester) async {
    await show(
      tester,
      ArrivalState(
        now: t0,
        reference: 'R7KQ2M',
        arrival: arrival(kind: ArrivalKind.returnTrip, meetingPoint: const MeetingPointModel(lat: 45.72, lng: 5.08, source: 'return_point', label: 'Terminal 1 · P5')),
      ),
    );
    expect(find.textContaining('Terminal 1 · P5'), findsOneWidget);
    await tester.tap(find.byType(Checkbox));
    await tester.pump();
    await tester.tap(find.byKey(const Key('at-point-button')));
    expect(
      verify(() => bloc.add(captureAny())).captured.single,
      isA<ArrivalAtMeetingPointRequested>().having((e) => e.withPosition, 'withPosition', isTrue),
    );
  });
}
