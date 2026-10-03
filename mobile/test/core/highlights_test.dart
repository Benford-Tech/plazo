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

  group('pastilles et bande de confiance', () {
    testWidgets('navette, sécurité, confort, clés, puis l’annulation', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      final chips = factChips(
        services: const ['shuttle', 'valet', 'covered', 'ev_charging', 'fenced', 'cctv', 'open_24h'],
        shuttleMinutes: 8,
        cancellationPolicy: 'free_24h',
      );
      expect(chips.map((c) => c.toString()), [
        'ChipIcon.shuttle:8 min',
        'ChipIcon.fenced:Clôturé',
        'ChipIcon.covered:Couvert',
        'ChipIcon.ev:Recharge',
        'ChipIcon.valet:Voiturier',
        'ChipIcon.cancel:Gratuit 24 h',
      ]);
      expect(factChips(services: const ['shuttle'], shuttleMinutes: null, cancellationPolicy: 'non_refundable'), [
        const FactChip(ChipIcon.warning, 'Non remboursable', title: 'Non annulable'),
      ]);
      expect(factChips(services: const [], shuttleMinutes: null, cancellationPolicy: 'free_until_arrival').single.label, 'Gratuit jusqu\'à l\'arrivée');
    });

    testWidgets('quatre tuiles construites depuis la fiche ; sans donnée, pas de tuile', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(trustTiles(services: const ['shuttle', 'fenced', 'cctv', 'open_24h'], shuttleMinutes: 8, openingHours: '24h/24', cancellationPolicy: 'free_24h'), [
        const TrustTile(TileKind.shuttle, 'Navette 8 min', 'gratuite, 24h/24'),
        const TrustTile(TileKind.security, 'Sécurisé', 'clôturé, vidéosurveillance'),
        const TrustTile(TileKind.cancellation, 'Annulation gratuite', 'jusqu\'à 24 h avant'),
        const TrustTile(TileKind.keys, 'Vous vous garez', 'vous gardez vos clés'),
      ]);
      final tiles = trustTiles(services: const ['valet'], shuttleMinutes: null, openingHours: null, cancellationPolicy: 'non_refundable');
      expect(tiles, [
        const TrustTile(TileKind.cancellation, 'Non remboursable', 'aucun remboursement en cas d\'annulation'),
        const TrustTile(TileKind.keys, 'Voiturier', 'vous laissez les clés à l\'accueil'),
      ]);
      expect(trustTiles(services: const ['shuttle', 'open_24h'], shuttleMinutes: 5, openingHours: null, cancellationPolicy: 'free_48h').first.text, 'gratuite, 24h/24');
      expect(trustTiles(services: const ['shuttle'], shuttleMinutes: 5, openingHours: null, cancellationPolicy: 'free_48h').first.text, 'gratuite vers les terminaux');
    });

    testWidgets('la ligne de faits', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(factsLine(services: const ['shuttle', 'covered', 'ev_charging'], distanceKm: 4.2), 'À 4,2 km des terminaux · Couvert · Recharge électrique');
      expect(factsLine(services: const ['shuttle'], distanceKm: null), 'Extérieur');
    });
  });
}
