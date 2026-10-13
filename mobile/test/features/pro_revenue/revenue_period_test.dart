import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/pro_revenue/domain/revenue_period.dart';

import '../../helpers/pump_app.dart';

String label(RevenueSpan span, String anchor, {String today = '2026-10-13'}) =>
    periodLabel(span, anchor, today, todayWord: "Aujourd'hui", yesterdayWord: 'Hier', thisWeekWord: 'Cette semaine', range: (a, b) => 'Du $a au $b');

void main() {
  setUpAll(setUpLocalizedTests);

  test('périodes : un jour, la semaine du lundi au dimanche, le mois civil (février, changement d’année)', () {
    expect(revenuePeriod(RevenueSpan.day, '2026-10-13'), (from: '2026-10-13', to: '2026-10-13'));
    expect(revenuePeriod(RevenueSpan.week, '2026-10-13'), (from: '2026-10-12', to: '2026-10-18'));
    expect(revenuePeriod(RevenueSpan.week, '2026-10-18'), (from: '2026-10-12', to: '2026-10-18'));
    expect(revenuePeriod(RevenueSpan.week, '2026-12-31'), (from: '2026-12-28', to: '2027-01-03'));
    expect(revenuePeriod(RevenueSpan.month, '2026-10-13'), (from: '2026-10-01', to: '2026-10-31'));
    expect(revenuePeriod(RevenueSpan.month, '2028-02-10'), (from: '2028-02-01', to: '2028-02-29'));
    // The last Sunday of October changes the clocks: still 7 local days.
    expect(revenuePeriod(RevenueSpan.week, '2026-10-25'), (from: '2026-10-19', to: '2026-10-25'));
  });

  test('‹ et › : un jour, sept jours, un mois (depuis le 31, sans sauter février)', () {
    expect(stepAnchor(RevenueSpan.day, '2026-11-01', -1), '2026-10-31');
    expect(stepAnchor(RevenueSpan.week, '2026-10-13', 1), '2026-10-20');
    expect(stepAnchor(RevenueSpan.month, '2027-01-31', 1), '2027-02-01');
    expect(stepAnchor(RevenueSpan.month, '2026-01-15', -1), '2025-12-01');
  });

  test('changer de période garde aujourd’hui s’il est dans la période affichée, sinon son premier jour', () {
    expect(anchorForSpan(from: RevenueSpan.month, anchor: '2026-10-01', today: '2026-10-13'), '2026-10-13');
    expect(anchorForSpan(from: RevenueSpan.month, anchor: '2026-09-01', today: '2026-10-13'), '2026-09-01');
    expect(anchorForSpan(from: RevenueSpan.week, anchor: '2026-10-07', today: '2026-10-13'), '2026-10-05');
  });

  test('libellés : aujourd’hui, hier, un jour, cette semaine, une autre semaine, un mois, une autre année', () {
    expect(label(RevenueSpan.day, '2026-10-13'), "Aujourd'hui");
    expect(label(RevenueSpan.day, '2026-10-12'), 'Hier');
    expect(label(RevenueSpan.day, '2026-10-06'), 'Mardi 6 octobre');
    expect(label(RevenueSpan.day, '2025-10-06'), 'Lundi 6 octobre 2025');
    expect(label(RevenueSpan.week, '2026-10-14'), 'Cette semaine');
    expect(label(RevenueSpan.week, '2026-10-06'), 'Du 5 au 11 octobre');
    expect(label(RevenueSpan.week, '2026-10-01'), 'Du 28 sept. au 4 oct.');
    expect(label(RevenueSpan.month, '2026-10-01'), 'Octobre 2026');
  });
}
