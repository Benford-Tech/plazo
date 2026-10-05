import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/helpers/money.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/features/search/presentation/bloc/search/search_bloc.dart';
import 'package:parking_app/src/features/search/presentation/pages/search_tab_page.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/trips_bloc.dart';
import 'package:bloc_test/bloc_test.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

class MockTripsBloc extends MockBloc<TripsEvent, TripsState> implements TripsBloc {}

final now = DateTime.utc(2026, 10, 2, 10);

void main() {
  setUpAll(setUpLocalizedTests);

  testWidgets('T-A · accueil : titre, carte avec le nombre de parkings et la distance, carte orange du moins cher', (tester) async {
    final source = FakePublicDataSource()
      ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('soleil', priceCents: 3900), result('b', priceCents: 4500), result('c', available: false)]);
    final repo = PublicRepositoryImpl(source);
    final trips = MockTripsBloc();
    whenListen(trips, const Stream<TripsState>.empty(), initialState: TripsState(now: now));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<TripsBloc>.value(value: trips),
          BlocProvider(create: (_) => SearchBloc(GetAirportsUseCase(repo), preview: SearchParkingsUseCase(repo), clock: () => now)..add(const SearchStarted())),
        ],
        child: const SearchTabPage(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Prêt à partir ?'), findsOneWidget);
    expect(find.textContaining('Trouvons votre parking'), findsOneWidget);
    expect(find.byKey(const Key('search-map')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-count')), matching: find.text('2 parkings disponibles')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-distance')), matching: find.text('3,5 km · navette 8 min')), findsOneWidget);
    final featured = find.byKey(const Key('search-featured'));
    expect(find.descendant(of: featured, matching: find.text('Parking soleil')), findsOneWidget);
    expect(find.descendant(of: featured, matching: find.text('dès ${formatShortEuros(3900)}')), findsOneWidget);
    expect(find.descendant(of: featured, matching: find.text('Vous vous garez · navette 8 min')), findsOneWidget);
    expect(source.searches.single, 'lyon-saint-exupery 2026-10-03T08:00 2026-10-10T18:00');
  });
}
