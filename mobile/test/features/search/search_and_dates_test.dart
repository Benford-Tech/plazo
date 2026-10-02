import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/features/search/presentation/bloc/search/search_bloc.dart';
import 'package:parking_app/src/features/search/presentation/widgets/stay_sheet.dart';
import 'package:parking_app/src/shared/widgets/gradient_button.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// 12:00 in Paris on Friday 2 October 2026.
final now = DateTime.utc(2026, 10, 2, 10);

void main() {
  setUpAll(setUpLocalizedTests);

  group('recherche (A1)', () {
    test('par défaut : Lyon Saint-Exupéry, demain 08:00 → une semaine plus tard 18:00 (8 jours)', () async {
      final bloc = SearchBloc(GetAirportsUseCase(PublicRepositoryImpl(FakePublicDataSource())), clock: () => now);
      expect(bloc.state.airportSlug, 'lyon-saint-exupery');
      expect((bloc.state.arrivalAt, bloc.state.returnAt, bloc.state.days), ('2026-10-03T08:00', '2026-10-10T18:00', 8));
      bloc.add(const SearchStarted());
      expect((await bloc.stream.firstWhere((s) => s.airports.isNotEmpty)).airport?.name, 'Lyon Saint-Exupéry');
      await bloc.close();
    });

    test('« Rechercher » refuse des dates que l’API refuserait, sinon lance la recherche', () async {
      final bloc = SearchBloc(GetAirportsUseCase(PublicRepositoryImpl(FakePublicDataSource())), clock: () => now);
      bloc
        ..add(const SearchStayChanged(arrivalAt: '2026-10-05T18:00', returnAt: '2026-10-05T08:00'))
        ..add(const SearchSubmitted());
      final refused = await bloc.stream.firstWhere((s) => s.errors.isNotEmpty);
      expect(refused.errors, {'returnAt': 'return_before_arrival'});
      expect(refused.submitted, 0);
      bloc
        ..add(const SearchStayChanged(arrivalAt: '2026-10-05T08:00', returnAt: '2026-10-07T18:00'))
        ..add(const SearchSubmitted());
      final ok = await bloc.stream.firstWhere((s) => s.submitted == 1);
      expect(ok.errors, isEmpty);
      expect(ok.days, 3);
      await bloc.close();
    });
  });

  group('feuille des dates', () {
    Future<({String arrivalAt, String returnAt})?> openSheet(WidgetTester tester, {String? arrival, String? ret}) async {
      ({String arrivalAt, String returnAt})? picked;
      var closed = false;
      await pumpLocalized(
        tester,
        Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: TextButton(
                onPressed: () async {
                  picked = await showStaySheet(context, arrivalAt: arrival, returnAt: ret, clock: () => now);
                  closed = true;
                },
                child: const Text('ouvrir'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('ouvrir'));
      await tester.pumpAndSettle();
      addTearDown(() => closed);
      return picked;
    }

    testWidgets('jours passés grisés, jours facturés comptés comme le site, créneaux de 30 min', (tester) async {
      await openSheet(tester, arrival: '2026-10-03T08:00', ret: '2026-10-10T18:00');
      expect(find.text('Vos dates'), findsOneWidget);
      expect(find.text('Octobre 2026'), findsOneWidget);
      expect(find.byKey(const Key('stay-days')), findsOneWidget);
      expect(find.text('8 jours'), findsOneWidget);
      // Yesterday cannot be picked.
      await tester.tap(find.byKey(const Key('day-2026-10-01')));
      await tester.pump();
      expect(find.text('8 jours'), findsOneWidget);
      // A new drop-off on the 5th keeps the return (10th): 6 days.
      await tester.tap(find.byKey(const Key('stay-tile-start')));
      await tester.tap(find.byKey(const Key('day-2026-10-05')));
      await tester.pump();
      expect(find.text('6 jours'), findsOneWidget);
      // The return is picked next: its 30-minute slots.
      expect(find.byKey(const Key('time-18:30')), findsOneWidget);
      expect(find.byKey(const Key('time-18:15')), findsNothing);
    });

    testWidgets('un retour le même jour avant le dépôt est refusé, en français', (tester) async {
      await openSheet(tester, arrival: '2026-10-05T18:00', ret: '2026-10-07T08:00');
      await tester.tap(find.byKey(const Key('stay-tile-end')));
      await tester.tap(find.byKey(const Key('day-2026-10-05')));
      await tester.pump();
      expect(find.text('1 jour'), findsOneWidget);
      await tester.tap(find.byKey(const Key('stay-confirm')));
      await tester.pump();
      expect(find.text('Le retour doit être après le dépôt.'), findsOneWidget);
      expect(find.byType(StaySheet), findsOneWidget);
    });

    testWidgets('« Valider les dates » rend le séjour choisi', (tester) async {
      ({String arrivalAt, String returnAt})? picked;
      await pumpLocalized(
        tester,
        Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () async => picked = await showStaySheet(context, arrivalAt: null, returnAt: null, clock: () => now),
              child: const Text('ouvrir'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('ouvrir'));
      await tester.pumpAndSettle();
      expect(tester.widget<GradientButton>(find.byKey(const Key('stay-confirm'))).onPressed, isNull);
      await tester.tap(find.byKey(const Key('day-2026-10-03')));
      await tester.tap(find.byKey(const Key('day-2026-10-10')));
      await tester.pump();
      await tester.tap(find.byKey(const Key('stay-confirm')));
      await tester.pumpAndSettle();
      expect(picked, (arrivalAt: '2026-10-03T08:00', returnAt: '2026-10-10T18:00'));
    });
  });
}
