import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/highlights.dart';
import 'package:parking_app/src/features/search/domain/logic/shuttle_rail.dart';
import 'package:parking_app/src/features/search/presentation/widgets/shuttle_box.dart';
import 'package:parking_app/src/shared/widgets/live_dot.dart';

import '../../helpers/pump_app.dart';

/// The rail's width in a list card of a 360 dp phone: 360 − 2 × 16 (list) − 2 × 12 (card) − 2 × 12 (box) − 2 (border).
const _rail360 = 278.0;

void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    // The real fonts: whether a text fits on one line depends on them.
    await loadAppFonts();
  });

  Future<void> pumpIn(WidgetTester tester, Widget child, {double width = _rail360}) => pumpLocalized(
    tester,
    Scaffold(
      body: Align(
        alignment: Alignment.topLeft,
        child: SizedBox(width: width, child: child),
      ),
    ),
    size: const Size(360, 760),
  );

  /// The lines a text takes.
  int lines(WidgetTester tester, Finder text) {
    final p = tester.renderObject<RenderParagraph>(find.descendant(of: text, matching: find.byType(RichText)));
    final all = TextSelection(baseOffset: 0, extentOffset: p.text.toPlainText().length);
    return p.getBoxesForSelection(all).map((b) => b.top).toSet().length;
  }

  final title = find.text('NAVETTE EN DIRECT');
  final status = find.byKey(const Key('live-rail-status'));

  group('L3, en-tête du rail sur un téléphone de 360 dp', () {
    testWidgets('« Suivie en direct le jour J » : le titre et l’état chacun sur une ligne', (tester) async {
      await pumpIn(tester, const LiveShuttleRail(rail: RailState(), destination: 'Terminal 1 · 5 min'));
      expect(find.text('Suivie en direct le jour J'), findsOneWidget);
      expect(lines(tester, title), 1);
      expect(lines(tester, status), 1);
    });

    testWidgets('« il y a 8 s » : à droite du titre, sur la même ligne', (tester) async {
      await pumpIn(tester, LiveShuttleRail(rail: const RailState(running: 1, ageSeconds: 8), receivedAt: DateTime.now(), destination: 'Terminal 1'));
      expect(find.text('il y a 8 s'), findsOneWidget);
      expect(lines(tester, status), 1);
      expect((tester.getCenter(status).dy - tester.getCenter(title).dy).abs(), lessThan(3));
      expect(tester.getRect(status).right, closeTo(tester.getRect(find.byKey(const Key('live-rail'))).right, 0.5));
    });
  });

  testWidgets('l’âge ne tourne pas pendant qu’une page couvre le rail (TickerMode)', (tester) async {
    LiveDot.animationsEnabled = true;
    addTearDown(() => LiveDot.animationsEnabled = false);
    // The dot stays still (reduced motion); the age's ticker does not depend on it.
    tester.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
    final inView = ValueNotifier(false);
    addTearDown(inView.dispose);
    await pumpIn(
      tester,
      ValueListenableBuilder<bool>(
        valueListenable: inView,
        builder: (_, enabled, _) => TickerMode(
          enabled: enabled,
          child: LiveShuttleRail(rail: const RailState(running: 1, ageSeconds: 8), receivedAt: DateTime.now(), destination: 'Terminal 1'),
        ),
      ),
    );
    Widget shown() => tester.widget(status);
    var before = shown();
    await tester.pump(const Duration(seconds: 3));
    expect(identical(shown(), before), isTrue); // covered: no rebuild a second

    inView.value = true;
    await tester.pump();
    before = shown();
    await tester.pump(const Duration(milliseconds: 1100));
    expect(identical(shown(), before), isFalse); // in view: the age ticks again
  });

  testWidgets('le point cesse de respirer quand les animations sont réduites après coup', (tester) async {
    LiveDot.animationsEnabled = true;
    addTearDown(() => LiveDot.animationsEnabled = false);
    final animate = ValueNotifier(true);
    addTearDown(animate.dispose);
    await pumpIn(
      tester,
      ValueListenableBuilder<bool>(
        valueListenable: animate,
        builder: (_, on, _) => LiveDot(animate: on),
      ),
    );
    expect(tester.hasRunningAnimations, isTrue);
    animate.value = false;
    await tester.pump();
    expect(tester.hasRunningAnimations, isFalse);
    animate.value = true;
    await tester.pump();
    expect(tester.hasRunningAnimations, isTrue);
    animate.value = false;
    await tester.pump();
  });

  testWidgets('sur la carte des résultats : une ligne, « EN DIRECT », trajet et attente, pas de rail', (tester) async {
    await pumpIn(tester, const ShuttleBox(facts: ShuttleFacts(rideMinutes: 5, waitMinutes: 5, live: true), compact: true), width: 300);
    expect(find.text('Navette gratuite'), findsOneWidget);
    expect(find.text('EN DIRECT'), findsOneWidget);
    expect(find.text('5 min trajet · 5 min attente'), findsOneWidget);
    expect(find.byKey(const Key('live-rail')), findsNothing);
    // Without a declared wait, only the ride.
    await pumpIn(tester, const ShuttleBox(facts: ShuttleFacts(rideMinutes: 7), compact: true), width: 300);
    expect(find.text('7 min trajet'), findsOneWidget);
    expect(find.text('EN DIRECT'), findsNothing);
  });

  testWidgets('ce que lit le lecteur d’écran : les navettes en route, avec l’article', (tester) async {
    await pumpIn(tester, const SizedBox());
    const facts = ShuttleFacts(rideMinutes: 5, live: true);
    // Before the first live answer: nothing about the shuttles on the road.
    expect(shuttleBoxDescription(facts, destination: railDestinationInText('LYS')), 'Navette gratuite, trajet 5 min');
    // A running shuttle without a position still counts.
    expect(
      shuttleBoxDescription(facts, rail: const RailState(running: 1), destination: railDestinationInText('LYS')),
      'Navette gratuite, trajet 5 min, 1 navette en route entre le parking et le Terminal 1',
    );
    expect(
      shuttleBoxDescription(facts, rail: const RailState(running: 2), destination: railDestinationInText('NCE')),
      "Navette gratuite, trajet 5 min, 2 navettes en route entre le parking et l'aéroport",
    );
    expect(
      shuttleBoxDescription(facts, rail: const RailState()),
      'Navette gratuite, trajet 5 min, suivie en direct le jour J, aucune navette en route en ce moment',
    );
  });
}
