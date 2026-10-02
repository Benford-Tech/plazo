import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/money.dart';
import 'package:parking_app/src/core/helpers/plate.dart';
import 'package:parking_app/src/core/helpers/stay.dart';

void main() {
  group('dates du séjour (mêmes règles que le site)', () {
    test('jours facturés : chaque jour calendaire touché, comme l’API', () {
      expect(stayDays('2026-10-03T08:00', '2026-10-10T18:00'), 8);
      expect(stayDays('2026-10-03T08:00', '2026-10-03T18:00'), 1);
      expect(stayDays('2026-10-31T23:30', '2026-11-01T00:30'), 2);
      expect(rangeDays('2026-10-10', '2026-10-14'), 5);
      expect(daysLabel(1), '1 jour');
      expect(daysLabel(8), '8 jours');
    });

    test('aujourd’hui à l’heure du parking (Europe/Paris, heure d’été comprise)', () {
      // 22:30 UTC on 2 October = 00:30 on 3 October in Paris (CEST).
      expect(todayLocal(DateTime.utc(2026, 10, 2, 22, 30)), '2026-10-03');
      // Winter (CET): 23:30 UTC on 1 December = 00:30 on 2 December.
      expect(todayLocal(DateTime.utc(2026, 12, 1, 23, 30)), '2026-12-02');
      expect(fromInstant(DateTime.utc(2026, 10, 25, 0, 30)), '2026-10-25T02:30');
      expect(fromInstant(DateTime.utc(2026, 10, 25, 1, 30)), '2026-10-25T02:30');
      expect(toInstant('2026-07-01T10:00'), DateTime.utc(2026, 7, 1, 8));
      expect(toInstant('2026-01-15T10:00'), DateTime.utc(2026, 1, 15, 9));
    });

    test('séjour proposé : demain 08:00 → une semaine plus tard 18:00', () {
      final stay = defaultStay(DateTime.utc(2026, 10, 2, 12));
      expect(stay.arrival, '2026-10-03T08:00');
      expect(stay.returnAt, '2026-10-10T18:00');
    });

    test('contrôles de l’API : retour après le dépôt, dépôt pas passé, 90 jours au plus', () {
      final now = DateTime.utc(2026, 10, 2, 12);
      expect(validateStay('2026-10-03T08:00', '2026-10-10T18:00', now), isEmpty);
      expect(validateStay('2026-10-03T18:00', '2026-10-03T08:00', now), {'returnAt': 'return_before_arrival'});
      expect(validateStay('2026-10-03T08:00', '2026-10-03T08:00', now), {'returnAt': 'return_before_arrival'});
      expect(validateStay('2026-10-01T08:00', '2026-10-10T18:00', now), {'arrivalAt': 'arrival_in_past'});
      expect(validateStay('2026-10-03T08:00', '2027-01-02T08:00', now), {'returnAt': 'stay_too_long'});
      expect(validateStay(null, '2026-10-10T18:00', now), {'arrivalAt': 'required'});
      expect(validateStay('2026-02-30T08:00', '2026-10-10T18:00', now), {'arrivalAt': 'invalid_datetime'});
    });

    test('créneaux de 30 min de 05:00 à 23:30, plus l’heure courante hors créneau', () {
      expect(timeSlots.first, '05:00');
      expect(timeSlots.last, '23:30');
      expect(timeSlots, hasLength(38));
      expect(timeOptions('15:05'), contains('15:05'));
      expect(timeOptions('15:00'), same(timeSlots));
    });

    test('calendrier : 1er clic le dépôt, 2e le retour ; un retour avant le dépôt devient le dépôt ; jamais avant aujourd’hui', () {
      const min = '2026-10-02';
      var d = const RangeDraft();
      d = pickDay(d, '2026-10-01', min);
      expect(d.start, isNull);
      d = pickDay(d, '2026-10-10', min);
      expect((d.start, d.end, d.picking), ('2026-10-10', null, RangeSide.end));
      d = pickDay(d, '2026-10-05', min);
      expect((d.start, d.end), ('2026-10-05', null));
      d = pickDay(d, '2026-10-12', min);
      expect((d.start, d.end, d.picking), ('2026-10-05', '2026-10-12', RangeSide.start));
      // A new drop-off keeps a return still after it.
      d = pickDay(d, '2026-10-08', min);
      expect((d.start, d.end), ('2026-10-08', '2026-10-12'));
    });

    test('libellés français comme le site', () {
      expect(formatDay('2026-10-03'), 'sam. 3 oct.');
      expect(formatStayDates('2026-10-03', '2026-10-10'), (start: 'sam. 3 oct.', end: 'sam. 10'));
      expect(formatStayDates('2026-10-30', '2026-11-02'), (start: 'ven. 30 oct.', end: 'lun. 2 nov.'));
      expect(formatDateTimeAt('2026-10-03T06:30'), 'sam. 3 oct. à 06:30');
      expect(shortRange('2026-10-03', '2026-10-10'), '3 → 10 oct.');
      expect(monthWeeks(2026, 10).first, [null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    });
  });

  test('prix et plaques comme le site', () {
    expect(formatEuros(4500), '45,00 €');
    expect(formatEuros(123456), '1 234,56 €');
    expect(formatShortEuros(4500), '45 €');
    expect(formatShortEuros(3499), '34,99 €');
    expect(formatPlate('gk318px'), 'GK-318-PX');
    expect(formatPlate(' b 1234  xy '), 'B 1234 XY');
    expect(isFrenchPlate('gk 318 px'), isTrue);
    expect(formatPhone('0612345678'), '06 12 34 56 78');
    expect(firstName('Camille Martin'), 'Camille');
    expect(firstName('M. Dupont'), '');
    expect(isFrenchMobile('+33 6 12 34 56 78'), isTrue);
    expect(isFrenchMobile('04 72 00 00 00'), isFalse);
  });
}
