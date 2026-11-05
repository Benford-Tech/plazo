import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
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

  Future<FakePublicDataSource> pumpHome(WidgetTester tester, {TripsState? trips, AirportLiveModel? live}) async {
    final source = FakePublicDataSource()
      ..searchResponse = SearchResponseModel(
        payments: 'online',
        airport: lys,
        results: [result('c', available: false), result('b', priceCents: 4500), result('soleil', priceCents: 3900)],
      );
    if (live != null) source.liveResponse = live;
    final repo = PublicRepositoryImpl(source);
    final tripsBloc = MockTripsBloc();
    whenListen(tripsBloc, const Stream<TripsState>.empty(), initialState: trips ?? TripsState(now: now));
    await pumpLocalized(
      tester,
      MultiBlocProvider(
        providers: [
          BlocProvider<TripsBloc>.value(value: tripsBloc),
          BlocProvider(
            create: (_) => SearchBloc(
              GetAirportsUseCase(repo),
              preview: SearchParkingsUseCase(repo),
              live: live == null ? null : GetAirportLiveUseCase(repo),
              autoPoll: false,
              clock: () => now,
            )..add(const SearchStarted()),
          ),
        ],
        child: const SearchTabPage(),
      ),
    );
    await tester.pumpAndSettle();
    return source;
  }

  testWidgets('C · sans réservation : le titre, les dates, puis les parkings pour ces dates, le moins cher d\'abord', (tester) async {
    final source = await pumpHome(tester);
    expect(find.text('Prêt à partir ?'), findsOneWidget);
    expect(find.textContaining('Votre parking'), findsOneWidget);
    expect(find.byKey(const Key('next-departure')), findsNothing);
    expect(tester.widget<Text>(find.byKey(const Key('search-count'))).data, '2 PARKINGS POUR VOS DATES');
    expect(find.descendant(of: find.byKey(const Key('search-submit')), matching: find.text('Voir les 2 parkings')), findsOneWidget);
    expect(find.byKey(const Key('search-map-open')), findsOneWidget);
    // The cheapest first, the full one last.
    final soleil = tester.getTopLeft(find.byKey(const Key('search-result-soleil'))).dy;
    final b = tester.getTopLeft(find.byKey(const Key('search-result-b'))).dy;
    expect(soleil < b, isTrue);
    expect(find.descendant(of: find.byKey(const Key('search-result-soleil')), matching: find.text('Le moins cher')), findsOneWidget);
    expect(source.searches.single, 'lyon-saint-exupery 2026-10-03T08:00 2026-10-10T18:00');
  });

  testWidgets('A · une réservation à venir passe en tête : « Dans 8 jours », le parking, « Voir ma réservation »', (tester) async {
    await pumpHome(
      tester,
      trips: TripsState(
        now: now,
        bookings: [booking(arrivalAt: '2026-10-10T08:00', returnAt: '2026-10-17T18:00')],
      ),
    );
    final hero = find.byKey(const Key('next-departure'));
    expect(find.descendant(of: hero, matching: find.text('Dans 8 jours')), findsOneWidget);
    expect(find.descendant(of: hero, matching: find.text('Parking Démo LYS')), findsOneWidget);
    expect(find.descendant(of: hero, matching: find.text('Voir ma réservation')), findsOneWidget);
    // The search card follows, without the big title.
    expect(find.text('UN AUTRE SÉJOUR ?'), findsOneWidget);
    expect(find.text('Prêt à partir ?'), findsNothing);
    expect(tester.getTopLeft(hero).dy < tester.getTopLeft(find.byKey(const Key('search-dates'))).dy, isTrue);
  });

  testWidgets('A · une arrivée demain dit « Demain »', (tester) async {
    await pumpHome(
      tester,
      trips: TripsState(
        now: now,
        bookings: [booking(arrivalAt: '2026-10-03T08:00')],
      ),
    );
    expect(tester.widget<Text>(find.byKey(const Key('next-departure-when'))).data, 'Demain');
  });

  testWidgets('A · un séjour commencé dit « Séjour en cours »', (tester) async {
    await pumpHome(
      tester,
      trips: TripsState(
        now: now,
        bookings: [booking(status: 'arrived', arrivalAt: '2026-09-30T08:00', returnAt: '2026-10-05T18:00')],
      ),
    );
    expect(tester.widget<Text>(find.byKey(const Key('next-departure-when'))).data, 'Séjour en cours');
  });

  testWidgets('C · les navettes en circulation au-dessus des parkings', (tester) async {
    final source = await pumpHome(
      tester,
      live: const AirportLiveModel(
        serverTime: '2026-10-02T10:00:00Z',
        airport: lys,
        parkings: [LiveParkingModel(slug: 'soleil', title: 'Parking soleil')],
        shuttles: [
          LiveShuttleModel(
            id: 't1',
            parking: 'soleil',
            direction: 'dropoff',
            position: LatLngModel(lat: 45.72, lng: 5.06),
            positionAgeSeconds: 12,
            startedAt: '2026-10-02T09:50:00Z',
          ),
          LiveShuttleModel(id: 't2', parking: 'soleil', startedAt: '2026-10-02T09:55:00Z'),
        ],
      ),
    );
    expect(source.lives, 1);
    expect(find.descendant(of: find.byKey(const Key('search-shuttles')), matching: find.text('2 navettes en circulation')), findsOneWidget);
  });
}
