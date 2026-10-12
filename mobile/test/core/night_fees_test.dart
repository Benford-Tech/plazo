import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/night_fees.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';

import '../helpers/fakes.dart';
import '../helpers/pump_app.dart';

/// Night fees (12/10/2026, direction B « Dans le détail du prix seulement »): the app reads the API's fees and rule, and
/// only builds the texts of the price detail (same as the site's lib/night-fees.ts).
void main() {
  setUpAll(setUpLocalizedTests);

  group('ligne « Frais de nuit »', () {
    testWidgets('dépôt, retour, ou les deux, avec les heures réservées', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      const arrival = '2026-10-13T23:30', ret = '2026-10-20T05:30';
      expect(nightFeeLabel(dropOffNightFee, arrivalAt: arrival, returnAt: ret), 'Frais de nuit · dépôt à 23:30');
      expect(
        nightFeeLabel(const NightFeeModel(arrivalCents: 0, returnCents: 1000, totalCents: 1000), arrivalAt: arrival, returnAt: ret),
        'Frais de nuit · retour à 05:30',
      );
      expect(
        nightFeeLabel(const NightFeeModel(arrivalCents: 1500, returnCents: 1000, totalCents: 2500), arrivalAt: '2026-10-13T22:30', returnAt: ret),
        'Frais de nuit · dépôt à 22:30 et retour à 05:30',
      );
      // Inconsistent ends but a total: the label alone.
      expect(nightFeeLabel(const NightFeeModel(totalCents: 500), arrivalAt: arrival, returnAt: ret), 'Frais de nuit');
    });

    testWidgets('rien sans frais (absents, nuls ou API plus ancienne)', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(nightFeeLabel(null, arrivalAt: '2026-10-13T23:30', returnAt: '2026-10-20T18:00'), isNull);
      expect(nightFeeLabel(const NightFeeModel(), arrivalAt: '2026-10-13T23:30', returnAt: '2026-10-20T18:00'), isNull);
      expect(chargedNightFee(const NightFeeModel()), isNull);
      expect(chargedNightFee(dropOffNightFee), dropOffNightFee);
    });

    testWidgets('« Forfait 8 jours » et « dont 15,00 € de frais de nuit »', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(packageLabel(8), 'Forfait 8 jours');
      expect(packageLabel(1), 'Forfait 1 jour');
      expect(nightFeePaidPart(dropOffNightFee), 'dont 15,00 € de frais de nuit');
      expect(nightFeePaidPart(null), isNull);
      expect(nightFeePaidPart(const NightFeeModel()), isNull);
    });
  });

  group('règle du parking', () {
    testWidgets('un montant pour les deux, deux montants, un seul côté ; euros courts', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(nightRuleSentence(nightRule22to6), 'Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et 06:00.');
      expect(
        nightRuleSentence(const NightRuleModel(start: '22:00', end: '06:00', arrivalFeeCents: 1500, returnFeeCents: 1000)),
        'Ce parking ajoute 15 € pour un dépôt et 10 € pour un retour entre 22:00 et 06:00.',
      );
      expect(
        nightRuleSentence(const NightRuleModel(start: '22:00', end: '06:00', arrivalFeeCents: 1500)),
        'Ce parking ajoute 15 € pour un dépôt entre 22:00 et 06:00.',
      );
      expect(
        nightRuleSentence(const NightRuleModel(start: '23:00', end: '05:00', returnFeeCents: 1250)),
        'Ce parking ajoute 12,50 € pour un retour entre 23:00 et 05:00.',
      );
    });

    testWidgets('rien quand le parking ne demande rien', (tester) async {
      await pumpLocalized(tester, const SizedBox());
      expect(nightRuleSentence(null), isNull);
      expect(nightRuleSentence(const NightRuleModel(start: '22:00', end: '06:00')), isNull);
      expect(nightRuleSentence(const NightRuleModel(start: '22:00', end: '06:00', arrivalFeeCents: 0, returnFeeCents: 0)), isNull);
    });
  });

  group('prix', () {
    test('la part de la grille : celle de l’API, sinon le total moins les frais', () {
      expect(basePriceOf(priceCents: 5160, basePriceCents: 3660, nightFee: dropOffNightFee), 3660);
      expect(basePriceOf(priceCents: 5160, nightFee: dropOffNightFee), 3660);
      expect(basePriceOf(priceCents: 4500), 4500);
      expect(basePriceOf(priceCents: null, nightFee: dropOffNightFee), isNull);
    });

    test('« frais de nuit compris » : seulement un résultat réservable dont le total les comprend', () {
      expect(hasNightFee(result('nuit', priceCents: 6000, nightFee: dropOffNightFee)), isTrue);
      expect(hasNightFee(result('jour')), isFalse);
      expect(hasNightFee(result('complet', available: false, nightFee: dropOffNightFee)), isFalse);
      expect(hasNightFee(result('sans-tarif', priceCents: null, nightFee: dropOffNightFee)), isFalse);
    });
  });

  group('réponses de l’API', () {
    test('une offre, une fiche et une réservation sans frais de nuit (API plus ancienne) se lisent encore', () {
      final offer = OfferModel.fromJson({'available': true, 'days': 8, 'priceCents': 4500});
      expect(offer.nightFee, isNull);
      expect(offer.basePriceCents, isNull);
      final pricing = PricingModel.fromJson({'tiers': <dynamic>[], 'extraDayPriceCents': 500});
      expect(pricing.night, isNull);
      final r = SearchResultModel.fromJson({'slug': 'a', 'title': 'A', 'available': true, 'days': 8, 'priceCents': 4500});
      expect(r.nightFee, isNull);
    });

    test('les frais de l’offre, la règle de la fiche et l’instantané de la réservation', () {
      final offer = OfferModel.fromJson({
        'available': true,
        'days': 8,
        'priceCents': 5160,
        'basePriceCents': 3660,
        'nightFee': {'arrivalCents': 1500, 'returnCents': 0, 'totalCents': 1500},
      });
      expect(offer.nightFee, dropOffNightFee);
      expect(offer.basePriceCents, 3660);
      final pricing = PricingModel.fromJson({
        'tiers': <dynamic>[],
        'night': {'start': '22:00', 'end': '06:00', 'arrivalFeeCents': 1500, 'returnFeeCents': null},
      });
      expect(pricing.night, const NightRuleModel(start: '22:00', end: '06:00', arrivalFeeCents: 1500));
      final b = PublicBookingModel.fromJson({
        'reference': 'R7KQ2M',
        'status': 'upcoming',
        'parking': {'title': 'Parking'},
        'arrivalAt': '2026-10-13T23:30',
        'returnAt': '2026-10-20T18:00',
        'customerName': 'Camille Martin',
        'plate': 'AB-123-CD',
        'passengers': 1,
        'priceCents': 5160,
        'basePriceCents': 3660,
        'nightFee': {'arrivalCents': 1500, 'returnCents': 0, 'totalCents': 1500},
      });
      expect(b.nightFee, dropOffNightFee);
      expect(b.basePriceCents, 3660);
    });
  });
}
