import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/presentation/pages/my_booking_page.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// « Ma réservation »: the amount paid, and the night fees included in it (12/10/2026, frozen at booking).
void main() {
  setUpAll(setUpLocalizedTests);

  Future<void> pump(WidgetTester tester, PublicBookingModel b) => pumpLocalized(tester, Scaffold(body: PaymentSummary(booking: b)));

  const paid = BookingPaymentModel(status: 'paid');

  testWidgets('« Payé 51,60 € » puis « dont 15,00 € de frais de nuit »', (tester) async {
    await pump(tester, booking(payment: paid, arrivalAt: '2026-10-10T23:30', priceCents: 5160, basePriceCents: 3660, nightFee: dropOffNightFee));
    expect(find.text('Payé'), findsOneWidget);
    expect(find.text('51,60 €'), findsOneWidget);
    expect(find.byKey(const Key('booking-night-fee')), findsOneWidget);
    expect(find.text('dont 15,00 € de frais de nuit'), findsOneWidget);
  });

  testWidgets('remboursée : le montant et ses frais de nuit restent dits', (tester) async {
    await pump(
      tester,
      booking(status: 'cancelled', payment: const BookingPaymentModel(status: 'refunded'), priceCents: 5160, nightFee: dropOffNightFee),
    );
    expect(find.text('Remboursé'), findsOneWidget);
    expect(find.text('dont 15,00 € de frais de nuit'), findsOneWidget);
  });

  testWidgets('sans frais de nuit, ou montant barré (rien payé) : pas de ligne', (tester) async {
    await pump(tester, booking(payment: paid));
    expect(find.text('45,00 €'), findsOneWidget);
    expect(find.byKey(const Key('booking-night-fee')), findsNothing);

    await pump(tester, booking(status: 'cancelled', payment: const BookingPaymentModel(status: 'expired'), priceCents: 5160, nightFee: dropOffNightFee));
    expect(find.text('Rien à payer'), findsOneWidget);
    expect(find.byKey(const Key('booking-night-fee')), findsNothing);
  });
}
