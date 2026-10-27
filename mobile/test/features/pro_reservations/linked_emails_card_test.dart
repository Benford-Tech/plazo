import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_reservations/data/datasources/linked_emails_data_source.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/widgets/linked_emails_card.dart';

import '../../helpers/pump_app.dart';

class FakeLinkedEmails implements LinkedEmailsDataSource {
  FakeLinkedEmails(this.emails);
  final List<LinkedEmailModel> emails;
  final asked = <String>[];

  @override
  Future<List<LinkedEmailModel>> fetch(String reservationId) async {
    asked.add(reservationId);
    return emails;
  }
}

/// « Mails liés » (27/10/2026, direction C): the booking's mails on its sheet in Plazo Pro, a tap opens the mail.
void main() {
  setUpAll(setUpLocalizedTests);
  tearDown(() {
    if (locator.isRegistered<LinkedEmailsDataSource>()) locator.unregister<LinkedEmailsDataSource>();
  });

  Future<void> show(WidgetTester tester) =>
      pumpLocalized(tester, const Scaffold(body: SingleChildScrollView(child: LinkedEmailsCard(reservationId: 'r1'))));

  test('le modèle se lit depuis le JSON du serveur', () {
    final m = LinkedEmailModel.fromJson({
      'id': 'm2',
      'role': 'change',
      'status': 'imported',
      'receivedAt': '2026-10-14T17:02:00.000Z',
      'subject': 'Modification AL-482913',
      'provider': 'Allopark',
      'textBody': null,
      'reading': {'summary': 'Modification Allopark de la réservation AL-482913'},
      'change': {
        'applied': true,
        'changes': [
          {'field': 'returnAt', 'from': '2026-12-13T20:30', 'to': '2026-12-15T18:00'},
          {'field': 'priceCents', 'from': 4500, 'to': 5400},
        ],
      },
    });
    expect(m.role, 'change');
    expect(m.textBody, isNull);
    expect(m.summary, 'Modification Allopark de la réservation AL-482913');
    expect(m.changes.map((c) => (c.field, c.from, c.to)), [('returnAt', '2026-12-13T20:30', '2026-12-15T18:00'), ('priceCents', '4500', '5400')]);
  });

  testWidgets('rien sans mail lié', (tester) async {
    locator.registerSingleton<LinkedEmailsDataSource>(FakeLinkedEmails(const []));
    await show(tester);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('linked-emails')), findsNothing);
  });

  testWidgets('les mails avec leur rôle ; un toucher ouvre le mail, son texte ou qu’il est effacé', (tester) async {
    final source = FakeLinkedEmails([
      LinkedEmailModel(
        id: 'm1',
        role: 'created',
        status: 'imported',
        receivedAt: DateTime.utc(2026, 10, 12, 6, 31),
        subject: 'Confirmation de votre réservation AL-482913',
        fromAddress: 'info@allopark.com',
        provider: 'Allopark',
        textBody: 'Bonjour Léa, votre réservation est confirmée.',
      ),
      LinkedEmailModel(
        id: 'm2',
        role: 'change',
        status: 'imported',
        receivedAt: DateTime.utc(2026, 10, 14, 17, 2),
        subject: 'Modification AL-482913',
        provider: 'Allopark',
        changes: const [(field: 'returnAt', from: '2026-12-13T20:30', to: '2026-12-15T18:00')],
      ),
    ]);
    locator.registerSingleton<LinkedEmailsDataSource>(source);
    await show(tester);
    await tester.pumpAndSettle();
    expect(source.asked, ['r1']);
    expect(find.text('MAILS LIÉS · 2'), findsOneWidget);
    expect(find.text("À l'origine"), findsOneWidget);
    expect(find.text('Modification'), findsOneWidget);

    await tester.tap(find.byKey(const Key('linked-email-m1')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('linked-email-sheet')), findsOneWidget);
    expect(find.text('Bonjour Léa, votre réservation est confirmée.'), findsOneWidget);
    expect(find.text('Reconnu : Allopark'), findsOneWidget);
    await tester.tap(find.byTooltip('Fermer'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('linked-email-m2')));
    await tester.pumpAndSettle();
    expect(find.text('Texte effacé 30 jours après la réception.'), findsOneWidget);
    expect(find.text('Date de retour : 2026-12-13 20:30 → 2026-12-15 18:00'), findsOneWidget);
  });
}
