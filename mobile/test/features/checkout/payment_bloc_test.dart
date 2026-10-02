import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/booking_actions_use_cases.dart';
import 'package:parking_app/src/features/booking/domain/usecases/get_booking_use_case.dart';
import 'package:parking_app/src/features/checkout/domain/booking_draft.dart';
import 'package:parking_app/src/features/checkout/presentation/bloc/payment_bloc.dart';
import 'package:parking_app/src/features/checkout/presentation/pages/payment_page.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/repositories/public_repository.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/services/payment_sheet_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

PublicBookingModel held({int seconds = 1785}) => booking(
  status: 'pending_payment',
  paymentMode: 'online',
  payment: BookingPaymentModel(status: 'pending', holdExpiresAt: '2026-10-02T12:30:00.000Z', holdSecondsLeft: seconds),
  canCancel: false,
  canEditFlight: false,
);

final paid = booking(paymentMode: 'online', payment: const BookingPaymentModel(status: 'paid'));
final expired = booking(status: 'cancelled', paymentMode: 'online', payment: const BookingPaymentModel(status: 'expired'));

void main() {
  setUpAll(setUpLocalizedTests);

  late InMemorySecureStorageService storage;
  late FakeBookingDataSource api;
  late FakePublicDataSource public;
  late FakePaymentSheet sheet;
  late FakeLinks links;
  late BookingDraftStore drafts;

  setUp(() async {
    storage = InMemorySecureStorageService();
    await storage.saveBookingToken('R7KQ2M', 'token');
    api = FakeBookingDataSource(storage);
    public = FakePublicDataSource();
    sheet = FakePaymentSheet();
    links = FakeLinks();
    drafts = BookingDraftStore()..save(const BookingDraft(customerName: 'Camille Martin'));
  });

  PaymentBloc make() {
    final repo = BookingRepositoryImpl(api);
    return PaymentBloc(
      GetBookingUseCase(repo),
      GetPaymentsConfigUseCase(PublicRepositoryImpl(public)),
      CreatePaymentIntentUseCase(repo),
      CheckoutUseCase(repo),
      ReleaseHoldUseCase(repo),
      sheet,
      links,
      drafts,
      reference: 'r7kq2m',
      pollInterval: Duration.zero,
      pollAttempts: 3,
      tick: const Duration(hours: 1),
    );
  }

  Future<PaymentBloc> ready() async {
    final bloc = make()..add(const PaymentStarted());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.ready);
    return bloc;
  }

  test('prêt : récapitulatif, compte à rebours de l’API, réglages de la feuille', () async {
    api.answer('get', held());
    final bloc = await ready();
    expect(bloc.state.secondsLeft, 1785);
    expect(bloc.state.config?.publishableKey, 'pk_test_1');
    expect(bloc.state.sheetAvailable(sheet), isTrue);
    bloc.add(const PaymentTicked());
    expect((await bloc.stream.first).secondsLeft, 1784);
    await bloc.close();
  });

  test('feuille réussie : PaymentIntent de l’API, feuille, vérification jusqu’à « upcoming », brouillon oublié', () async {
    api
      ..answer('get', held())
      ..answer('get', held())
      ..answer('get', paid);
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    final states = await bloc.stream.takeWhile((s) => s.status != PaymentStatus.paid).map((s) => s.status).toList();
    expect(states, containsAllInOrder([PaymentStatus.presenting, PaymentStatus.verifying]));
    expect(bloc.state.status, PaymentStatus.paid);
    expect(sheet.presented, ['pi_1_secret']);
    expect(api.calls.where((c) => c == 'intent'), hasLength(1));
    expect(drafts.draft, isNull);
    await bloc.close();
  });

  test('feuille fermée : « Paiement annulé », la place reste tenue', () async {
    api.answer('get', held());
    sheet.outcome = const PaymentSheetOutcome(PaymentSheetResult.canceled);
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    final s = await bloc.stream.firstWhere((s) => s.notice != null);
    expect((s.status, s.notice, s.busy), (PaymentStatus.ready, PaymentNotice.canceled, false));
    await bloc.close();
  });

  test('carte refusée : message de Stripe, on peut réessayer', () async {
    api.answer('get', held());
    sheet.outcome = const PaymentSheetOutcome(PaymentSheetResult.failed, message: 'Votre carte a été refusée.');
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    final s = await bloc.stream.firstWhere((s) => s.notice != null);
    expect((s.status, s.notice, s.message), (PaymentStatus.ready, PaymentNotice.failed, 'Votre carte a été refusée.'));
    await bloc.close();
  });

  test('délai dépassé : 409 hold_expired, puis la réservation se lit « expirée »', () async {
    api
      ..answer('get', held())
      ..answer('get', expired)
      ..answer('intent', const ApiError('hold_expired'));
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.expired);
    expect(sheet.presented, isEmpty);
    // "Recommencer": the hold is released, the form opens again (draft kept).
    bloc.add(const PaymentEditPressed());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.released);
    expect(api.calls, contains('release'));
    expect(drafts.draft?.customerName, 'Camille Martin');
    await bloc.close();
  });

  test('compte à rebours à zéro : relu, « Le délai est dépassé »', () async {
    api
      ..answer('get', held(seconds: 1))
      ..answer('get', expired);
    final bloc = await ready();
    bloc.add(const PaymentTicked());
    expect((await bloc.stream.firstWhere((s) => s.status == PaymentStatus.expired)).secondsLeft, isNull);
    await bloc.close();
  });

  test('déjà payée (paid: true) : vérification sans feuille', () async {
    api
      ..answer('get', held())
      ..answer('get', paid)
      ..answer('intent', const PaymentIntentModel(paid: true));
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.paid);
    expect(sheet.presented, isEmpty);
    await bloc.close();
  });

  test('version web (pas de feuille) : la page Stripe Checkout, dans le même onglet', () async {
    api.answer('get', held());
    sheet.supported = false;
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.redirecting);
    await Future<void>.delayed(Duration.zero);
    expect(links.redirected.single.toString(), 'https://checkout.stripe.test/c/pay/cs_1');
    expect(api.calls, isNot(contains('intent')));
    await bloc.close();
  });

  test('sans clé publiable sur le serveur : Checkout aussi', () async {
    api.answer('get', held());
    public.config = const PaymentsConfigModel(payments: 'online');
    final bloc = await ready();
    expect(bloc.state.sheetAvailable(sheet), isFalse);
    bloc.add(const PaymentPayPressed());
    await bloc.stream.firstWhere((s) => s.status == PaymentStatus.redirecting);
    await bloc.close();
  });

  test('paiement désactivé côté serveur entre-temps : message traduit, rien n’est ouvert', () async {
    api
      ..answer('get', held())
      ..answer('intent', const ApiError('online_booking_unavailable'));
    public.config = const PaymentsConfigModel(payments: 'on_site', publishableKey: 'pk_test_1');
    final bloc = await ready();
    bloc.add(const PaymentPayPressed());
    final s = await bloc.stream.firstWhere((s) => s.message != null);
    expect(s.status, PaymentStatus.ready);
    expect(sheet.presented, isEmpty);
    await bloc.close();
  });

  test('une réservation payée sur place n’a rien à payer ici', () async {
    api.answer('get', booking());
    final bloc = make()..add(const PaymentStarted());
    expect((await bloc.stream.firstWhere((s) => s.status != PaymentStatus.loading)).status, PaymentStatus.paid);
    await bloc.close();
  });

  group('écran « Paiement »', () {
    setUp(() => locator.registerSingleton<PaymentSheetService>(sheet));
    tearDown(locator.reset);

    testWidgets('récapitulatif, « Votre place est réservée pendant 29:45 », « Payer 45,00 € »', (tester) async {
      api.answer('get', held());
      final bloc = make();
      await pumpLocalized(tester, BlocProvider.value(value: bloc, child: const PaymentView()));
      bloc.add(const PaymentStarted());
      await tester.pump();
      await tester.pump();
      expect(find.text('2 · Paiement'), findsOneWidget);
      expect(find.text('Récapitulatif'), findsOneWidget);
      expect(find.text('AB-123-CD'), findsOneWidget);
      expect(find.bySemanticsLabel('Votre place est réservée pendant 29:45'), findsOneWidget);
      expect(find.text('Payer 45,00 €'), findsOneWidget);
      expect(find.text('Paiement sécurisé par Stripe · carte, Apple Pay ou Google Pay'), findsOneWidget);

      sheet.outcome = const PaymentSheetOutcome(PaymentSheetResult.canceled);
      await tester.tap(find.byKey(const Key('payment-pay')));
      for (var i = 0; i < 5; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }
      expect(find.text('Paiement annulé : rien n\'a été débité. Votre place reste réservée.'), findsOneWidget);
      // Stops the countdown's timer before the test ends.
      unawaited(bloc.close());
      await tester.pump();
    });

    testWidgets('délai dépassé : « Recommencer la réservation »', (tester) async {
      api.answer('get', expired);
      final bloc = make()..add(const PaymentStarted());
      addTearDown(bloc.close);
      await pumpLocalized(tester, BlocProvider.value(value: bloc, child: const PaymentView()));
      await tester.pumpAndSettle();
      expect(find.text('Le délai est dépassé'), findsOneWidget);
      expect(find.text('Recommencer la réservation'), findsOneWidget);
    });
  });

  test('formatCountdown', () {
    expect(formatCountdown(1785), '29:45');
    expect(formatCountdown(-3), '00:00');
  });
}
