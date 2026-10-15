import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/booking/domain/usecases/get_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/lookup_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/save_booking_access_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/saved_bookings_use_case.dart';
import 'package:parking_app/src/features/booking/presentation/bloc/booking_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/manage_booking_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/bloc/trips_bloc.dart';
import 'package:parking_app/src/features/trips/presentation/widgets/add_booking_sheet.dart';
import 'package:parking_app/src/features/trips/presentation/widgets/booking_actions.dart';
import 'package:parking_app/src/services/link_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';
import 'package:parking_app/src/shared/widgets/gradient_button.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';
import '../../helpers/system_bars.dart';

/// 12:00 in Paris on Saturday 3 October 2026.
final now = DateTime.utc(2026, 10, 3, 10);

/// Edge-to-edge (Android 15+, 15/10/2026): the sheets of « Mes réservations » end above a 48 dp navigation bar.
void main() {
  setUpAll(setUpLocalizedTests);

  late BookingRepositoryImpl repo;

  setUp(() {
    repo = BookingRepositoryImpl(FakeBookingDataSource(InMemorySecureStorageService()));
    locator
      ..registerSingleton<LinkService>(FakeLinks())
      ..registerSingleton<TripsBloc>(TripsBloc(LoadSavedBookingsUseCase(repo), clock: () => now))
      ..registerFactory(() => ManageBookingBloc(UpdateFlightUseCase(repo), CancelBookingUseCase(repo)))
      ..registerFactory(() => BookingBloc(LookupBookingUseCase(repo), GetBookingUseCase(repo), SaveBookingAccessUseCase(repo), SavedBookingsUseCase(repo)));
  });
  tearDown(locator.reset);

  Future<void> actions(WidgetTester tester, PublicBookingModel b) =>
      pumpLocalized(tester, Scaffold(body: Center(child: BookingActions(booking: b))));

  testWidgets('« Annuler » : « Confirmer l’annulation » et « Garder ma réservation » au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await actions(tester, booking());
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expectClearOfSystemBars(tester, find.byKey(const Key('cancel-confirm')));
    expectClearOfSystemBars(tester, find.widgetWithText(OutlineAction, 'Garder ma réservation'));
  });

  testWidgets('annulation fermée : « Fermer » au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await actions(tester, booking(canCancel: false));
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expectClearOfSystemBars(tester, find.widgetWithText(OutlineAction, 'Fermer'));
  });

  testWidgets('« Modifier le vol » : « Enregistrer » au-dessus de la barre, puis du clavier, sans les additionner', (tester) async {
    setSystemBars(tester);
    await actions(tester, booking());
    await tester.tap(find.text('Modifier le vol'));
    await tester.pumpAndSettle();
    final save = find.byKey(const Key('flight-save'));
    expectClearOfSystemBars(tester, save);
    final screen = tester.view.physicalSize / tester.view.devicePixelRatio;
    expect(tester.getRect(save).bottom, screen.height - 48 - 16);

    // The keyboard is up: Flutter's padding.bottom drops to max(0, 48 - 300) = 0, the button sits 16 px above the keyboard.
    final ratio = tester.view.devicePixelRatio;
    tester.view.viewInsets = FakeViewPadding(bottom: 300 * ratio);
    tester.view.padding = FakeViewPadding(top: 24 * ratio);
    addTearDown(tester.view.resetViewInsets);
    await tester.pumpAndSettle();
    expect(tester.getRect(save).bottom, screen.height - 300 - 16);
  });

  testWidgets('« Ajouter une réservation » : le bouton au-dessus de la barre de navigation', (tester) async {
    setSystemBars(tester);
    await pumpLocalized(
      tester,
      Builder(
        builder: (context) => Scaffold(
          body: TextButton(onPressed: () => showAddBookingSheet(context), child: const Text('ajouter')),
        ),
      ),
    );
    await tester.tap(find.text('ajouter'));
    await tester.pumpAndSettle();
    expectClearOfSystemBars(tester, find.byKey(const Key('add-submit')));
  });
}
