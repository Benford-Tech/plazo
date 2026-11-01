import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_forecast/data/forecast_data_source.dart';
import 'package:parking_app/src/features/pro_forecast/domain/forecast_period.dart';
import 'package:parking_app/src/features/pro_forecast/presentation/pages/pro_forecast_page.dart';
import 'package:parking_app/src/features/pro_today/presentation/widgets/date_bar.dart';

import '../../helpers/pump_app.dart';

class FakeForecast implements ForecastDataSource {
  final calls = <(String, int)>[];

  @override
  Future<ForecastModel> fetch(String from, int days) async {
    calls.add((from, days));
    return ForecastModel(
      today: '2026-10-28',
      days: [
        for (var i = 0; i < days; i++)
          () {
            final date = addDays(from, i);
            final parked = date == '2026-10-30' ? 100 : (date == '2026-10-29' ? 90 : 40);
            return ForecastDay(date: date, arrivals: date == '2026-10-30' ? 14 : 2, returns: 3, parked: parked, bookable: 100, overbooked: false);
          }(),
      ],
    );
  }
}

/// « Planning prévisionnel » (28/10/2026, direction A) in Plazo Pro.
void main() {
  setUpAll(setUpLocalizedTests);

  test('périodes : semaine du lundi, mois civil, trois mois ; jauge', () {
    expect(mondayOf('2026-11-01'), '2026-10-26');
    expect(periodOf(ForecastView.week, '2026-10-28'), (from: '2026-10-26', days: 7));
    expect(periodOf(ForecastView.month, '2026-10-28'), (from: '2026-10-01', days: 31));
    expect(periodOf(ForecastView.quarter, '2026-10-28'), (from: '2026-10-01', days: 92));
    expect(shiftPeriod(ForecastView.quarter, '2026-10-28', 1), '2027-01-01');
    expect(addMonths('2026-12-31', 1), '2027-01-01');
    final oct = monthGrids('2026-10-01', 31).single;
    expect(oct.weeks.first, [null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(gaugeOf(parked: 50, bookable: 100), (pct: 50, level: GaugeLevel.low));
    expect(gaugeOf(parked: 90, bookable: 100).level, GaugeLevel.high);
    expect(gaugeOf(parked: 100, bookable: 100).level, GaugeLevel.full);
  });

  group('page', () {
    late FakeForecast source;
    setUp(() {
      source = FakeForecast();
      locator.registerSingleton<ForecastDataSource>(source);
    });
    tearDown(() => locator.unregister<ForecastDataSource>());

    testWidgets('le mois avec arrivées, départs et « Complet », puis trois mois', (tester) async {
      await pumpLocalized(tester, const ProForecastPage(anchor: '2026-10-28'), size: const Size(400, 1600));
      await tester.pumpAndSettle();
      expect(source.calls.single, ('2026-10-01', 31));
      final full = find.byKey(const Key('forecast-day-2026-10-30'));
      expect(find.descendant(of: full, matching: find.text('↑14')), findsOneWidget);
      expect(find.descendant(of: full, matching: find.text('Complet')), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('forecast-day-2026-10-29')), matching: find.text('90 %')), findsOneWidget);
      expect(find.text('1 nuit complète'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('forecast-parked-2026-10-29')), matching: find.text('90')), findsOneWidget);
      expect(find.textContaining("Jusqu'à 100 voitures"), findsOneWidget);
      expect(find.text('Voitures garées la nuit'), findsOneWidget);

      await tester.tap(find.byKey(const Key('forecast-view-quarter')));
      await tester.pumpAndSettle();
      expect(source.calls.last, ('2026-10-01', 92));
      await tester.dragUntilVisible(find.byKey(const Key('forecast-month-2026-12-01')), find.byType(ListView), const Offset(0, -300));
      expect(find.byKey(const Key('forecast-month-2026-12-01')), findsOneWidget);
      await tester.drag(find.byType(ListView), const Offset(0, 5000));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('forecast-view-week')));
      await tester.pumpAndSettle();
      expect(source.calls.last, ('2026-10-26', 7));
      expect(find.byKey(const Key('forecast-day-2026-11-01')), findsOneWidget);
    });
  });

  testWidgets('la barre de date du planning ouvre le prévisionnel', (tester) async {
    var opened = 0;
    final day = DateTime(2026, 10, 28);
    await pumpLocalized(
      tester,
      Scaffold(
        body: PlanningDateBar(selected: day, today: day, onSelected: (_) {}, onForecast: () => opened++),
      ),
    );
    await tester.tap(find.byKey(const Key('date-forecast')));
    expect(opened, 1);
    await pumpLocalized(
      tester,
      Scaffold(
        body: PlanningDateBar(selected: day, today: day, onSelected: (_) {}),
      ),
    );
    expect(find.byKey(const Key('date-forecast')), findsNothing);
  });
}
