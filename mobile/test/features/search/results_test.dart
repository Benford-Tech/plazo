import 'dart:async';

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
import 'package:parking_app/src/shared/widgets/live_dot.dart';
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

    test('« Navette en direct » : les parkings qui montrent leurs navettes, compté comme un filtre', () {
      final withLive = [results[0].copyWith(liveShuttle: true), ...results.skip(1), results[2].copyWith(slug: 'complet-direct', liveShuttle: true)];
      const f = Filters(live: true);
      expect(applyFilters(withLive, f).map((r) => r.slug), ['cher', 'complet-direct']);
      expect(liveCount(withLive), 2);
      expect(f.active, isTrue);
      expect(f.activeCount, 1);
      expect(const Filters().copyWith(live: true), f);
      expect(f.cleared().live, isFalse);
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
    Future<ResultsBloc> pump(WidgetTester tester, FakePublicDataSource fake, {Size size = const Size(400, 900)}) async {
      final b = bloc(fake)..add(const ResultsRequested());
      await pumpLocalized(tester, BlocProvider.value(value: b, child: const ResultsPage(airport: 'lyon-saint-exupery')), size: size);
      await tester.pumpAndSettle();
      addTearDown(b.close);
      return b;
    }

    testWidgets('en-tête, cartes, « Le moins cher », complet grisé ; bascule Liste / Carte', (tester) async {
      final b = await pump(tester, api());
      expect(find.text('Lyon St-Exupéry · 3 → 10 oct. · 8 j'), findsOneWidget);
      expect(find.text('3 parkings disponibles'), findsOneWidget);
      expect(find.text('Le moins cher'), findsOneWidget);
      expect(find.textContaining('4,37'), findsOneWidget); // 34,99 € for 8 days
      expect(find.text('Clôturé'), findsNothing);
      expect(find.text('Parking pas-cher'), findsOneWidget);
      // The third card (taller since the shuttle box, 14/10/2026) is further down.
      await tester.scrollUntilVisible(find.text('Navette la plus rapide'), 200, scrollable: find.byType(Scrollable).last);
      expect(find.text('Navette la plus rapide'), findsOneWidget); // « cher », 5 min (« complet » is full)
      expect(find.text('Non remboursable'), findsOneWidget);
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

    testWidgets('frais de nuit (direction B) : total seul sur les cartes, une ligne sous le titre', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result('nuit', priceCents: 5160, basePriceCents: 3660, nightFee: dropOffNightFee),
            result('jour', priceCents: 4650),
          ],
        );
      await pump(tester, fake);
      expect(find.byKey(const Key('results-night-fees')), findsOneWidget);
      expect(find.text('Prix totaux pour vos dates, frais de nuit compris.'), findsOneWidget);
      // The card prints the total « tout compris », with no chip nor detail.
      expect(find.textContaining('51,60 €'), findsOneWidget);
      expect(find.textContaining('36,60 €'), findsNothing);
      expect(find.textContaining('Frais de nuit'), findsNothing);
    });

    testWidgets('sans frais de nuit parmi les résultats affichés (un complet n’en compte pas) : pas de ligne', (tester) async {
      await pump(tester, api());
      expect(find.byKey(const Key('results-night-fees')), findsNothing);
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('complet', available: false, priceCents: 5160, nightFee: dropOffNightFee), result('jour', priceCents: 4650)],
        );
      await pump(tester, fake);
      expect(find.byKey(const Key('results-night-fees')), findsNothing);
    });

    testWidgets('un parking de démonstration porte une étiquette « DÉMO » discrète', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('demo').copyWith(isDemo: true), result('vrai')]);
      await pump(tester, fake);
      expect(find.text('DÉMO'), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp('Parking demo.*Parking fictif')), findsOneWidget);
    });

    testWidgets('I-C : « EN DIRECT » sur la photo et minibus sur la pastille des parkings qui suivent leurs navettes', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('suivi', location: const LatLngModel(lat: 45.70, lng: 5.12)).copyWith(liveShuttle: true), result('discret')],
        );
      final b = await pump(tester, fake);
      expect(find.byKey(const Key('live-shuttle')), findsOneWidget);
      expect(find.text('EN DIRECT'), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp('Parking suivi.*Navette suivie en direct')), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp('Parking discret.*Navette suivie')), findsNothing);

      b.add(const ResultsViewChanged(ResultsView.map));
      await tester.pumpAndSettle();
      expect(find.descendant(of: find.byKey(const Key('pill-suivi')), matching: find.byIcon(Icons.airport_shuttle_rounded)), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('pill-discret')), matching: find.byIcon(Icons.airport_shuttle_rounded)), findsNothing);
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
  group('direction C : encart navette, pastilles et rail en direct (L3)', () {
    const parking = LatLngModel(lat: 45.7375, lng: 5.0745);
    const midway = LatLngModel(lat: (45.7375 + 45.7256) / 2, lng: (5.0745 + 5.0811) / 2);

    LiveShuttleModel running(String id, String parking, {LatLngModel? position, int? age}) =>
        LiveShuttleModel(id: id, parking: parking, position: position, positionAgeSeconds: age, startedAt: '2026-10-14T09:00:00Z');

    ResultsBloc liveBloc(FakePublicDataSource fake, {bool autoPoll = false, Duration poll = const Duration(seconds: 12)}) => ResultsBloc(
      SearchParkingsUseCase(PublicRepositoryImpl(fake)),
      airport: 'lyon-saint-exupery',
      arrivalAt: '2026-10-03T08:00',
      returnAt: '2026-10-10T18:00',
      live: GetAirportLiveUseCase(PublicRepositoryImpl(fake)),
      autoPoll: autoPoll,
      pollInterval: poll,
    );

    Future<ResultsBloc> pumpWith(WidgetTester tester, FakePublicDataSource fake, {ResultsBloc? bloc, Size size = const Size(400, 2600)}) async {
      final b = (bloc ?? liveBloc(fake))..add(const ResultsRequested());
      await pumpLocalized(tester, BlocProvider.value(value: b, child: const ResultsPage(airport: 'lyon-saint-exupery')), size: size);
      await tester.pumpAndSettle();
      addTearDown(b.close);
      return b;
    }

    Finder inCard(String slug, Finder matching) => find.descendant(of: find.byKey(Key('result-$slug')), matching: matching);

    testWidgets('« Navette gratuite », trajet et attente déclarée, puis les pastilles courtes ; ni « 8 min » ni encart sans navette', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result('moulin', shuttle: 5, services: ['shuttle', 'valet', 'open_24h']).copyWith(shuttleWaitMinutes: 5),
            result('sans-attente', priceCents: 5000, shuttle: 7),
            result('sans-navette', priceCents: 5500, services: ['covered', 'fenced'], shuttle: 3),
          ],
        );
      await pumpWith(tester, fake, bloc: bloc(fake));
      expect(inCard('moulin', find.byKey(const Key('shuttle-box'))), findsOneWidget);
      expect(inCard('moulin', find.text('Navette gratuite')), findsOneWidget);
      expect(inCard('moulin', find.text('5 min')), findsNWidgets(2));
      expect(inCard('moulin', find.text('TRAJET')), findsOneWidget);
      expect(inCard('moulin', find.text('ATTENTE')), findsOneWidget); // narrow card: « ATTENTE », not « ATTENTE MOY. »
      for (final chip in ['Extérieur', 'Clés à remettre', '24h/24', 'Gratuit 24 h']) {
        expect(inCard('moulin', find.text(chip)), findsOneWidget, reason: chip);
      }
      expect(inCard('moulin', find.byKey(const Key('live-rail'))), findsNothing); // not shown live
      // The long wording stays for assistive technology.
      expect(
        find.bySemanticsLabel(RegExp('Parking moulin.*Navette gratuite, trajet 5 min, attente moyenne 5 min.*Vous devez remettre vos clés')),
        findsOneWidget,
      );

      // No declared wait: the figure is left out.
      expect(inCard('sans-attente', find.byKey(const Key('shuttle-ride'))), findsOneWidget);
      expect(inCard('sans-attente', find.byKey(const Key('shuttle-wait'))), findsNothing);
      expect(inCard('sans-attente', find.text('Clés gardées')), findsOneWidget);
      expect(find.text('8 min'), findsNothing); // the former shuttle chip

      // No shuttle service: no box, whatever its minutes.
      expect(inCard('sans-navette', find.byKey(const Key('shuttle-box'))), findsNothing);
      expect(inCard('sans-navette', find.text('Couvert')), findsOneWidget);
      expect(inCard('sans-navette', find.text('Clôturé')), findsOneWidget);
    });

    testWidgets('carte large : « ATTENTE MOY. » et les libellés longs', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('moulin', shuttle: 5, services: ['shuttle', 'valet', 'open_24h']).copyWith(shuttleWaitMinutes: 5)],
        );
      await pumpWith(tester, fake, bloc: bloc(fake), size: const Size(800, 1200));
      expect(find.text('ATTENTE MOY.'), findsOneWidget);
      expect(find.text('Vous devez remettre vos clés'), findsOneWidget);
      expect(find.text('Ouvert 24h/24'), findsOneWidget);
    });

    testWidgets('L3 : un seul appel pour la liste ; minibus à sa vraie place, « il y a 8 s », « Terminal 1 · 5 min » ; rail vide « le jour J »', (
      tester,
    ) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result('moulin', shuttle: 5, location: parking).copyWith(liveShuttle: true),
            result('calme', priceCents: 5000, shuttle: null, location: parking).copyWith(liveShuttle: true),
            result('discret', priceCents: 5500),
          ],
        )
        ..liveResponse = AirportLiveModel(
          serverTime: '2026-10-14T09:10:00Z',
          airport: lys,
          parkings: const [LiveParkingModel(slug: 'moulin', title: 'Parking moulin', location: parking)],
          shuttles: [running('t1', 'moulin', position: midway, age: 8), running('t2', 'moulin')],
        );
      await pumpWith(tester, fake);
      expect(fake.lives, 1); // one request for every card

      expect(inCard('moulin', find.byKey(const Key('live-rail'))), findsOneWidget);
      expect(inCard('moulin', find.text('NAVETTE EN DIRECT')), findsOneWidget);
      expect(inCard('moulin', find.text('il y a 8 s')), findsOneWidget);
      expect(inCard('moulin', find.text('Parking')), findsOneWidget);
      expect(inCard('moulin', find.text('Terminal 1 · 5 min')), findsOneWidget);
      // The shuttle without a position has no minibus; the other one is halfway between the P and the plane.
      final marker = inCard('moulin', find.byKey(const Key('rail-shuttle')));
      expect(marker, findsOneWidget);
      final p = tester.getCenter(inCard('moulin', find.text('P'))).dx;
      final plane = tester.getCenter(inCard('moulin', find.byIcon(Icons.flight_rounded))).dx;
      expect((tester.getCenter(marker).dx - p) / (plane - p), closeTo(0.5, 0.03));
      // Read out: the shuttles on the road, the one without a position included.
      expect(find.bySemanticsLabel(RegExp('Parking moulin.*2 navettes en route entre le parking et le Terminal 1')), findsOneWidget);
      expect(find.bySemanticsLabel(RegExp('Parking calme.*aucune navette en route en ce moment')), findsOneWidget);

      // A live parking with no shuttle on the road: the rail, no minibus, « Suivie en direct le jour J ».
      expect(inCard('calme', find.byKey(const Key('live-rail'))), findsOneWidget);
      expect(inCard('calme', find.byKey(const Key('rail-shuttle'))), findsNothing);
      expect(inCard('calme', find.text('Suivie en direct le jour J')), findsOneWidget);
      expect(inCard('calme', find.text('Terminal 1')), findsOneWidget); // no ride time
      // A parking that does not show its shuttles: the box without the rail.
      expect(inCard('discret', find.byKey(const Key('shuttle-box'))), findsOneWidget);
      expect(inCard('discret', find.byKey(const Key('live-rail'))), findsNothing);
    });

    testWidgets('L3 : avant la première réponse, le rail sans minibus ni état ; le lecteur d’écran dit le trajet seul', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('moulin', shuttle: 5, location: parking).copyWith(liveShuttle: true)],
        );
      // No live use case: no answer ever comes.
      await pumpWith(tester, fake, bloc: bloc(fake));
      expect(inCard('moulin', find.byKey(const Key('live-rail'))), findsOneWidget);
      expect(inCard('moulin', find.byKey(const Key('rail-shuttle'))), findsNothing);
      expect(tester.widget<Text>(inCard('moulin', find.byKey(const Key('live-rail-status')))).data!.trim(), isEmpty);
      expect(find.text('Suivie en direct le jour J'), findsNothing);
      expect(find.bySemanticsLabel(RegExp(r'Parking moulin.*Navette gratuite, trajet 5 min\. Trajet du parking au Terminal 1\.')), findsOneWidget);
    });

    testWidgets('L3 : les minibus glissent d’une réponse à l’autre, et sautent quand les animations sont réduites', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('moulin', location: parking).copyWith(liveShuttle: true)],
        )
        ..liveResponse = AirportLiveModel(
          serverTime: '2026-10-14T09:10:00Z',
          airport: lys,
          shuttles: [running('t1', 'moulin', position: midway, age: 2)],
        );
      Duration slide() =>
          tester.widget<AnimatedPositioned>(find.ancestor(of: find.byKey(const Key('rail-shuttle')), matching: find.byType(AnimatedPositioned))).duration;
      await pumpWith(tester, fake);
      expect(slide(), const Duration(milliseconds: 1200));

      tester.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(disableAnimations: true);
      addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
      await tester.pumpAndSettle();
      expect(slide(), Duration.zero);
    });

    testWidgets('« Navette en direct » dans le panneau des filtres, avec son compte', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [result('suivi').copyWith(liveShuttle: true), result('discret', priceCents: 5000), result('autre', priceCents: 5200)],
        );
      final b = await pumpWith(tester, fake, bloc: bloc(fake));
      await tester.tap(find.byKey(const Key('open-filters')));
      await tester.pumpAndSettle();
      expect(find.text('Navette en direct'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('filter-live')), matching: find.text('1')), findsOneWidget);
      // « ● Navette en direct »: the dot before the words, breathing.
      final dot = find.byKey(const Key('filter-live-dot'));
      expect(tester.getRect(dot).right, lessThanOrEqualTo(tester.getRect(find.text('Navette en direct')).left));
      expect((tester.getCenter(dot).dy - tester.getCenter(find.text('Navette en direct')).dy).abs(), lessThan(2));
      expect(tester.widget<LiveDot>(dot).animate, isTrue);
      await tester.tap(find.byKey(const Key('filter-live')));
      await tester.pump();
      expect(find.text('Voir 1 parking'), findsOneWidget);
      await tester.tap(find.byKey(const Key('filters-apply')));
      await tester.pumpAndSettle();
      expect(b.state.filters.live, isTrue);
      expect(find.text('Filtres (1)'), findsOneWidget);
      expect(b.state.shown.map((r) => r.slug), ['suivi']);

      // With reduced motion the dot stays still.
      tester.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(disableAnimations: true);
      addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
      await tester.tap(find.byKey(const Key('open-filters')));
      await tester.pumpAndSettle();
      expect(tester.widget<LiveDot>(find.byKey(const Key('filter-live-dot'))).animate, isFalse);
      Navigator.of(tester.element(find.byKey(const Key('filter-live')))).pop();
      await tester.pumpAndSettle();
      tester.platformDispatcher.clearAccessibilityFeaturesTestValue();

      // No live parking among the results: no such filter.
      final quiet = FakePublicDataSource();
      await pumpWith(tester, quiet, bloc: bloc(quiet));
      await tester.tap(find.byKey(const Key('open-filters')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('filter-live')), findsNothing);
    });

    testWidgets('le relevé s’arrête quand une page couvre les résultats et reprend au retour', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('suivi').copyWith(liveShuttle: true)]);
      final b = await pumpWith(tester, fake);
      expect(fake.lives, 1);
      unawaited(Navigator.of(tester.element(find.byType(ResultsPage))).push(MaterialPageRoute<void>(builder: (_) => const Scaffold())));
      await tester.pumpAndSettle();
      b.add(const ResultsLivePolled());
      await tester.pumpAndSettle();
      expect(fake.lives, 1); // hidden: no request
      Navigator.of(tester.element(find.byType(Scaffold).last)).pop();
      await tester.pumpAndSettle();
      expect(fake.lives, 2); // back in view: asked at once
    });

    testWidgets('sur la carte : encart sur une ligne, sans rail ; les pastilles cadrées au-dessus de la carte du parking', (tester) async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result(
              'moulin',
              priceCents: 3000,
              shuttle: 5,
              location: parking,
              services: ['shuttle', 'valet', 'open_24h'],
            ).copyWith(liveShuttle: true, shuttleWaitMinutes: 5),
            result('sud', priceCents: 4500, shuttle: 12, location: const LatLngModel(lat: 45.70, lng: 5.12)),
            result('ouest', priceCents: 5000, location: const LatLngModel(lat: 45.76, lng: 5.02)),
          ],
        )
        ..liveResponse = AirportLiveModel(
          serverTime: '2026-10-14T09:10:00Z',
          airport: lys,
          parkings: const [LiveParkingModel(slug: 'moulin', title: 'Parking moulin', location: parking)],
          shuttles: [running('t1', 'moulin', position: midway, age: 8)],
        );
      final b = await pumpWith(tester, fake, size: const Size(390, 844));
      b.add(const ResultsViewChanged(ResultsView.map));
      await tester.pumpAndSettle();
      final card = find.byKey(const Key('selected-card'));
      expect(find.descendant(of: card, matching: find.text('Parking moulin')), findsOneWidget);
      expect(find.descendant(of: card, matching: find.byKey(const Key('shuttle-box'))), findsOneWidget);
      expect(find.descendant(of: card, matching: find.byKey(const Key('shuttle-live'))), findsOneWidget);
      expect(find.descendant(of: card, matching: find.byKey(const Key('live-rail'))), findsNothing);
      expect(find.descendant(of: card, matching: find.text('5 min trajet · 5 min attente')), findsOneWidget);
      final top = tester.getRect(card).top;
      for (final slug in ['moulin', 'sud', 'ouest']) {
        expect(tester.getRect(find.byKey(Key('pill-$slug'))).bottom, lessThan(top), reason: slug);
      }
    });

    test('le bloc : un seul relevé à la fois (une réponse lente n’écrase pas une plus récente)', () async {
      final fake = _SlowLive()
        ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('a').copyWith(liveShuttle: true)]);
      final b = liveBloc(fake)..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.response != null);
      await pumpEventQueue();
      expect(fake.lives, 1);
      b
        ..add(const ResultsLivePolled())
        ..add(const ResultsShownChanged(false))
        ..add(const ResultsShownChanged(true));
      await pumpEventQueue();
      expect(fake.lives, 1); // the tick and the return in view wait for the poll on its way
      fake.gates.single.complete();
      await b.stream.firstWhere((s) => s.live != null);
      b.add(const ResultsLivePolled());
      await pumpEventQueue();
      expect(fake.lives, 2);
      fake.gates.last.complete();
      await b.close();
    });

    test('le bloc : pas de relevé sur la carte ni quand les filtres cachent tous les parkings en direct ; au retour d’un rail, tout de suite', () async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result('suivi').copyWith(liveShuttle: true),
            result('couvert', priceCents: 5000, services: ['shuttle', 'covered']),
          ],
        );
      final b = liveBloc(fake)..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.live != null);
      expect(fake.lives, 1);

      // The map: its one-line card has no rail, a tick asks nothing.
      b
        ..add(const ResultsViewChanged(ResultsView.map))
        ..add(const ResultsLivePolled());
      await pumpEventQueue();
      expect(fake.lives, 1);
      // Back to the list: the rails' positions are stale, asked at once.
      b.add(const ResultsViewChanged(ResultsView.list));
      await pumpEventQueue();
      expect(fake.lives, 2);

      // A filter that hides the only live parking: no rail left, no request.
      b
        ..add(const ResultsFiltersChanged(Filters(services: ['covered'])))
        ..add(const ResultsLivePolled());
      await pumpEventQueue();
      expect(b.state.shown.map((r) => r.slug), ['couvert']);
      expect(fake.lives, 2);
      // The filter cleared: the rail is back, asked at once; a filter that keeps it asks nothing more.
      b.add(const ResultsFiltersChanged(Filters()));
      await pumpEventQueue();
      expect(fake.lives, 3);
      b.add(const ResultsFiltersChanged(Filters(live: true)));
      await pumpEventQueue();
      expect(fake.lives, 3);
      await b.close();
    });

    test('le bloc : la minuterie s’arrête sur la carte et derrière les filtres, reprend avec la liste', () async {
      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(
          payments: 'online',
          airport: lys,
          results: [
            result('suivi').copyWith(liveShuttle: true),
            result('couvert', priceCents: 5000, services: ['shuttle', 'covered']),
          ],
        );
      final b = liveBloc(fake, autoPoll: true, poll: const Duration(milliseconds: 20))..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.live != null);
      Future<void> expectStill() async {
        await Future<void>.delayed(const Duration(milliseconds: 30));
        final paused = fake.lives;
        await Future<void>.delayed(const Duration(milliseconds: 120));
        expect(fake.lives, paused);
      }

      b.add(const ResultsViewChanged(ResultsView.map));
      await expectStill();
      final before = fake.lives;
      b.add(const ResultsViewChanged(ResultsView.list));
      await Future<void>.delayed(const Duration(milliseconds: 90));
      expect(fake.lives, greaterThanOrEqualTo(before + 2)); // at once, then every 20 ms

      b.add(const ResultsFiltersChanged(Filters(services: ['covered'])));
      await expectStill();
      await b.close();
    });

    test('le bloc : rien sans parking en direct ; toutes les 12 s (ici 20 ms) tant que l’écran est montré', () async {
      final quiet = FakePublicDataSource();
      final q = liveBloc(quiet, autoPoll: true, poll: const Duration(milliseconds: 20))..add(const ResultsRequested());
      await q.stream.firstWhere((s) => s.response != null);
      await Future<void>.delayed(const Duration(milliseconds: 80));
      expect(quiet.lives, 0);
      await q.close();

      final fake = FakePublicDataSource()
        ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('a').copyWith(liveShuttle: true), result('b')]);
      final b = liveBloc(fake, autoPoll: true, poll: const Duration(milliseconds: 20))..add(const ResultsRequested());
      await b.stream.firstWhere((s) => s.live != null);
      await Future<void>.delayed(const Duration(milliseconds: 150));
      expect(fake.lives, greaterThanOrEqualTo(3));
      b.add(const ResultsShownChanged(false));
      await Future<void>.delayed(const Duration(milliseconds: 30));
      final paused = fake.lives;
      await Future<void>.delayed(const Duration(milliseconds: 120));
      expect(fake.lives, paused);
      b.add(const ResultsShownChanged(true));
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(fake.lives, greaterThan(paused));
      await b.close();
    });
  });
}

/// The airport's live answer only comes when the test lets it.
class _SlowLive extends FakePublicDataSource {
  final gates = <Completer<void>>[];

  @override
  Future<AirportLiveModel> live(String slug) async {
    final gate = Completer<void>();
    gates.add(gate);
    final answer = super.live(slug);
    await gate.future;
    return answer;
  }
}
