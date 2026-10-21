import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/di/locator.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/extras/data/models/extras_models.dart';
import 'package:parking_app/src/features/extras/domain/repositories/extras_repository.dart';
import 'package:parking_app/src/features/extras/domain/usecases/extras_use_cases.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/extra_settings_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/staff_extras_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/bloc/traveller_extras_bloc.dart';
import 'package:parking_app/src/features/extras/presentation/widgets/extra_settings_section.dart';
import 'package:parking_app/src/features/extras/presentation/widgets/staff_extras_card.dart';
import 'package:parking_app/src/features/extras/presentation/widgets/traveller_extras_card.dart';
import 'package:parking_app/src/features/search/data/models/public_models.dart';
import 'package:parking_app/src/features/search/domain/usecases/public_use_cases.dart';
import 'package:parking_app/src/services/payment_sheet_service.dart';

import '../../helpers/fakes.dart';
import '../../helpers/pump_app.dart';

/// Services for the car (21/10/2026): the traveller orders and pays, the team marks done or not possible.

const _wash = ExtraOfferModel(kind: 'interior_wash', label: 'Lavage intérieur et shampouineuse', description: 'Aspiration', priceCents: 5000);
const _hybrid = ExtraOfferModel(kind: 'hybrid_charge', label: 'Recharge hybride', priceCents: 1500, available: false, reason: 'one_charge');
const _ev = ExtraOfferModel(kind: 'ev_charge', label: 'Recharge électrique', priceCents: 3000);

class FakeExtrasRepository implements ExtrasRepository {
  TravellerExtrasModel view = TravellerExtrasModel(
    offers: const [_wash, _hybrid, _ev],
    orderUntil: DateTime.utc(2026, 10, 29, 16, 40),
    canOrder: true,
  );
  ExtraPaymentModel payment = const ExtraPaymentModel(clientSecret: 'pi_1_secret', paymentIntentId: 'pi_1', amountCents: 5000);
  StaffExtrasModel staffView = const StaffExtrasModel(
    extras: [ExtraOrderModel(id: 'x1', kind: 'ev_charge', label: 'Recharge électrique', priceCents: 3000, status: 'ordered')],
  );
  Failure? orderFailure;
  final calls = <String>[];
  ExtraSettingsModel settingsView = const ExtraSettingsModel(
    leadHours: 24,
    offers: [
      ExtraSettingModel(kind: 'interior_wash', label: 'Lavage intérieur et shampouineuse', priceCents: 5000),
      ExtraSettingModel(kind: 'hybrid_charge', label: 'Recharge hybride', priceCents: 1500),
      ExtraSettingModel(kind: 'ev_charge', label: 'Recharge électrique', priceCents: 3000),
    ],
  );
  ExtraSettingsModel? saved;
  int? savedLead;

  ExtraOrderModel _order(String kind, String status) =>
      ExtraOrderModel(id: 'x-$kind', kind: kind, label: kind == 'interior_wash' ? _wash.label : _ev.label, priceCents: 5000, status: status);

  @override
  Future<Either<Failure, TravellerExtrasModel>> traveller(String reference) async {
    calls.add('load');
    return Right(view);
  }

  @override
  Future<Either<Failure, ExtraOrderResponseModel>> order(String reference, String kind) async {
    calls.add('order:$kind');
    if (orderFailure != null) return Left(orderFailure!);
    return Right(ExtraOrderResponseModel(extra: _order(kind, 'pending_payment'), payment: payment));
  }

  @override
  Future<Either<Failure, TravellerExtrasModel>> sync(String reference, String extraId) async {
    calls.add('sync:$extraId');
    view = view.copyWith(orders: [_order('interior_wash', 'ordered')], offers: view.offers.where((o) => o.kind != 'interior_wash').toList());
    return Right(view);
  }

  @override
  Future<Either<Failure, TravellerExtrasModel>> abandon(String reference, String extraId) async {
    calls.add('abandon:$extraId');
    return Right(view);
  }

  @override
  Future<Either<Failure, StaffExtrasModel>> staff(String reservationId) async => Right(staffView);

  @override
  Future<Either<Failure, StaffExtrasModel>> done(String reservationId, String extraId) async {
    calls.add('done:$extraId');
    staffView = StaffExtrasModel(
      extras: [staffView.extras.first.copyWith(status: 'done', doneAt: DateTime.utc(2026, 10, 29, 13, 12), doneBy: 'Karim')],
    );
    return Right(staffView);
  }

  @override
  Future<Either<Failure, StaffExtrasModel>> refuse(String reservationId, String extraId, String? reason) async {
    calls.add('refuse:$extraId:$reason');
    staffView = StaffExtrasModel(
      extras: [staffView.extras.first.copyWith(status: 'refused', refusedReason: reason)],
    );
    return Right(staffView);
  }

  @override
  Future<Either<Failure, ExtraSettingsModel>> settings(String parkingId) async => Right(settingsView);

  @override
  Future<Either<Failure, ExtraSettingsModel>> updateSettings(String parkingId, {int? leadHours, List<ExtraSettingModel>? offers}) async {
    savedLead = leadHours;
    saved = settingsView.copyWith(leadHours: leadHours ?? 24, offers: offers ?? settingsView.offers);
    settingsView = saved!;
    return Right(saved!);
  }
}

class FakeConfig implements GetPaymentsConfigUseCase {
  @override
  Future<Either<Failure, PaymentsConfigModel>> call(params) async =>
      const Right(PaymentsConfigModel(payments: 'online', publishableKey: 'pk_test_1'));
}

void main() {
  setUpAll(setUpLocalizedTests);

  late FakeExtrasRepository repo;
  late FakePaymentSheet sheet;

  setUp(() {
    repo = FakeExtrasRepository();
    sheet = FakePaymentSheet();
    locator
      ..registerFactory(() => TravellerExtrasBloc(TravellerExtrasUseCases(repo), FakeConfig(), sheet))
      ..registerFactory(() => StaffExtrasBloc(StaffExtrasUseCases(repo)))
      ..registerFactory(() => ExtraSettingsBloc(ExtraSettingsUseCases(repo)));
  });
  tearDown(locator.reset);

  group('Plazo · Services additionnels', () {
    testWidgets('montre les offres, la raison d’une offre indisponible et la date limite', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: TravellerExtrasCard(reference: 'PLZ7K2')),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Services additionnels'), findsOneWidget);
      expect(find.text('Lavage intérieur et shampouineuse'), findsOneWidget);
      expect(find.text('Une seule recharge par voiture'), findsOneWidget);
      expect(find.textContaining('À commander au plus tard le'), findsOneWidget);
      final hybrid = tester.widget<OutlinedButton>(find.byKey(const Key('extra-add-hybrid_charge')));
      expect(hybrid.onPressed, isNull);
    });

    testWidgets('Ajouter → récapitulatif → feuille de paiement → commandé', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: TravellerExtrasCard(reference: 'PLZ7K2')),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-add-interior_wash')));
      await tester.pumpAndSettle();
      expect(find.text('Remboursé en entier si l\'équipe ne peut pas le faire.'), findsOneWidget);
      expect(find.textContaining('Payer 50,00'), findsOneWidget);
      await tester.tap(find.byKey(const Key('extra-pay')));
      await tester.pumpAndSettle();
      expect(sheet.presented, ['pi_1_secret']);
      expect(repo.calls, containsAllInOrder(['order:interior_wash', 'sync:x-interior_wash']));
      expect(find.text('Commandé'), findsOneWidget);
      expect(find.textContaining('Service commandé'), findsOneWidget);
    });

    testWidgets('feuille fermée : la commande est abandonnée, rien n’est débité', (tester) async {
      sheet.outcome = const PaymentSheetOutcome(PaymentSheetResult.canceled);
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: TravellerExtrasCard(reference: 'PLZ7K2')),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-add-ev_charge')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-pay')));
      await tester.pumpAndSettle();
      expect(repo.calls, contains('abandon:x-ev_charge'));
      expect(find.text('Paiement annulé : rien n\'a été débité.'), findsOneWidget);
    });

    testWidgets('trop tard : le refus du serveur est traduit', (tester) async {
      repo.orderFailure = const ServerFailure(code: 'too_late', statusCode: 409);
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: TravellerExtrasCard(reference: 'PLZ7K2')),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-add-interior_wash')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-pay')));
      await tester.pumpAndSettle();
      expect(sheet.presented, isEmpty);
      expect(find.text('Trop tard : le retour est trop proche pour ce service.'), findsOneWidget);
    });

    testWidgets('rien de proposé ni commandé : la carte est cachée', (tester) async {
      repo.view = const TravellerExtrasModel();
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: TravellerExtrasCard(reference: 'PLZ7K2')),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('traveller-extras')), findsNothing);
    });
  });

  group('Plazo Pro · Services commandés', () {
    testWidgets('« Fait » puis l’heure et le prénom', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: StaffExtrasCard(reservationId: 'r1', canAct: true)),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('À faire'), findsOneWidget);
      await tester.tap(find.byKey(const Key('extra-done-ev_charge')));
      await tester.pumpAndSettle();
      expect(repo.calls, ['done:x1']);
      expect(find.text('Fait'), findsOneWidget);
      expect(find.textContaining('Karim'), findsOneWidget);
    });

    testWidgets('« Pas possible » demande une raison puis rembourse', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: StaffExtrasCard(reservationId: 'r1', canAct: true)),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-refuse-ev_charge')));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('extra-refuse-reason')), 'Borne en panne');
      await tester.tap(find.byKey(const Key('extra-refuse-confirm')));
      await tester.pumpAndSettle();
      expect(repo.calls, ['refuse:x1:Borne en panne']);
      expect(find.text('Pas possible'), findsWidgets);
    });

    testWidgets('sans le droit : pas de bouton', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: StaffExtrasCard(reservationId: 'r1', canAct: false)),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('extra-done-ev_charge')), findsNothing);
    });

    testWidgets('réglages : active un service, change son prix et le délai', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: ExtraSettingsSection(parkingId: 'p1')),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('extra-enabled-ev_charge')));
      await tester.enterText(find.byKey(const Key('extra-price-ev_charge')), '35,50');
      await tester.enterText(find.byKey(const Key('extra-lead')), '12');
      await tester.ensureVisible(find.byKey(const Key('extra-settings-save')));
      await tester.tap(find.byKey(const Key('extra-settings-save')));
      await tester.pumpAndSettle();
      expect(repo.savedLead, 12);
      final ev = repo.saved!.offers.firstWhere((o) => o.kind == 'ev_charge');
      expect((ev.enabled, ev.priceCents), (true, 3550));
      expect(find.text('Services enregistrés.'), findsOneWidget);
    });

    testWidgets('réglages : un montant invalide n’est pas envoyé', (tester) async {
      await pumpLocalized(
        tester,
        const Scaffold(
          body: SingleChildScrollView(child: ExtraSettingsSection(parkingId: 'p1')),
        ),
      );
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('extra-price-interior_wash')), '50,123');
      await tester.ensureVisible(find.byKey(const Key('extra-settings-save')));
      await tester.tap(find.byKey(const Key('extra-settings-save')));
      await tester.pumpAndSettle();
      expect(repo.saved, isNull);
      expect(find.text('Montant invalide (ex. 50,00).'), findsOneWidget);
    });
  });

  test('montants', () {
    expect(parseEurosToCents('50,00'), 5000);
    expect(parseEurosToCents('15'), 1500);
    expect(parseEurosToCents('abc'), isNull);
    expect(centsToEurosField(3550), '35,50');
    expect(const ParkingExtrasModel().leadHours, 24);
    expect(
      ParkingExtrasModel.fromJson({
        'offers': [
          {'kind': 'ev_charge', 'label': 'Recharge électrique', 'description': 'x', 'priceCents': 3000},
        ],
        'leadHours': 12,
      }).offers.single.priceCents,
      3000,
    );
  });

  test('la réservation envoie les services cochés, et seulement eux', () {
    BookingInput input(List<String> extras) => BookingInput(
      airport: 'lyon-saint-exupery',
      parking: 'parking-demo',
      arrivalAt: '2026-10-26T06:30',
      returnAt: '2026-10-28T15:05',
      customerFirstName: 'Camille',
      customerLastName: 'Martin',
      customerPhone: '06 12 34 56 78',
      customerEmail: 'camille@example.com',
      plate: 'GK-318-PX',
      passengers: 2,
      acceptTerms: true,
      extras: extras,
    );
    expect(input(['interior_wash', 'ev_charge']).toJson()['extras'], ['interior_wash', 'ev_charge']);
    expect(input(const []).toJson().containsKey('extras'), isFalse);
  });
}
