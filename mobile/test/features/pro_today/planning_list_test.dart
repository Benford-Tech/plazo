import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/features/pro_shuttle/presentation/bloc/live_shuttles_bloc.dart';
import 'package:parking_app/src/features/pro_today/data/models/planning_model.dart';
import 'package:parking_app/src/features/pro_today/presentation/bloc/pro_today_bloc.dart';
import 'package:parking_app/src/features/pro_today/presentation/pages/pro_today_page.dart';

import '../../helpers/fixtures.dart';
import '../../helpers/pump_app.dart';

class MockTodayBloc extends MockBloc<ProTodayEvent, ProTodayState> implements ProTodayBloc {}

class MockLiveBloc extends MockBloc<LiveShuttlesEvent, LiveShuttlesState> implements LiveShuttlesBloc {}

/// Direction A (27/10/2026): one chronological list of the day, drop-offs and returns tagged and tinted,
/// pills to keep one kind, « Déjà passés » folded, a one-line date bar.
void main() {
  setUpAll(() async {
    await setUpLocalizedTests();
    registerFallbackValue(const ProTodayStarted());
  });

  final now = DateTime(2026, 10, 27, 14, 14);
  PlanningRowModel at(String id, String name, String plate, int h, int m, {String status = 'upcoming'}) =>
      row(id, name, plate, DateTime(2026, 10, 27, h, m), status: status);
  final planning = PlanningModel(
    date: '2026-10-27',
    parking: const PlanningParkingModel(id: 'p1', name: 'Parking Test'),
    arrivals: [
      at('a1', 'Théo Dubois', 'TS-238-PZ', 15, 10),
      at('a2', 'Chloé Moreau', 'BN-655-RT', 12, 10, status: 'arrived'),
      at('a3', 'Hugo Blanc', 'TS-244-PZ', 17, 5),
    ],
    returns: [
      at('b1', 'Léa Petit', 'TS-212-PZ', 13, 40, status: 'shuttled_out').copyWith(returnFlight: 'TO 3627'),
      at('b2', 'Nadia Roux', 'TS-207-PZ', 16, 30, status: 'return_requested'),
      at('b3', 'Marc Petit', 'AZ-902-LC', 11, 0, status: 'back_at_parking'),
    ],
  );

  Future<MockTodayBloc> show(WidgetTester tester, {String? date, PlanningModel? data}) async {
    final today = MockTodayBloc();
    whenListen(today, const Stream<ProTodayState>.empty(), initialState: ProTodayState(now: now, planning: data ?? planning, date: date));
    final live = MockLiveBloc();
    whenListen(live, const Stream<LiveShuttlesState>.empty(), initialState: LiveShuttlesState(now: now));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<ProTodayBloc>.value(value: today),
          BlocProvider<LiveShuttlesBloc>.value(value: live),
        ],
        child: const ProTodayView(initialMode: TodayMode.planning),
      ),
      size: const Size(400, 1200),
    );
    return today;
  }

  List<String> visibleRows(WidgetTester tester) {
    final keys = tester.widgetList<Container>(find.byWidgetPredicate((w) => w is Container && w.key is ValueKey<String> && (w.key! as ValueKey<String>).value.startsWith('row-')));
    return [for (final k in keys) (k.key! as ValueKey<String>).value.substring(4)];
  }

  test('mergeDay : au point de rendez-vous, puis en approche, puis par heure, les deux sens mêlés', () {
    final merged = mergeDay(
      [TodayRow(planning.arrivals[0], null), TodayRow(planning.arrivals[1], null), TodayRow(planning.arrivals[2], null)],
      [TodayRow(planning.returns[0], staffSignal('b1')), TodayRow(planning.returns[1], null), TodayRow(planning.returns[2], null)],
    );
    expect(merged.map((e) => e.row.booking.id).toList(), ['b1', 'b3', 'a2', 'a1', 'b2', 'a3']);
    expect(merged.map((e) => e.done).toList(), [false, true, true, false, false, false]);
  });

  testWidgets('une seule liste : barre de date compacte, pilules avec comptages, passés repliés, pastilles ARRIVÉE / DÉPART', (tester) async {
    await show(tester);
    expect(find.byKey(const Key('date-bar')), findsOneWidget);
    expect(find.text('MAR. 27 OCT.'), findsOneWidget);
    expect(find.byKey(const Key('today-back')), findsNothing);
    expect(find.text('Tout · 6'), findsOneWidget);
    expect(find.text('Arrivées · 3'), findsOneWidget);
    expect(find.text('Départs · 3'), findsOneWidget);
    // Chloé (arrived) and Marc (back at the parking) are done: folded.
    expect(find.text('DÉJÀ PASSÉS · 2'), findsOneWidget);
    expect(visibleRows(tester), ['b1', 'a1', 'b2', 'a3']);
    expect(find.text('ARRIVÉE'), findsNWidgets(2));
    expect(find.text('DÉPART'), findsNWidgets(2));

    await tester.tap(find.byKey(const Key('planning-past')));
    await tester.pump();
    expect(visibleRows(tester), ['b3', 'a2', 'b1', 'a1', 'b2', 'a3']);
  });

  testWidgets('les pilules gardent un sens ; un autre jour montre « Aujourd\'hui » pour revenir', (tester) async {
    await show(tester);
    await tester.ensureVisible(find.byKey(const Key('planning-filter-returns')));
    await tester.tap(find.byKey(const Key('planning-filter-returns')));
    await tester.pump();
    expect(visibleRows(tester), ['b1', 'b2']);
    expect(find.text('ARRIVÉE'), findsNothing);
    await tester.ensureVisible(find.byKey(const Key('planning-filter-arrivals')));
    await tester.tap(find.byKey(const Key('planning-filter-arrivals')));
    await tester.pump();
    expect(visibleRows(tester), ['a1', 'a3']);

    final bloc = await show(tester, date: '2026-10-28', data: planning.copyWith(arrivals: const [], returns: const []));
    expect(find.text('MER. 28 OCT.'), findsOneWidget);
    expect(find.text('Rien de prévu ce jour-là.'), findsOneWidget);
    await tester.tap(find.byKey(const Key('today-back')));
    verify(() => bloc.add(any(that: isA<ProTodayDateChanged>().having((e) => e.date, 'date', null)))).called(1);
    await tester.tap(find.byKey(const Key('date-next-day')));
    verify(() => bloc.add(any(that: isA<ProTodayDateChanged>().having((e) => e.date, 'date', '2026-10-29')))).called(1);
  });
}
