import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/highlights.dart';
import 'package:parking_app/src/core/helpers/money.dart';

import '../helpers/fakes.dart';
import '../helpers/pump_app.dart';

void main() {
  setUpAll(setUpLocalizedTests);

  group('prix par jour', () {
    testWidgets('total ÷ jours facturés, arrondi au centime', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(pricePerDayCents(4500, 8), 563);
      expect(pricePerDayCents(4500, 1), 4500);
      expect(pricePerDayCents(4500, 0), 4500);
      expect(perDayLabel(4500, 8), '${formatEuros(563)}/jour');
      expect(perDayLabel(11300, 8), '${formatEuros(1413)}/jour');
    });
  });

  group('étiquettes des résultats', () {
    final cheap = result('cheap', priceCents: 4500, shuttle: 8);
    final fast = result('fast', priceCents: 11300, shuttle: 4);
    final other = result('other', priceCents: 7500, shuttle: 5);

    test('le total le plus bas et la navette la plus courte', () {
      final badges = resultBadges([other, cheap, fast]);
      expect(badges['cheap'], [ResultBadge.cheapest]);
      expect(badges['fast'], [ResultBadge.fastestShuttle]);
      expect(badges.containsKey('other'), isFalse);
    });

    test('les deux sur une même carte, « Le moins cher » d’abord ; égalité → le premier affiché', () {
      final best = result('best', priceCents: 4000, shuttle: 3);
      expect(resultBadges([other, best])['best'], [ResultBadge.cheapest, ResultBadge.fastestShuttle]);
      final twin = result('twin', priceCents: 4500, shuttle: 8);
      final badges = resultBadges([twin, cheap]);
      expect(badges['twin'], [ResultBadge.cheapest, ResultBadge.fastestShuttle]);
      expect(badges.containsKey('cheap'), isFalse);
    });

    test('rien avec un seul résultat ; les complets et les navettes inconnues ne comptent pas', () {
      expect(resultBadges([cheap]), isEmpty);
      expect(resultBadges([cheap, result('full', available: false, priceCents: 1000, shuttle: 1)]), isEmpty);
      final noShuttle = result('ns', priceCents: 9000, shuttle: null);
      final badges = resultBadges([noShuttle, fast]);
      expect(badges['ns'], [ResultBadge.cheapest]);
      expect(badges['fast'], [ResultBadge.fastestShuttle]);
      expect(resultBadges([noShuttle, result('ns2', priceCents: 9500, shuttle: null)])['ns'], [ResultBadge.cheapest]);
    });
  });

  group('pastilles (direction C), encart navette et bande « L’essentiel »', () {
    testWidgets('extérieur ou couvert, clés, ouverture, puis clôturé, recharge et l’annulation ; plus de pastille navette', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      final chips = factChips(
        services: const ['shuttle', 'valet', 'covered', 'ev_charging', 'fenced', 'cctv', 'open_24h'],
        openingHours: null,
        cancellationPolicy: 'free_24h',
      );
      expect(chips.map((c) => c.toString()), [
        'ChipIcon.covered:Couvert',
        'ChipIcon.keys:Vous devez remettre vos clés|Clés à remettre',
        'ChipIcon.open24h:Ouvert 24h/24|24h/24',
        'ChipIcon.fenced:Clôturé',
        'ChipIcon.ev:Recharge',
        'ChipIcon.cancel:Gratuit 24 h',
      ]);
      expect(factChips(services: const ['shuttle'], openingHours: null, cancellationPolicy: 'non_refundable'), [
        const FactChip(ChipIcon.outdoor, 'Extérieur'),
        const FactChip(ChipIcon.keys, 'Vous gardez vos clés', short: 'Clés gardées'),
        const FactChip(ChipIcon.warning, 'Non remboursable', title: 'Non annulable'),
      ]);
      expect(factChips(services: const [], openingHours: null, cancellationPolicy: 'free_until_arrival').last.label, 'Gratuit jusqu\'à l\'arrivée');
    });

    testWidgets('l’ouverture : le service, des horaires qui disent 24h/24, sinon « Ouvert » et les horaires saisis', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      String? opening(String? hours, {List<String> services = const []}) =>
          factChips(services: services, openingHours: hours, cancellationPolicy: 'x').where((c) => c.icon == ChipIcon.open24h).firstOrNull?.label;
      expect(opening('5h–23h'), 'Ouvert 5h–23h');
      expect(opening('Ouvert de 5h à 23h'), 'Ouvert de 5h à 23h');
      expect(opening('24/7'), 'Ouvert 24h/24');
      expect(opening(' 24h / 24 '), 'Ouvert 24h/24');
      expect(opening('5h–23h', services: ['open_24h']), 'Ouvert 24h/24');
      expect(opening('  '), isNull);
      expect(opening(null), isNull);
    });

    test('l’encart navette : seulement avec le service, chiffre absent quand la donnée manque', () {
      expect(shuttleBox(services: const ['valet'], shuttleMinutes: 5, shuttleWaitMinutes: 5, liveShuttle: true), isNull);
      expect(
        shuttleBox(services: const ['shuttle'], shuttleMinutes: 5, shuttleWaitMinutes: 4, liveShuttle: true),
        const ShuttleFacts(rideMinutes: 5, waitMinutes: 4, live: true),
      );
      expect(shuttleBox(services: const ['shuttle'], shuttleMinutes: 0, shuttleWaitMinutes: null, liveShuttle: false), const ShuttleFacts());
      // An average wait of 0 min is declared, it shows.
      expect(shuttleBox(services: const ['shuttle'], shuttleMinutes: null, shuttleWaitMinutes: 0, liveShuttle: false)!.waitMinutes, 0);
    });

    testWidgets('cinq tuiles au plus : navette (en direct ou non), extérieur ou couvert, clés, ouverture, annulation', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(
        trustTiles(
          services: const ['shuttle', 'valet', 'open_24h'],
          shuttleMinutes: 5,
          shuttleWaitMinutes: 5,
          liveShuttle: true,
          openingHours: null,
          cancellationPolicy: 'free_24h',
        ),
        [
          const TrustTile(
            TileKind.shuttle,
            'Navette en direct',
            'Gratuite · trajet 5 min · attente moyenne 5 min · suivez-la sur la carte le jour J',
            live: true,
          ),
          const TrustTile(TileKind.outdoor, 'Extérieur', 'Parking à ciel ouvert'),
          const TrustTile(TileKind.keys, 'Vous devez remettre vos clés', 'Un voiturier gare votre voiture'),
          const TrustTile(TileKind.opening, 'Ouvert 24h/24', 'Dépôt et retour à toute heure'),
          const TrustTile(TileKind.cancellation, 'Annulation gratuite', 'jusqu\'à 24 h avant'),
        ],
      );
      expect(
        trustTiles(
          services: const ['shuttle', 'covered', 'fenced', 'cctv'],
          shuttleMinutes: 8,
          openingHours: '6h–23h',
          cancellationPolicy: 'non_refundable',
        ),
        [
          const TrustTile(TileKind.shuttle, 'Navette gratuite', 'Trajet 8 min'),
          const TrustTile(TileKind.covered, 'Couvert', 'clôturé, vidéosurveillance'),
          const TrustTile(TileKind.keys, 'Vous gardez vos clés', 'Vous vous garez vous-même'),
          const TrustTile(TileKind.opening, 'Ouvert 6h–23h', 'Dépôt et retour pendant ces horaires'),
          const TrustTile(TileKind.cancellation, 'Non remboursable', 'aucun remboursement en cas d\'annulation'),
        ],
      );
      // A shuttle without a ride time nor a wait: the tile says where it goes; without the service, no tile.
      List<TrustTile> tiles(List<String> services, int? minutes) =>
          trustTiles(services: services, shuttleMinutes: minutes, openingHours: null, cancellationPolicy: 'x');
      expect(tiles(const ['shuttle'], null).first, const TrustTile(TileKind.shuttle, 'Navette gratuite', 'Vers les terminaux'));
      expect(tiles(const ['covered'], 5).map((t) => t.kind), [TileKind.covered, TileKind.keys]);
      expect(tiles(const ['covered'], null).first.text, 'Parking couvert');
    });

    testWidgets('la ligne de faits (extérieur ou couvert est une tuile)', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(factsLine(services: const ['shuttle', 'covered', 'ev_charging'], distanceKm: 4.2), 'À 4,2 km des terminaux · Recharge électrique');
      expect(factsLine(services: const ['shuttle'], distanceKm: null), '');
    });
  });
}
