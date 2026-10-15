import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/return_day/data/models/return_model.dart';
import 'package:parking_app/src/features/return_day/presentation/bloc/return_bloc.dart';
import 'package:parking_app/src/features/return_day/presentation/pages/find_car_page.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockReturnBloc extends MockBloc<ReturnEvent, ReturnState> implements ReturnBloc {}

/// Edge-to-edge (Android 15+, 15/10/2026): « Retrouver ma voiture » on its dark ground, under the system bars.
void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> show(WidgetTester tester, Size size) async {
    final bloc = MockReturnBloc();
    final data = travellerReturn().copyWith(
      spot: const ReturnSpotModel(code: 'A-07', stayClass: 'short'),
      parking: const ReturnParkingModel(name: 'Parking Démo LYS', address: '12 route de l’Aéroport', location: ShuttlePositionModel(lat: 45.7375, lng: 5.0745)),
    );
    whenListen(bloc, const Stream<ReturnState>.empty(), initialState: ReturnState(now: t0, reference: 'R7KQ2M', data: data, fetchedAt: DateTime.now()));
    await pumpLocalized(tester, BlocProvider<ReturnBloc>.value(value: bloc, child: const FindCarPage(reference: 'R7KQ2M')), size: size);
  }

  /// Scrolls the page to its end (the drag starts on the spot card, not on the map, which takes its own drags).
  Future<void> scrollToEnd(WidgetTester tester) async {
    await tester.drag(find.byKey(const Key('find-car-spot')), const Offset(0, -1000));
    await tester.pump(const Duration(milliseconds: 500));
  }

  /// The system bars' style the engine would read at [logical] (RenderView looks it up in the layer tree).
  SystemUiOverlayStyle? styleAt(WidgetTester tester, Offset logical) =>
      tester.binding.renderViews.first.debugLayer!.find<SystemUiOverlayStyle>(logical * tester.view.devicePixelRatio);

  testWidgets('petit téléphone : « Itinéraire à pied » au-dessus de la barre de navigation, icônes claires en haut et en bas', (tester) async {
    setSystemBars(tester);
    await show(tester, const Size(360, 600));
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('find-car-route')));
    expect(styleAt(tester, const Offset(180, 12))?.statusBarIconBrightness, Brightness.light);
    expect(styleAt(tester, const Offset(180, 600 - 24))?.systemNavigationBarIconBrightness, Brightness.light);
  });

  testWidgets('paysage : la page s’écarte de la barre de navigation à droite et de l’encoche à gauche', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await show(tester, const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('find-car-spot')));
    await scrollToEnd(tester);
    expectClearOfSystemBars(tester, find.byKey(const Key('find-car-route')));
  });
}
