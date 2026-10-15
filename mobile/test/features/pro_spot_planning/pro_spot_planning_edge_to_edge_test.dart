import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_auth/data/models/staff_model.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/data/models/spot_planning_models.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/bloc/pro_spot_planning_bloc.dart';
import 'package:parking_app/src/features/pro_spot_planning/presentation/pages/pro_spot_planning_page.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockPlanningBloc extends MockBloc<ProSpotPlanningEvent, ProSpotPlanningState> implements ProSpotPlanningBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): « Planning des places » opened above the shell (Plus, the
/// Occupation's app bar) keeps the stays of its last row above the navigation bar, and its toolbar clear of a side bar or
/// cutout in landscape.
void main() {
  setUpAll(setUpLocalizedTests);

  const manager = StaffModel(id: 'u1', name: 'Nadia Roux', email: 'nadia@parkair.fr', role: 'manager');
  const from = '2026-10-04';

  // Twenty spots, each with a stay from the 5th to the 8th (phone time, like the grid).
  final planning = SpotPlanningModel(
    from: from,
    days: 7,
    capacity: 20,
    spots: [
      for (var i = 1; i <= 20; i++)
        PlannedSpotModel(
          id: 's$i',
          zoneId: 'z1',
          code: 'A-${i.toString().padLeft(2, '0')}',
          row: 1,
          index: i,
          kind: 'standard',
          active: true,
          stays: [
            PlannedStayModel(
              id: 'r$i',
              reference: 'PLZ-R$i',
              customerName: 'Client $i',
              plate: 'AB-${100 + i}-CD',
              status: 'upcoming',
              arrivalAt: DateTime(2026, 10, 5, 8),
              returnAt: DateTime(2026, 10, 8, 18),
              spotId: 's$i',
            ),
          ],
        ),
    ],
  );

  Future<void> show(WidgetTester tester, {Size size = const Size(400, 800)}) async {
    final bloc = MockPlanningBloc();
    whenListen(
      bloc,
      const Stream<ProSpotPlanningState>.empty(),
      initialState: ProSpotPlanningState(
        viewState: ViewState.success,
        parking: const ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 12),
        from: from,
        planning: planning,
      ),
    );
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: manager));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [BlocProvider<ProSpotPlanningBloc>.value(value: bloc), BlocProvider<ProAuthBloc>.value(value: auth)],
        child: const ProSpotPlanningPage(),
      ),
      size: size,
    );
  }

  testWidgets('ouvert au-dessus des onglets : les séjours de la dernière place restent au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await show(tester);
    final list = find.descendant(of: find.byType(ListView).first, matching: find.byType(Scrollable)).first;
    final position = tester.state<ScrollableState>(list).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 10 && position.pixels < position.maxScrollExtent; i++) {
      position.jumpTo(position.maxScrollExtent);
      await tester.pump();
    }
    expectClearOfSystemBars(tester, find.byKey(const Key('bar-PLZ-R20')));
  });

  testWidgets('paysage : les flèches et « 7 j » s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await show(tester, size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('planning-prev')));
    expectClearOfSystemBars(tester, find.byKey(const Key('planning-next')));
    expectClearOfSystemBars(tester, find.byKey(const Key('planning-days')));
  });
}
