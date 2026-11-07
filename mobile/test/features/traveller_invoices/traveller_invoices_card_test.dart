import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/traveller_invoices/traveller_invoices_card.dart';
import 'package:parking_app/src/features/traveller_invoices/traveller_invoices_data_source.dart';

import '../../helpers/pump_app.dart';

TravellerInvoiceModel _invoice({String kind = 'invoice', String number = 'F-2026-0042', int total = 5400, String? creditOf, String? creditedBy}) =>
    TravellerInvoiceModel(
      id: number,
      kind: kind,
      number: number,
      issuedAt: DateTime.utc(2026, 11, 19, 10, 42),
      totalTtcCents: total,
      issuer: 'Parking des Cèdres',
      creditOf: creditOf,
      creditedBy: creditedBy,
    );

class FakeTravellerInvoices implements TravellerInvoicesDataSource {
  FakeTravellerInvoices(this.current);
  TravellerInvoicesModel current;
  final asked = <(String?, String?)>[];

  @override
  Future<TravellerInvoicesModel> fetch(String reference) async => current;

  @override
  Future<TravellerInvoicesModel> request(String reference, {String? company, String? address}) async {
    asked.add((company, address));
    return current = TravellerInvoicesModel(
      request: InvoiceRequestModel(at: DateTime.utc(2026, 11, 19, 17, 20), company: company),
      refusal: 'already_requested',
    );
  }

  @override
  Future<Uint8List> pdf(String reference, String invoiceId) async => Uint8List(0);
}

/// « Facture » on Ma réservation (07/11/2026, « Le client peut retrouver ses factures dans Plazo », A + C).
void main() {
  setUpAll(setUpLocalizedTests);
  tearDown(() {
    if (locator.isRegistered<TravellerInvoicesDataSource>()) locator.unregister<TravellerInvoicesDataSource>();
  });

  Future<void> show(WidgetTester tester) => pumpLocalized(
    tester,
    const Scaffold(
      body: SingleChildScrollView(child: TravellerInvoicesCard(reference: 'R7KQ2M')),
    ),
  );

  test('le modèle se lit depuis le JSON du serveur', () {
    final m = TravellerInvoicesModel.fromJson({
      'invoices': [
        {
          'id': 'i1',
          'kind': 'invoice',
          'number': 'F-2026-0042',
          'issuedAt': '2026-11-19T10:42:00Z',
          'totalTtcCents': 5400,
          'issuer': 'Parking des Cèdres',
        },
      ],
      'request': null,
      'canRequest': false,
      'refusal': 'invoice_exists',
    });
    expect(m.invoices.single.fileName, 'Facture-F-2026-0042.pdf');
    expect(m.empty, isFalse);
    expect(TravellerInvoicesModel.fromJson({'canRequest': false, 'refusal': 'reservation_cancelled'}).empty, isTrue);
  });

  testWidgets('sans facture, le voyageur la demande avec sa société, puis voit « Demandée »', (tester) async {
    final fake = FakeTravellerInvoices(const TravellerInvoicesModel(canRequest: true));
    locator.registerSingleton<TravellerInvoicesDataSource>(fake);
    await show(tester);
    await tester.pumpAndSettle();
    expect(find.text('Pas encore de facture pour ce séjour.'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('traveller-invoice-company')), 'ACME SARL');
    await tester.tap(find.byKey(const Key('traveller-invoice-request')));
    await tester.pumpAndSettle();
    expect(fake.asked, [('ACME SARL', '')]);
    expect(find.byKey(const Key('traveller-invoice-requested')), findsOneWidget);
    expect(find.textContaining('Demandée le 19 novembre 2026'), findsOneWidget);
    expect(find.byKey(const Key('traveller-invoice-request')), findsNothing);
  });

  testWidgets('la facture et son avoir, chacun à ouvrir', (tester) async {
    locator.registerSingleton<TravellerInvoicesDataSource>(
      FakeTravellerInvoices(
        TravellerInvoicesModel(
          canRequest: true,
          invoices: [
            _invoice(kind: 'credit_note', number: 'A-2026-0001', total: -5400, creditOf: 'F-2026-0042'),
            _invoice(creditedBy: 'A-2026-0001'),
          ],
        ),
      ),
    );
    await show(tester);
    await tester.pumpAndSettle();
    expect(find.text('Facture F-2026-0042'), findsOneWidget);
    expect(find.textContaining("annulée par l'avoir A-2026-0001"), findsOneWidget);
    expect(find.textContaining('annule la facture F-2026-0042'), findsOneWidget);
    expect(find.byKey(const Key('traveller-invoice-open-F-2026-0042')), findsOneWidget);
    expect(find.byKey(const Key('traveller-invoice-open-A-2026-0001')), findsOneWidget);
  });

  testWidgets('rien à montrer ni à demander : le bloc reste caché', (tester) async {
    locator.registerSingleton<TravellerInvoicesDataSource>(FakeTravellerInvoices(const TravellerInvoicesModel(refusal: 'reservation_cancelled')));
    await show(tester);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('traveller-invoices-card')), findsNothing);
  });
}
