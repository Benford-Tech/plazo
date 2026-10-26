import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_start/data/getting_started_data_source.dart';
import 'package:parking_app/src/features/pro_start/presentation/pages/pro_getting_started_page.dart';
import 'package:parking_app/src/features/pro_start/presentation/widgets/getting_started_card.dart';
import 'package:parking_app/src/shared/tutorials/tutorial_catalog.dart';

import '../../helpers/pump_app.dart';

class FakeGettingStarted implements GettingStartedDataSource {
  FakeGettingStarted(this.model);
  GettingStartedModel model;
  int calls = 0;

  @override
  Future<GettingStartedModel> fetch() async {
    calls += 1;
    return model;
  }
}

const _manager = GettingStartedModel(
  post: 'manager',
  done: 2,
  total: 7,
  steps: [
    GettingStartedStep(key: 'parking', done: true, detail: '200 places déclarées'),
    GettingStartedStep(key: 'bookings', done: false, detail: 'Aucun mail de comparateur reçu pour l’instant'),
    GettingStartedStep(key: 'team', done: true, detail: '3 membres'),
    GettingStartedStep(key: 'shuttles', done: false, detail: 'Aucun véhicule de navette'),
    GettingStartedStep(key: 'listing', done: false, detail: 'Grille tarifaire vide'),
    GettingStartedStep(key: 'contract', done: false, detail: 'Le modèle Plazo pour l’instant'),
    GettingStartedStep(key: 'sms', done: false),
  ],
);

/// T-A + T-B (26/10/2026): « Bien démarrer » on the dashboard and its page, with the guided tour.
void main() {
  setUpAll(setUpLocalizedTests);
  late FakeGettingStarted source;
  setUp(() {
    source = FakeGettingStarted(_manager);
    locator.registerSingleton<GettingStartedDataSource>(source);
  });
  tearDown(() => locator.unregister<GettingStartedDataSource>());

  test('le modèle se lit depuis le JSON du serveur', () {
    final m = GettingStartedModel.fromJson({
      'post': 'driver',
      'done': 1,
      'total': 4,
      'steps': [
        {'key': 'post', 'done': true, 'detail': null},
        {'key': 'vehicle', 'done': false, 'detail': 'Prenez votre véhicule du jour'},
      ],
    });
    expect(m.post, 'driver');
    expect(m.steps.map((s) => s.key), ['post', 'vehicle']);
    expect(m.steps[1].detail, 'Prenez votre véhicule du jour');
    expect(m.complete, isFalse);
    expect(const GettingStartedModel(post: 'agent', steps: [], done: 4, total: 4).complete, isTrue);
  });

  testWidgets('la carte du tableau de bord montre l\'avancement et les deux prochaines étapes', (tester) async {
    await pumpLocalized(tester, const Scaffold(body: GettingStartedCard()));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('getting-started-card')), findsOneWidget);
    expect(find.text('2 / 7 étapes'), findsOneWidget);
    expect(find.text('Vos réservations'), findsOneWidget);
    expect(find.text('Vos navettes'), findsOneWidget);
    expect(find.text('Vos tarifs et votre fiche Plazo'), findsNothing);
  });

  testWidgets('la carte disparaît quand tout est en place', (tester) async {
    source.model = const GettingStartedModel(post: 'manager', steps: [GettingStartedStep(key: 'sms', done: true)], done: 1, total: 1);
    await pumpLocalized(tester, const Scaffold(body: GettingStartedCard()));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('getting-started-card')), findsNothing);
  });

  testWidgets('la page liste chaque étape, dit ce qui se règle sur le web, et ouvre la visite guidée', (tester) async {
    await pumpLocalized(tester, const ProGettingStartedPage(), size: const Size(400, 1400));
    await tester.pumpAndSettle();
    expect(find.text('3 membres'), findsOneWidget);
    expect(find.text('Le modèle Plazo pour l’instant'), findsOneWidget);
    expect(find.text("L'heure et le texte envoyés à vos clients avant leur dépôt."), findsOneWidget);
    // The comparators' mails, the listing, the contract and the SMS are set up on the web: a note instead of a chevron.
    expect(find.text("À régler sur l'espace pro web"), findsNWidgets(4));
    expect(Tutorials.proStart.steps, hasLength(6));
    await tester.tap(find.byKey(const Key('getting-started-tour')));
    await tester.pumpAndSettle();
    expect(find.text('Votre parking'), findsWidgets);
    expect(find.text('Passer'), findsOneWidget);
  });
}
