import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/booking/presentation/widgets/child_seats_card.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';
import 'package:parking_app/src/shared/child_seats/child_seats.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// « Sièges auto » on « Ma réservation » (24/10/2026): the summary, and the sheet that saves while the booking is expected.
void main() {
  setUpAll(setUpLocalizedTests);

  late FakeBookingDataSource api;
  setUp(() {
    api = FakeBookingDataSource(InMemorySecureStorageService());
    locator.registerSingleton<UpdateChildSeatsUseCase>(UpdateChildSeatsUseCase(BookingRepositoryImpl(api)));
  });
  tearDown(locator.reset);

  Future<void> pump(WidgetTester tester, PublicBookingModel b, {ValueChanged<PublicBookingModel>? onChanged}) =>
      pumpLocalized(tester, Scaffold(body: ChildSeatsCard(booking: b, onChanged: onChanged)));

  testWidgets('« Aucun siège demandé », puis la feuille enregistre et la page est prévenue', (tester) async {
    PublicBookingModel? changed;
    await pump(tester, booking(), onChanged: (b) => changed = b);
    expect(find.text('Sièges auto'), findsOneWidget);
    expect(find.text('Aucun siège demandé'), findsOneWidget);
    await tester.tap(find.byKey(const Key('booking-child-seats-edit')));
    await tester.pumpAndSettle();
    expect(find.text('Sièges auto pour la navette'), findsOneWidget);
    await tester.tap(find.byKey(const Key('child-seat-more-infant')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('child-seats-save')));
    await tester.pumpAndSettle();
    expect(api.calls, contains('childSeats'));
    expect(changed?.childSeats, const ChildSeats(infant: 1));
    expect(find.text('Sièges auto enregistrés.'), findsOneWidget);
  });

  testWidgets('deux sièges pour deux passagers : refusé sur place, rien n’est envoyé', (tester) async {
    await pump(tester, booking());
    await tester.tap(find.byKey(const Key('booking-child-seats-edit')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('child-seat-more-infant')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('child-seat-more-booster')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('child-seats-save')));
    await tester.pumpAndSettle();
    expect(find.text('Les enfants comptent dans les passagers : ajoutez-les au nombre de passagers.'), findsOneWidget);
    expect(api.calls, isNot(contains('childSeats')));
  });

  testWidgets('refus de l’API (déjà au parking) : le texte en français', (tester) async {
    api.answer('childSeats', const ApiError('child_seats_locked'));
    await pump(tester, booking());
    await tester.tap(find.byKey(const Key('booking-child-seats-edit')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('child-seat-more-booster')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('child-seats-save')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('child-seats-sheet-error')), findsOneWidget);
    expect(find.text('Les sièges ne se modifient plus : vous êtes déjà au parking.'), findsOneWidget);
  });

  testWidgets('voiture sur place : le résumé reste, sans « Modifier »', (tester) async {
    final b = booking(status: 'arrived').copyWith(childSeats: const ChildSeats(infant: 1, booster: 2));
    expect(ChildSeatsCard.relevant(b), isTrue);
    expect(ChildSeatsCard.relevant(booking(status: 'arrived')), isFalse);
    expect(ChildSeatsCard.relevant(booking(status: 'cancelled').copyWith(childSeats: const ChildSeats(infant: 1))), isFalse);
    await pump(tester, b);
    expect(find.text('1 siège bébé · 2 réhausseurs'), findsOneWidget);
    expect(find.byKey(const Key('booking-child-seats-edit')), findsNothing);
  });
}
