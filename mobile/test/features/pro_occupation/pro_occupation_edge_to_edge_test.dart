import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/data/models/occupation_models.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/bloc/pro_occupation_bloc.dart';
import 'package:parking_app/src/features/pro_occupation/presentation/pages/pro_occupation_page.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockOccupationBloc extends MockBloc<ProOccupationEvent, ProOccupationState> implements ProOccupationBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): the Occupation opened above the shell (« Placer » on a
/// reservation) ends above the navigation bar and keeps clear of a side bar in landscape; its « Placer » keys sheet keeps
/// its button above the bar once the keyboard is down.
void main() {
  setUpAll(setUpLocalizedTests);

  const valet = StaffModel(id: 'v1', name: 'Paul Martin', email: 'p@example.com', role: 'valet', post: 'valet', effectivePost: 'valet');

  OccupantModel arrival(int i) => OccupantModel(
    id: 'r$i',
    reference: 'PLZ-R$i',
    customerName: 'Client $i',
    plate: 'AB-${100 + i}-CD',
    status: 'arrived',
    arrivalAt: '2026-10-14T09:${(10 + i).toString().padLeft(2, '0')}',
    returnAt: '2026-10-17T18:00',
    suggestions: [SuggestionModel(spotId: 's$i', code: 'A-0$i', reason: 'free')],
  );

  final state = ProOccupationState(
    board: OccupationBoardModel(
      date: '2026-10-14',
      arrivals: [for (var i = 1; i <= 6; i++) arrival(i)],
      stats: const OccupationStatsModel(active: 0, occupied: 0, leavingToday: 0),
    ),
  );

  Future<void> show(WidgetTester tester, {Size size = const Size(400, 800)}) async {
    final bloc = MockOccupationBloc();
    whenListen(bloc, const Stream<ProOccupationState>.empty(), initialState: state);
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: valet));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProOccupationBloc>.value(value: bloc),
          BlocProvider<ProAuthBloc>.value(value: auth),
        ],
        child: const ProOccupationPage(),
      ),
      size: size,
    );
  }

  /// Scrolls the page's list (the search field has a scrollable of its own) to its very end: the list builds lazily, so its
  /// extent grows as it goes.
  Future<void> scrollToEnd(WidgetTester tester) async {
    final position = tester.state<ScrollableState>(find.descendant(of: find.byType(ListView).first, matching: find.byType(Scrollable)).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 10 && position.pixels != position.maxScrollExtent; i++) {
      position.jumpTo(position.maxScrollExtent);
      await tester.pump();
    }
  }

  testWidgets('ouverte au-dessus des onglets : la dernière arrivée et son « Placer » restent au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await show(tester);
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('arrival-PLZ-R6')));
    expectClearOfSystemBars(tester, find.byKey(const Key('place-PLZ-R6')));
  });

  testWidgets('« Placer en A-01 » : le bouton « Placer » reste au-dessus de la barre une fois le clavier rentré', (tester) async {
    setSystemBars(tester);
    await show(tester);
    await tester.tap(find.byKey(const Key('place-PLZ-R1')));
    // A few frames, not pumpAndSettle: the focused field's cursor blinks for ever.
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 50));
    }
    expect(find.byKey(const Key('place-keys')), findsOneWidget);
    expectClearOfSystemBars(tester, find.byKey(const Key('place-confirm')));
  });

  testWidgets('paysage : la recherche et les arrivées s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await show(tester, size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('occupation-search')));
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('arrival-PLZ-R6')));
  });
}
