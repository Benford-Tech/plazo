import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/shared/tutorials/tutorial_catalog.dart';
import 'package:parking_app/src/shared/tutorials/tutorial_service.dart';
import 'package:parking_app/src/shared/tutorials/tutorial_spot.dart';
import 'package:parking_app/src/shared/tutorials/tutorials_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/pump_app.dart';

/// A page with the search tab's targets (no tab bar: its step is left out).
class _SearchLike extends StatelessWidget {
  const _SearchLike();

  @override
  Widget build(BuildContext context) => TutorialSpot(
    tutorial: Tutorials.search,
    child: Scaffold(
      body: ListView(
        children: const [
          SizedBox(key: Key('search-dates'), height: 60),
          SizedBox(height: 20),
          SizedBox(key: Key('search-submit'), height: 54),
          SizedBox(height: 20),
          SizedBox(key: Key('search-map'), height: 200),
        ],
      ),
    ),
  );
}

void main() {
  setUpAll(setUpLocalizedTests);
  final service = TutorialService.instance;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    service.resetForTest();
    TutorialService.enabled = true;
  });
  tearDown(() => TutorialService.enabled = false);

  test('chaque tutoriel a ses textes', () {
    final fr = jsonDecode(File('assets/l10n/fr-FR.json').readAsStringSync()) as Map<String, dynamic>;
    final t = fr['tutorials'] as Map<String, dynamic>;
    final all = {
      ...Tutorials.listFor(pro: false),
      for (final post in ['manager', 'agent', 'driver', 'valet']) ...Tutorials.listFor(pro: true, post: post),
    };
    for (final tutorial in all) {
      final texts = t[tutorial.slug] as Map<String, dynamic>?;
      expect(texts, isNotNull, reason: tutorial.id);
      for (var i = 0; i < tutorial.steps.length; i++) {
        expect(texts!['s${i + 1}_title'], isA<String>(), reason: '${tutorial.id} $i');
        expect(texts['s${i + 1}_body'], isA<String>(), reason: '${tutorial.id} $i');
      }
      expect((t['name'] as Map)[tutorial.slug], isA<String>(), reason: tutorial.id);
      if (tutorial.kind == TutorialKind.bubbles) {
        expect((t['where'] as Map)[tutorial.slug], isA<String>(), reason: tutorial.id);
        expect((t['later'] as Map)[tutorial.slug], isA<String>(), reason: tutorial.id);
      }
    }
  });

  test('chaque poste a son carrousel, puis les bulles de ses onglets', () {
    expect(Tutorials.listFor(pro: true, post: 'driver').map((t) => t.id), ['pro.welcome.driver', 'pro.shuttle']);
    expect(Tutorials.listFor(pro: true, post: 'manager').first.id, 'pro.welcome.manager');
    expect(Tutorials.welcomeFor('inconnu').id, 'pro.welcome.agent');
  });

  testWidgets('le carrousel de bienvenue se montre une fois, « Passer » le range', (tester) async {
    await pumpLocalized(
      tester,
      const TutorialSpot(
        tutorial: Tutorials.welcome,
        child: Scaffold(body: Text('Accueil')),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pumpAndSettle();
    expect(find.text('Votre parking près de l\'aéroport'), findsOneWidget);
    expect(find.text('1 SUR 4'), findsOneWidget);
    await tester.tap(find.byKey(const Key('tutorial-next')));
    await tester.pumpAndSettle();
    expect(find.text('Réservez et payez en ligne'), findsOneWidget);
    await tester.tap(find.byKey(const Key('tutorial-skip')));
    await tester.pumpAndSettle();
    expect(find.text('Accueil'), findsOneWidget);
    expect(service.isSeen('welcome'), isTrue);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getStringList('tutorials.seen'), ['welcome']);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('les bulles attendent le carrousel, puis montrent les cibles présentes', (tester) async {
    service.welcomeId = 'welcome';
    await pumpLocalized(tester, const _SearchLike());
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
    // The carousel was never seen: no bubble yet.
    expect(find.byKey(const Key('tutorial-bubble-search-0')), findsNothing);
    await service.markSeen('welcome');
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pumpAndSettle();
    // The tab bar is not there: three bubbles, not four.
    expect(find.byKey(const Key('tutorial-bubble-search-0')), findsOneWidget);
    expect(find.text('1 SUR 3'), findsOneWidget);
    expect(find.text('Vos dates d\'abord'), findsOneWidget);
    await tester.tap(find.byKey(const Key('tutorial-next')));
    await tester.pumpAndSettle();
    expect(find.text('Comparer les parkings'), findsOneWidget);
    await tester.tap(find.byKey(const Key('tutorial-next')));
    await tester.pumpAndSettle();
    expect(find.text('3 SUR 3'), findsOneWidget);
    await tester.tap(find.text('J\'ai compris'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('tutorial-bubble-search-2')), findsNothing);
    expect(service.isSeen('search'), isTrue);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('une page sans aucune cible ne montre rien et le tutoriel reste à voir', (tester) async {
    await pumpLocalized(
      tester,
      const TutorialSpot(
        tutorial: Tutorials.booking,
        child: Scaffold(body: Text('Chargement')),
      ),
    );
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('tutorial-next')), findsNothing);
    expect(service.isSeen('booking'), isFalse);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Plus › Tutoriels : revoir le carrousel, les bulles à la prochaine ouverture', (tester) async {
    await service.load();
    await service.markSeen('welcome');
    await pumpLocalized(tester, const TutorialsPage());
    await tester.pumpAndSettle();
    expect(find.text('Découvrir l\'application'), findsOneWidget);
    expect(find.text('Revoir'), findsOneWidget);
    expect(find.text('Voir'), findsNWidgets(2));
    await tester.tap(find.byKey(const Key('tutorial-row-welcome')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('tutorial-carousel-welcome')), findsOneWidget);
    await tester.tap(find.byKey(const Key('tutorial-skip')));
    await tester.pumpAndSettle();
    // Bubbles of a page that is not a tab: shown the next time it opens.
    await service.markSeen('booking');
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('tutorial-row-booking')));
    await tester.pumpAndSettle();
    expect(find.text('Les bulles s\'afficheront à la prochaine ouverture d\'une réservation.'), findsOneWidget);
    expect(service.isSeen('booking'), isFalse);
  });

  testWidgets('Plazo Pro : un choix de poste quand le rôle en couvre plusieurs', (tester) async {
    await pumpLocalized(tester, const TutorialsPage(activePost: 'driver', posts: ['manager', 'agent', 'driver', 'valet']));
    await tester.pumpAndSettle();
    // The test build is Plazo (traveller): the post choice is Plazo Pro's only.
    expect(find.byKey(const Key('tutorials-post')), findsNothing);
  });
}
