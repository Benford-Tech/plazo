import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/parking_messages/parking_messages_card.dart';
import 'package:parking_app/src/features/parking_messages/parking_messages_data_source.dart';

import '../../helpers/pump_app.dart';

// « Écrire au parking » (12/11/2026): the traveller's thread with the parking, in Ma réservation.

class FakeMessages implements ParkingMessagesDataSource {
  final written = <String>[];
  final now = DateTime.now();

  @override
  Future<ParkingThread> fetch(String reference) async => ParkingThread(
    canWrite: true,
    messages: [
      ParkingMessage(id: 'm1', mine: true, text: 'On arrive à 8h, c’est bon ?', at: now, by: null),
      ParkingMessage(id: 'm0', mine: false, text: 'Rendez-vous demain à 8h.', at: now, by: null, whatsapp: true, kind: 'booking_reminder'),
      ParkingMessage(id: 'm2', mine: false, text: 'Oui, à demain.', at: now, by: 'Joanny'),
    ],
  );

  @override
  Future<ParkingMessage> write(String reference, String text) async {
    written.add(text);
    return ParkingMessage(id: 'm3', mine: true, text: text, at: now, by: null);
  }
}

void main() {
  setUpAll(setUpLocalizedTests);

  testWidgets('le fil avec le parking, puis un message envoyé', (tester) async {
    final fake = FakeMessages();
    locator.registerSingleton<ParkingMessagesDataSource>(fake);
    addTearDown(() => locator.unregister<ParkingMessagesDataSource>());
    await pumpLocalized(
      tester,
      const Scaffold(
        body: SingleChildScrollView(
          child: ParkingMessagesCard(reference: 'R7KQ2M', parkingName: 'APL Parking'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Écrire au parking'), findsOneWidget);
    expect(find.byKey(const Key('parking-message-mine')), findsOneWidget);
    expect(find.byKey(const Key('parking-message-parking')), findsOneWidget);
    expect(find.textContaining('Joanny ·'), findsOneWidget);
    expect(find.byKey(const Key('parking-message-plazo')), findsOneWidget);
    expect(find.text('Message de la veille'), findsOneWidget);
    expect(find.textContaining('· WhatsApp'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('parking-messages-input')), 'Merci !');
    await tester.tap(find.byKey(const Key('parking-messages-send')));
    await tester.pumpAndSettle();
    expect(fake.written, ['Merci !']);
    expect(find.byKey(const Key('parking-message-mine')), findsNWidgets(2));
  });

  test('pas de fil pour une réservation annulée ou en attente de paiement', () {
    expect(ParkingMessagesCard.relevant('upcoming'), isTrue);
    expect(ParkingMessagesCard.relevant('returned'), isTrue);
    expect(ParkingMessagesCard.relevant('cancelled'), isFalse);
    expect(ParkingMessagesCard.relevant('pending_payment'), isFalse);
  });
}
