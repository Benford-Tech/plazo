import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:parking_app/src/core/router/app_router.dart';
import 'package:parking_app/src/core/router/pro_auth_guard.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/pro_auth/presentation/bloc/pro_auth_bloc.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/features/search/presentation/bloc/parking/parking_bloc.dart';
import 'package:parking_app/src/features/search/presentation/bloc/search/search_bloc.dart';
import 'package:parking_app/src/features/search/presentation/pages/parking_page.dart';
import 'package:parking_app/src/features/search/presentation/pages/search_tab_page.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/trips_bloc.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

class MockTripsBloc extends MockBloc<TripsEvent, TripsState> implements TripsBloc {}

class MockAuth extends Mock implements ProAuthBloc {}

final now = DateTime.utc(2026, 10, 2, 10);

/// A phone in landscape, edge-to-edge: the cutout on the left, the 3-button navigation bar on the right.
const landscape = Size(900, 420);

/// Expects the widget [finder] finds to keep clear of the side bars set by [setSystemBars] (it may lie below the fold).
void expectClearOfSides(WidgetTester tester, Finder finder) {
  final rect = tester.getRect(finder);
  final ratio = tester.view.devicePixelRatio;
  final insets = tester.view.viewPadding;
  expect(rect.left, greaterThanOrEqualTo(insets.left / ratio), reason: 'under the cutout: $rect');
  expect(rect.right, lessThanOrEqualTo(tester.view.physicalSize.width / ratio - insets.right / ratio), reason: 'under the side bar: $rect');
}

/// Edge-to-edge (Android 15+, 15/10/2026): « Rechercher », the shell's tabs and a parking's page under the system bars.
void main() {
  setUpAll(setUpLocalizedTests);
  tearDown(locator.reset);

  testWidgets('« Rechercher » : tirer pour actualiser, le cercle sort sous la barre d’état, pas dessous', (tester) async {
    setSystemBars(tester);
    final repo = PublicRepositoryImpl(FakePublicDataSource());
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
    expect(tester.widget<RefreshIndicator>(find.byType(RefreshIndicator)).edgeOffset, 24);
    // Pulled down (from the title, not the map): the spinner never goes up into the status bar.
    final gesture = await tester.startGesture(tester.getCenter(find.text('Prêt à partir ?')));
    for (var i = 0; i < 6; i++) {
      await gesture.moveBy(const Offset(0, 40));
      await tester.pump(const Duration(milliseconds: 16));
    }
    expect(tester.getRect(find.byType(RefreshProgressIndicator)).top, greaterThanOrEqualTo(24));
    await gesture.cancel();
    await tester.pumpAndSettle();
  });

  testWidgets('paysage : les trois onglets s’écartent de l’encoche à gauche et de la barre de navigation à droite', (tester) async {
    final publicRepo = PublicRepositoryImpl(FakePublicDataSource());
    final bookingRepo = BookingRepositoryImpl(FakeBookingDataSource(InMemorySecureStorageService()));
    locator
      ..registerSingleton<LinkService>(FakeLinks())
      ..registerSingleton<TripsBloc>(TripsBloc(LoadSavedBookingsUseCase(bookingRepo), clock: () => now))
      ..registerFactory(() => SearchBloc(GetAirportsUseCase(publicRepo), preview: SearchParkingsUseCase(publicRepo), clock: () => now));
    PackageInfo.setMockInitialValues(appName: 'Plazo', packageName: 'p', version: '1.0.0', buildNumber: '1', buildSignature: '');
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    final router = AppRouter(proGuard: ProAuthGuard(MockAuth()));
    await pumpLocalized(tester, Router.withConfig(config: router.config()), size: landscape);
    await tester.pumpAndSettle();

    expectClearOfSides(tester, find.byKey(const Key('airport-picker')));
    expectClearOfSides(tester, find.byKey(const Key('search-map')));
    expectClearOfSystemBars(tester, find.byKey(const Key('tab-more')));

    await tester.tap(find.byKey(const Key('tab-trips')));
    await tester.pumpAndSettle();
    expectClearOfSides(tester, find.byKey(const Key('trips-segment')));
    expectClearOfSides(tester, find.byKey(const Key('trips-add')));

    await tester.tap(find.byKey(const Key('tab-more')));
    await tester.pumpAndSettle();
    expectClearOfSides(tester, find.byKey(const Key('more-faq')));
    expectClearOfSides(tester, find.byKey(const Key('more-contact')));
  });

  testWidgets('paysage : la fiche d’un parking s’écarte des bords, « Réserver » reste dégagé', (tester) async {
    locator.registerSingleton<LinkService>(FakeLinks());
    setSystemBars(tester, bottom: 0, left: 32, right: 48);
    final bloc = ParkingBloc(
      GetParkingUseCase(PublicRepositoryImpl(FakePublicDataSource())),
      airport: 'lyon-saint-exupery',
      slug: 'parking-demo-lys',
      arrivalAt: '2026-10-03T08:00',
      returnAt: '2026-10-10T18:00',
    )..add(const ParkingRequested());
    addTearDown(bloc.close);
    await pumpLocalized(
      tester,
      BlocProvider.value(value: bloc, child: const ParkingPage(airport: 'lyon-saint-exupery', parking: 'parking-demo-lys')),
      size: landscape,
    );
    await tester.pumpAndSettle();
    expectClearOfSides(tester, find.byKey(const Key('parking-scroll')));
    expectClearOfSides(tester, find.byKey(const Key('parking-facts')));
    expectClearOfSystemBars(tester, find.byKey(const Key('parking-book')));
  });
}
