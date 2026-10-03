import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/error/exceptions.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/logic/filters.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/features/search/presentation/bloc/results/results_bloc.dart';
import 'package:parking_app/src/features/search/presentation/pages/results_page.dart';
import 'package:parking_app/src/features/search/presentation/widgets/filters_sheet.dart';
import 'package:parking_app/src/features/search/presentation/widgets/results_map.dart';
import 'package:parking_app/src/shared/widgets/segmented.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

final results = [
  result('cher', priceCents: 6000, shuttle: 5, km: 6, services: ['shuttle', 'valet'], policy: 'non_refundable', payment: 'unavailable'),
  result('moyen', priceCents: 4500, shuttle: 12, km: 2, services: ['shuttle', 'covered'], location: const LatLngModel(lat: 45.70, lng: 5.12)),
  result('complet', priceCents: 3000, available: false, shuttle: 3, km: 1, location: const LatLngModel(lat: 45.76, lng: 5.02)),
  result('pas-cher', priceCents: 3499, shuttle: null, km: 4, location: null),
];

ResultsBloc bloc(FakePublicDataSource api) =>
    ResultsBloc(SearchParkingsUseCase(PublicRepositoryImpl(api)), airport: 'lyon-saint-exupery', arrivalAt: '2026-10-03T08:00', returnAt: '2026-10-10T18:00');

FakePublicDataSource api() => FakePublicDataSource()..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: results);

void main() {
  setUpAll(setUpLocalizedTests);

  group('filtres et tris (ceux du site)', () {
    test('disponibles d’abord, puis par prix ; navette ; distance', () {
      List<String> order(Filters f) => applyFilters(results, f).map((r) => r.slug).toList();
      expect(order(const Filters()), ['pas-cher', 'moyen', 'cher', 'complet']);
      expect(order(const Filters(sort: SortKey.shuttle)), ['cher', 'moyen', 'pas-cher', 'complet']);
      expect(order(const Filters(sort: SortKey.distance)), ['moyen', 'pas-cher', 'cher', 'complet']);
      expect(order(const Filters(services: ['valet'])), ['cher']);
      expect(order(const Filters(freeCancellation: true)), ['pas-cher', 'moyen', 'complet']);
      expect(order(const Filters(maxShuttle: 10)), ['cher', 'complet']);
      expect(order(const Filters(maxPriceCents: 4500)), ['pas-cher', 'moyen', 'complet']);
      expect(priceCeilingCents(results), 6000);
      expect(serviceCounts(results)['shuttle'], 4);
    });

    test('le bloc : recherche par l’API, tri, filtres, prix maximal au plafond = sans limite', () async {
      final fake = api();
      final b = bloc(fake)..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.response != null);
      expect(fake.searches, ['lyon-saint-exupery 2026-10-03T08:00 2026-10-10T18:00']);
      expect(b.state.availableCount, 3);
      b.add(const ResultsSortChanged(SortKey.shuttle));
      await b.stream.first;
      expect(b.state.shown.first.slug, 'cher');
      b.add(const ResultsFiltersChanged(Filters(maxPriceCents: 6000, sort: SortKey.shuttle)));
      await b.stream.first;
      expect(b.state.shown, hasLength(4));
      b.add(const ResultsStayChanged(arrivalAt: '2026-10-04T08:00', returnAt: '2026-10-05T18:00'));
      await b.stream.firstWhere((s) => s.loadState.index == 2 && s.arrivalAt.startsWith('2026-10-04'));
      expect(fake.searches.last, 'lyon-saint-exupery 2026-10-04T08:00 2026-10-05T18:00');
      await b.close();
    });

    test('liste par défaut ; la carte sélectionne le premier parking ; une pastille choisit sa carte', () async {
      final b = bloc(api())..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.response != null);
      expect(b.state.view, ResultsView.list);
      b.add(const ResultsViewChanged(ResultsView.map));
      expect((await b.stream.first).selectedSlug, 'pas-cher');
      b.add(const ResultsSelected('moyen'));
      expect((await b.stream.first).selectedSlug, 'moyen');
      await b.close();
    });

    test('dates refusées par l’API : le code du champ', () async {
      final fake = api()..searchError = const ServerException(code: 'arrival_in_past');
      final b = bloc(fake)..add(const ResultsRequested());
      final s = await b.stream.firstWhere((s) => s.loadState.index == 3);
      expect(s.errorCode, 'arrival_in_past');
      await b.close();
    });
  });

  group('écran des résultats (A2)', () {
    Future<ResultsBloc> pump(WidgetTester tester, FakePublicDataSource fake) async {
      final b = bloc(fake)..add(const ResultsRequested());
      await pumpLocalized(tester, BlocProvider.value(value: b, child: const ResultsPage(airport: 'lyon-saint-exupery')));
      await tester.pumpAndSettle();
      addTearDown(b.close);
      return b;
    }

    testWidgets('en-tête, cartes, « Le moins cher », complet grisé ; bascule Liste / Carte', (tester) async {
      final b = await pump(tester, api());
      expect(find.text('Lyon St-Exupéry · 3 → 10 oct. · 8 j'), findsOneWidget);
      expect(find.text('3 parkings disponibles'), findsOneWidget);
      expect(find.text('Le moins cher'), findsOneWidget);
      expect(find.text('Navette la plus rapide'), findsOneWidget); // « cher », 5 min (« complet » is full)
      expect(find.textContaining('4,37'), findsOneWidget); // 34,99 € for 8 days
      expect(find.text('Clôturé'), findsNothing);
      expect(find.text('Non remboursable'), findsOneWidget);
      expect(find.text('Parking pas-cher'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('Complet'), 200, scrollable: find.byType(Scrollable).last);
      expect(find.text('Complet'), findsOneWidget);
      expect(find.byType(ResultsMap), findsNothing);

      await tester.tap(find.text('Carte'));
      await tester.pumpAndSettle();
      expect(find.byType(ResultsMap), findsOneWidget);
      expect(b.state.view, ResultsView.map);
      expect(find.byKey(const Key('selected-card')), findsOneWidget);
      // "pas-cher" has no position: not drawn, said on the map.
      expect(find.byKey(const Key('pill-pas-cher')), findsNothing);
      await tester.tap(find.byKey(const Key('pill-moyen')));
      await tester.pumpAndSettle();
      expect(b.state.selectedSlug, 'moyen');
      expect(find.descendant(of: find.byKey(const Key('selected-card')), matching: find.text('Parking moyen')), findsOneWidget);
    });

    testWidgets('un parking de démonstration porte une étiquette « DÉMO » discrète', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('demo').copyWith(isDemo: true), result('vrai')]);
      await pump(tester, fake);
      expect(find.text('DÉMO'), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp('Parking demo.*Parking fictif')), findsOneWidget);
    });

    testWidgets('tri par puce, et le panneau « Filtres » (compte en direct, effacer)', (tester) async {
      final b = await pump(tester, api());
      await tester.tapAt(tester.getTopLeft(find.byKey(const Key('sort-shuttle'))) + const Offset(20, 20));
      await tester.pumpAndSettle();
      expect(b.state.filters.sort, SortKey.shuttle);
      expect(tester.widget<PillChip>(find.byKey(const Key('sort-shuttle'))).selected, isTrue);

      await tester.tap(find.byKey(const Key('open-filters')));
      await tester.pumpAndSettle();
      expect(find.byType(FiltersSheet), findsOneWidget);
      expect(find.text('Voir 4 parkings'), findsOneWidget);
      await tester.tap(find.byKey(const Key('filter-valet')));
      await tester.pump();
      expect(find.text('Voir 1 parking'), findsOneWidget);
      await tester.tap(find.byKey(const Key('filter-shuttle-10')));
      await tester.pump();
      await tester.tap(find.byKey(const Key('filters-apply')));
      await tester.pumpAndSettle();
      expect(b.state.filters.services, ['valet']);
      expect(b.state.filters.maxShuttle, 10);
      expect(find.text('Filtres (2)'), findsOneWidget);
      expect(find.text('1 parking disponible'), findsOneWidget);
    });

    testWidgets('aucun résultat : message et « Changer de dates » ; aucun ne correspond : « Effacer les filtres »', (tester) async {
      final fake = FakePublicDataSource()..searchResponse = const SearchResponseModel(airport: lys);
      await pump(tester, fake);
      expect(find.text('Aucun parking pour ces dates'), findsOneWidget);
      expect(find.text('Changer de dates'), findsOneWidget);
    });

    testWidgets('filtres trop stricts : « Effacer les filtres » rend la liste', (tester) async {
      final b = await pump(tester, api());
      b.add(const ResultsFiltersChanged(Filters(services: ['ev_charging'])));
      await tester.pumpAndSettle();
      expect(find.text('Aucun parking ne correspond à vos filtres'), findsOneWidget);
      await tester.tap(find.text('Effacer les filtres'));
      await tester.pumpAndSettle();
      expect(find.text('3 parkings disponibles'), findsOneWidget);
    });
  });
}
