import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_plan/data/models/plan_models.dart';
import 'package:parking_app/src/features/pro_plan/presentation/bloc/pro_plan_bloc.dart';
import 'package:parking_app/src/features/pro_plan/presentation/pages/pro_plan_page.dart';

import '../../helpers/pump_app.dart';

class MockPlanBloc extends MockBloc<ProPlanEvent, ProPlanState> implements ProPlanBloc {}

const spot = SpotModel(
  id: 's1',
  code: 'A-01-01',
  row: 1,
  index: 1,
  kind: 'standard',
  active: true,
  geometry: [
    [5.08, 45.72],
    [5.08003, 45.72],
    [5.08003, 45.72004],
    [5.08, 45.72004],
    [5.08, 45.72],
  ],
);

ProPlanState generateStep({bool generated = false, int effectiveCapacity = 1, String capacitySource = 'spots'}) => ProPlanState(
  viewState: ViewState.success,
  step: PlanStep.generate,
  parking: ParkingSummaryModel(
    id: 'p1',
    name: 'Parkair',
    totalCapacity: 150,
    effectiveCapacity: effectiveCapacity,
    capacitySource: capacitySource,
  ),
  view: ParkingPlanViewModel(
    plan: const ParkingPlanModel(id: 'pl', parkingId: 'p1', layout: 'valet24'),
    spots: const [spot],
    activeSpots: 1,
    totalCapacity: 150,
    effectiveCapacity: effectiveCapacity,
    capacitySource: capacitySource,
  ),
  center: const LatLng(45.72, 5.08),
  estimate: const PlanEstimateModel(usableArea: 400, totals: {'selfPark': 10, 'valet24': 14, 'valet5': 15, 'valetEdge': 16}),
  generated: generated,
);

void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> pumpPlan(WidgetTester tester, ProPlanState state) async {
    final bloc = MockPlanBloc();
    whenListen(bloc, const Stream<ProPlanState>.empty(), initialState: state);
    await pumpLocalized(tester, BlocProvider<ProPlanBloc>.value(value: bloc, child: const ProPlanPage()));
  }

  testWidgets('les places du plan sont la capacité utilisée partout : plus de « Capacité déclarée »', (tester) async {
    await pumpPlan(tester, generateStep());
    expect(find.byKey(const Key('plan-capacity')), findsOneWidget);
    expect(find.text('Places du plan : 1 · utilisées partout'), findsOneWidget);
    expect(find.textContaining('Capacité déclarée'), findsNothing);
    // The generation stays.
    expect(find.byKey(const Key('plan-generate')), findsOneWidget);
    expect(find.text('Régénérer les places'), findsOneWidget);
  });

  testWidgets('après une génération, le même chiffre est confirmé', (tester) async {
    await pumpPlan(tester, generateStep(generated: true));
    expect(find.byKey(const Key('plan-applied')), findsOneWidget);
    expect(find.text('Places du plan : 1 · utilisées partout'), findsOneWidget);
    expect(find.byKey(const Key('plan-capacity')), findsNothing);
  });

  testWidgets('avec des files de voiturier, le chiffre est celui des files, pas des places', (tester) async {
    await pumpPlan(tester, generateStep(effectiveCapacity: 64, capacitySource: 'files'));
    expect(find.byKey(const Key('plan-capacity')), findsOneWidget);
    expect(find.text('Files de voiturier : 64 places · utilisées partout'), findsOneWidget);
    expect(find.textContaining('Places du plan'), findsNothing);
    expect(find.textContaining('sauf si le parking a des files de voiturier'), findsOneWidget);
  });

  testWidgets('avec des files, la confirmation après une génération nomme aussi les files', (tester) async {
    await pumpPlan(tester, generateStep(generated: true, effectiveCapacity: 64, capacitySource: 'files'));
    expect(find.byKey(const Key('plan-applied')), findsOneWidget);
    expect(find.text('Files de voiturier : 64 places · utilisées partout'), findsOneWidget);
    expect(find.textContaining('Places du plan'), findsNothing);
  });
}
