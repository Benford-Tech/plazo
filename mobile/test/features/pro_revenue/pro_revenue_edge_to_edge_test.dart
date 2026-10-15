import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/bloc/pro_revenue_bloc.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/pages/pro_revenue_missing_page.dart';
import 'package:parking_app/src/features/pro_revenue/presentation/pages/pro_revenue_page.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';
import 'revenue_fixtures.dart';

class MockRevenueBloc extends MockBloc<ProRevenueEvent, ProRevenueState> implements ProRevenueBloc {}

/// Android 15+ draws Plazo Pro edge-to-edge (15/10/2026): « Chiffre d'affaires » (no app bar, a green band under the
/// status bar) ends its cards above the navigation bar and keeps them clear of a side bar in landscape, with white status
/// icons on the band and the app's dark navigation icons on the light page; « À compléter » ends above the bar too.
void main() {
  setUpAll(setUpLocalizedTests);

  MockRevenueBloc bloc() {
    final bloc = MockRevenueBloc();
    whenListen(
      bloc,
      const Stream<ProRevenueState>.empty(),
      initialState: ProRevenueState(viewState: ViewState.success, anchor: '2026-10-13', today: '2026-10-13', report: octoberReport),
    );
    return bloc;
  }

  /// Scrolls the list keyed [key] (not a text field's own scrollable) to its very end.
  Future<void> scrollToEnd(WidgetTester tester, Key key) async {
    final position = tester.state<ScrollableState>(find.descendant(of: find.byKey(key), matching: find.byType(Scrollable)).first).position;
    expect(position.maxScrollExtent, greaterThan(0));
    for (var i = 0; i < 10 && position.pixels != position.maxScrollExtent; i++) {
      position.jumpTo(position.maxScrollExtent);
      await tester.pump();
    }
  }

  /// The padding around the cards, under the band.
  final cards = find.byWidgetPredicate((w) => w is Padding && w.padding == const EdgeInsets.fromLTRB(12, 12, 12, 32));

  testWidgets('en fin de page, la carte « Par canal » et sa marge restent au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await pumpLocalized(tester, BlocProvider<ProRevenueBloc>.value(value: bloc(), child: const ProRevenueView()), size: const Size(400, 800));
    await scrollToEnd(tester, const Key('revenue-page'));
    expectClearOfSystemBars(tester, find.byKey(const Key('revenue-channel-2')));
    expect(tester.getRect(cards).bottom, lessThanOrEqualTo(800 - 48));
  });

  testWidgets('barres : icônes blanches sur le bandeau vert, icônes sombres de l\'app dans la barre de navigation', (tester) async {
    setSystemBars(tester);
    await pumpLocalized(tester, BlocProvider<ProRevenueBloc>.value(value: bloc(), child: const ProRevenueView()), size: const Size(400, 800));
    SystemUiOverlayStyle? styleAt(Offset logical) =>
        tester.binding.renderViews.first.debugLayer!.find<SystemUiOverlayStyle>(logical * tester.view.devicePixelRatio);
    expect(styleAt(const Offset(200, 12))?.statusBarIconBrightness, Brightness.light);
    expect(styleAt(const Offset(200, 790))?.systemNavigationBarIconBrightness, Brightness.dark);
  });

  testWidgets('paysage : les cartes et le retour s\'écartent de l\'encoche et de la barre de navigation sur le côté', (tester) async {
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    await pumpLocalized(tester, BlocProvider<ProRevenueBloc>.value(value: bloc(), child: const ProRevenueView()), size: const Size(800, 400));
    expectClearOfSystemBars(tester, find.byKey(const Key('revenue-back')));
    await scrollToEnd(tester, const Key('revenue-page'));
    expectClearOfSystemBars(tester, find.byKey(const Key('revenue-channel-0')));
    final rect = tester.getRect(cards);
    expect(rect.left, greaterThanOrEqualTo(32));
    expect(rect.right, lessThanOrEqualTo(800 - 48));
  });

  testWidgets('À compléter : la note de fin de liste reste au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    final revenue = bloc();
    await pumpLocalized(tester, BlocProvider<ProRevenueBloc>.value(value: revenue, child: ProRevenueMissingPage(bloc: revenue)), size: const Size(400, 700));
    await scrollToEnd(tester, const Key('revenue-missing-list'));
    expectClearOfSystemBars(tester, find.text('Les réservations payées sur Plazo ne figurent jamais ici : leur prix est celui payé en ligne.'));
  });
}
