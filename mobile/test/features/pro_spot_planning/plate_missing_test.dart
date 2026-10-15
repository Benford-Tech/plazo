import 'dart:async';

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

class MockPlanningBloc extends MockBloc<ProSpotPlanningEvent, ProSpotPlanningState> implements ProSpotPlanningBloc {}

class MockAuthBloc extends MockBloc<ProAuthEvent, ProAuthState> implements ProAuthBloc {}

/// 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): a booking imported without its plate is named
/// by its customer on its bar, and « Véhicule » / « Le véhicule » in the notices, as on the web.
void main() {
  setUpAll(setUpLocalizedTests);

  const manager = StaffModel(id: 'u1', name: 'Nadia Roux', email: 'nadia@parkair.fr', role: 'manager');
  const from = '2026-10-04';
  final planning = SpotPlanningModel(
    from: from,
    days: 7,
    capacity: 1,
    spots: [
      PlannedSpotModel(
        id: 's1',
        zoneId: 'z1',
        code: 'A-01',
        row: 1,
        index: 1,
        kind: 'standard',
        active: true,
        stays: [
          PlannedStayModel(
            id: 'r1',
            reference: 'PLZ-R1',
            customerName: 'Jean Martin',
            plate: '',
            status: 'upcoming',
            arrivalAt: DateTime(2026, 10, 5, 8),
            returnAt: DateTime(2026, 10, 8, 18),
            spotId: 's1',
          ),
        ],
      ),
    ],
  );
  final initial = ProSpotPlanningState(
    viewState: ViewState.success,
    parking: const ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 1),
    from: from,
    planning: planning,
  );

  Future<StreamController<ProSpotPlanningState>> show(WidgetTester tester) async {
    final states = StreamController<ProSpotPlanningState>();
    final bloc = MockPlanningBloc();
    whenListen(bloc, states.stream, initialState: initial);
    final auth = MockAuthBloc();
    whenListen(auth, const Stream<ProAuthState>.empty(), initialState: const ProAuthState(status: ProAuthStatus.signedIn, staff: manager));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [BlocProvider<ProSpotPlanningBloc>.value(value: bloc), BlocProvider<ProAuthBloc>.value(value: auth)],
        child: const ProSpotPlanningPage(),
      ),
      size: const Size(400, 800),
    );
    return states;
  }

  testWidgets('la barre d’un séjour sans plaque porte le nom du client', (tester) async {
    final states = await show(tester);
    expect(find.descendant(of: find.byKey(const Key('bar-PLZ-R1')), matching: find.text('Jean Martin')), findsOneWidget);
    await states.close();
  });

  for (final (notice, text) in [('planning.moved::A-01', 'Véhicule placé en A-01'), ('planning.released:', 'Le véhicule n\'a plus de place')]) {
    testWidgets('« $text »', (tester) async {
      final states = await show(tester);
      states.add(initial.copyWith(notice: notice));
      await tester.pump();
      await tester.pump();
      expect(find.text(text), findsOneWidget);
      await states.close();
    });
  }
}
