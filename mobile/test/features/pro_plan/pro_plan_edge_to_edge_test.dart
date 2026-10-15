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
import '../../helpers/system_bars.dart';

class MockPlanBloc extends MockBloc<ProPlanEvent, ProPlanState> implements ProPlanBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): the plan, pushed above the shell, keeps its buttons clear of the
/// navigation bar (the draw step's fixed panel, the end of the other steps) and, in landscape, of a side bar or cutout.
void main() {
  setUpAll(setUpLocalizedTests);

  const parking = ParkingSummaryModel(id: 'p1', name: 'Parkair', totalCapacity: 150);
  const corners = [LatLng(45.72, 5.08), LatLng(45.72, 5.0806), LatLng(45.7204, 5.0806)];

  Future<void> show(WidgetTester tester, ProPlanState state, {Size size = const Size(400, 800)}) async {
    final bloc = MockPlanBloc();
    whenListen(bloc, const Stream<ProPlanState>.empty(), initialState: state);
    await pumpLocalized(tester, BlocProvider<ProPlanBloc>.value(value: bloc, child: const ProPlanPage()), size: size);
  }

  /// Scrolls the step's list to its end.
  Future<void> scrollToEnd(WidgetTester tester) async {
    final position = tester.state<ScrollableState>(find.byType(Scrollable).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    position.jumpTo(position.maxScrollExtent);
    await tester.pump();
  }

  testWidgets('« Tracer le contour » : Annuler, Rectangle et « Valider le contour » restent au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await show(tester, const ProPlanState(viewState: ViewState.success, step: PlanStep.draw, parking: parking, center: LatLng(45.72, 5.08), corners: corners));
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-undo')));
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-rectangle')));
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-validate')));
  });

  testWidgets('« Générer les places » : « Modifier le contour », en fin de page, reste au-dessus de la barre', (tester) async {
    setSystemBars(tester);
    await show(
      tester,
      const ProPlanState(
        viewState: ViewState.success,
        step: PlanStep.generate,
        parking: parking,
        center: LatLng(45.72, 5.08),
        corners: corners,
        estimate: PlanEstimateModel(usableArea: 400, totals: {'selfPark': 10, 'valet24': 14, 'valet5': 15, 'valetEdge': 16}),
      ),
      size: const Size(400, 700),
    );
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-edit-outline')));
  });

  testWidgets('« Où est le parking » : « Tracer le contour », en fin de page, reste au-dessus de la barre', (tester) async {
    setSystemBars(tester);
    await show(
      tester,
      const ProPlanState(
        viewState: ViewState.success,
        parking: parking,
        center: LatLng(45.72, 5.08),
        results: [
          GeocodeResultModel(label: '1 rue de l\'Aéroport, Colombier-Saugnieu', type: 'housenumber', lon: 5.08, lat: 45.72),
          GeocodeResultModel(label: '2 rue de l\'Aéroport, Colombier-Saugnieu', type: 'housenumber', lon: 5.081, lat: 45.721),
        ],
      ),
      size: const Size(400, 700),
    );
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-to-draw')));
  });

  testWidgets('paysage : la carte et les boutons du tracé s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await show(
      tester,
      const ProPlanState(viewState: ViewState.success, step: PlanStep.draw, parking: parking, center: LatLng(45.72, 5.08), corners: corners),
      size: const Size(800, 400),
    );
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-chip')));
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-undo')));
    expectClearOfSystemBars(tester, find.byKey(const Key('plan-validate')));
  });
}
