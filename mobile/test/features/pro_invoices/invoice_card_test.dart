import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/pro_invoices/data/invoice_data_source.dart';
import 'package:parking_app/src/features/pro_invoices/presentation/invoice_card.dart';

import '../../helpers/pump_app.dart';

InvoiceModel _invoice({
  String kind = 'invoice',
  String number = 'F-2026-0042',
  int total = 5400,
  String? creditOf,
  String? creditedBy,
  String? email,
}) => InvoiceModel(
  id: number,
  kind: kind,
  number: number,
  issuedAt: DateTime.utc(2026, 11, 19, 10, 42),
  totalTtcCents: total,
  customerEmail: email,
  creditOf: creditOf,
  creditedBy: creditedBy,
);

class FakeInvoices implements InvoiceDataSource {
  FakeInvoices(this.current);
  ReservationInvoicesModel current;
  final sentTo = <String?>[];

  @override
  Future<ReservationInvoicesModel> fetch(String reservationId) async => current;

  @override
  Future<ReservationInvoicesModel> create(String reservationId, {String? customerCompany}) async =>
      current = ReservationInvoicesModel(canCreate: false, refusal: 'invoice_exists', invoices: [_invoice()]);

  @override
  Future<String> send(String invoiceId, {String? email}) async {
    sentTo.add(email);
    return email ?? 'julie@example.fr';
  }

  @override
  Future<ReservationInvoicesModel> creditNote(String invoiceId) async => current = ReservationInvoicesModel(
    canCreate: true,
    invoices: [
      _invoice(kind: 'credit_note', number: 'A-2026-0001', total: -5400, creditOf: 'F-2026-0042'),
      _invoice(creditedBy: 'A-2026-0001'),
    ],
  );

  @override
  Future<Uint8List> pdf(String invoiceId) async => Uint8List(0);
}

/// « Facture » (06/11/2026, « une facture au nom du parking avec son logo », direction A) on a booking's sheet in Plazo Pro.
void main() {
  setUpAll(setUpLocalizedTests);
  tearDown(() {
    if (locator.isRegistered<InvoiceDataSource>()) locator.unregister<InvoiceDataSource>();
  });

  Future<void> show(WidgetTester tester) => pumpLocalized(
    tester,
    const Scaffold(
      body: SingleChildScrollView(child: InvoiceCard(reservationId: 'r1')),
    ),
  );

  test('le modèle se lit depuis le JSON du serveur', () {
    final m = ReservationInvoicesModel.fromJson({
      'canCreate': false,
      'refusal': 'invoice_exists',
      'customerEmail': 'julie@example.fr',
      'invoices': [
        {
          'id': 'i1',
          'kind': 'invoice',
          'number': 'F-2026-0042',
          'issuedAt': '2026-11-19T10:42:00.000Z',
          'totalTtcCents': 5400,
          'customer': {'name': 'Julie Martin', 'email': 'julie@example.fr'},
          'sentAt': null,
          'sentTo': null,
          'creditOf': null,
          'creditedBy': null,
        },
      ],
    });
    expect(m.invoices.single.number, 'F-2026-0042');
    expect(m.invoices.single.customerEmail, 'julie@example.fr');
    expect(m.refusal, 'invoice_exists');
  });

  testWidgets('crée la facture, l’envoie à une adresse saisie et l’annule par un avoir', (tester) async {
    final fake = FakeInvoices(const ReservationInvoicesModel(canCreate: true));
    locator.registerSingleton<InvoiceDataSource>(fake);
    await show(tester);
    await tester.tap(find.byKey(const Key('invoice-create')));
    await tester.pumpAndSettle();
    expect(find.text('Facture F-2026-0042 créée.'), findsOneWidget);
    expect(find.byKey(const Key('invoice-create')), findsNothing);

    // No address on the booking: one is asked.
    await tester.tap(find.byKey(const Key('invoice-send-F-2026-0042')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('invoice-email')), 'julie@example.fr');
    await tester.tap(find.byKey(const Key('invoice-email-send')));
    await tester.pumpAndSettle();
    expect(fake.sentTo, ['julie@example.fr']);

    await tester.tap(find.byKey(const Key('invoice-credit-F-2026-0042')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('invoice-credit-confirm')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('invoice-A-2026-0001')), findsOneWidget);
    expect(find.byKey(const Key('invoice-credit-F-2026-0042')), findsNothing);
    expect(find.byKey(const Key('invoice-create')), findsOneWidget);
  });

  testWidgets('dit pourquoi une facture ne peut pas être créée', (tester) async {
    locator.registerSingleton<InvoiceDataSource>(FakeInvoices(const ReservationInvoicesModel(canCreate: false, refusal: 'billing_incomplete')));
    await show(tester);
    expect(find.byKey(const Key('invoice-refusal')), findsOneWidget);
    expect(find.textContaining('informations de facturation'), findsOneWidget);
    expect(find.byKey(const Key('invoice-create')), findsNothing);
  });
}
