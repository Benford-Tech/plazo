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
    expect(find.textContaining('Votre parking'), findsOneWidget);
    expect(find.byKey(const Key('search-map')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-count')), matching: find.text('2 parkings disponibles')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-distance')), matching: find.text('3,5 km · navette 8 min')), findsOneWidget);
    final featured = find.byKey(const Key('search-featured'));
    expect(find.descendant(of: featured, matching: find.text('Parking soleil')), findsOneWidget);
    expect(find.descendant(of: featured, matching: find.text('dès ${formatShortEuros(3900)}')), findsOneWidget);
    expect(find.descendant(of: featured, matching: find.text('Vous vous garez · navette 8 min')), findsOneWidget);
    expect(source.searches.single, 'lyon-saint-exupery 2026-10-03T08:00 2026-10-10T18:00');
  });

  testWidgets('K-A · carte vivante : navettes en circulation, pastilles cliquables, carte du parking choisi', (tester) async {
    final source = FakePublicDataSource()
      ..searchResponse = SearchResponseModel(payments: 'online', airport: lys, results: [result('soleil', priceCents: 3900), result('b', priceCents: 4500, location: const LatLngModel(lat: 45.74, lng: 5.09)), result('c', available: false, location: const LatLngModel(lat: 45.71, lng: 5.04))])
      ..liveResponse = const AirportLiveModel(
        serverTime: '2026-10-02T10:00:00Z',
        airport: lys,
        parkings: [LiveParkingModel(slug: 'soleil', title: 'Parking soleil')],
        shuttles: [
          LiveShuttleModel(id: 't1', parking: 'soleil', direction: 'dropoff', position: LatLngModel(lat: 45.72, lng: 5.06), positionAgeSeconds: 12, startedAt: '2026-10-02T09:50:00Z'),
          LiveShuttleModel(id: 't2', parking: 'soleil', startedAt: '2026-10-02T09:55:00Z'),
        ],
      );
    final repo = PublicRepositoryImpl(source);
    final trips = MockTripsBloc();
    whenListen(trips, const Stream<TripsState>.empty(), initialState: TripsState(now: now));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<TripsBloc>.value(value: trips),
          BlocProvider(
            create: (_) =>
                SearchBloc(GetAirportsUseCase(repo), preview: SearchParkingsUseCase(repo), live: GetAirportLiveUseCase(repo), autoPoll: false, clock: () => now)
                  ..add(const SearchStarted()),
          ),
        ],
        child: const SearchTabPage(),
      ),
    );
    await tester.pumpAndSettle();
    expect(source.lives, 1);
    // Two shuttles on the road, one with a position: the pill counts both, the map draws one.
    expect(find.descendant(of: find.byKey(const Key('search-shuttles')), matching: find.text('2 navettes en circulation')), findsOneWidget);
    expect(find.byKey(const Key('search-shuttle-t1')), findsOneWidget);
    expect(find.byKey(const Key('search-shuttle-t2')), findsNothing);
    expect(find.byTooltip('Navette de Parking soleil · vers le terminal · position il y a 12 s'), findsOneWidget);
    // Every parking of the stay is a pin, the full one too; the cheapest is the card.
    expect(find.byKey(const Key('search-pin-c')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-featured')), matching: find.text('Parking soleil')), findsOneWidget);

    // Tapping a pin: its parking takes the card; a full one says so.
    await tester.tap(find.byKey(const Key('search-pin-b')));
    await tester.pumpAndSettle();
    expect(find.descendant(of: find.byKey(const Key('search-featured')), matching: find.text('Parking b')), findsOneWidget);
    expect(find.descendant(of: find.byKey(const Key('search-featured')), matching: find.text('dès ${formatShortEuros(4500)}')), findsOneWidget);
    await tester.tap(find.byKey(const Key('search-pin-c')));
    await tester.pumpAndSettle();
    expect(find.descendant(of: find.byKey(const Key('search-featured')), matching: find.text('Complet à ces dates')), findsOneWidget);
  });
}
