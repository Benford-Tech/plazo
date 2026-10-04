import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/domain/usecases/reservations_use_cases.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_import_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_form_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservations_bloc.dart';

class MockList extends Mock implements ListReservationsUseCase {}

class MockGet extends Mock implements GetReservationUseCase {}

class MockSave extends Mock implements SaveReservationUseCase {}

class MockStatus extends Mock implements ChangeReservationStatusUseCase {}

class MockParse extends Mock implements ParseEmailUseCase {}

class MockCapacity extends Mock implements PreviewCapacityUseCase {}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 2));

final booking = ReservationModel(
  id: 'r1',
  reference: 'RABC12',
  channel: 'phone',
  status: 'upcoming',
  arrivalAt: DateTime.utc(2026, 10, 5, 4, 30),
  returnAt: DateTime.utc(2026, 10, 12, 16),
  passengers: 2,
  customerName: 'Mme Laurent',
  customerPhone: '06 12 34 56 78',
  plate: 'GK-318-PX',
);

void main() {
  setUpAll(() {
    registerFallbackValue(const ListReservationsParams());
    registerFallbackValue(const SaveReservationParams(input: ReservationInput(arrivalAt: '', returnAt: '')));
    registerFallbackValue(const ChangeStatusParams(id: '', status: ''));
    registerFallbackValue(const CapacityParams(arrivalAt: '', returnAt: ''));
  });

  group('liste', () {
    late MockList list;
    setUp(() => list = MockList());

    test('charge, recherche, et page suivante', () async {
      when(() => list(const ListReservationsParams())).thenAnswer((_) async => Right(ReservationPageModel(docs: [booking], totalDocs: 21, hasNextPage: true)));
      when(() => list(const ListReservationsParams(page: 2))).thenAnswer((_) async => Right(ReservationPageModel(docs: [booking.copyWith(id: 'r2')], totalDocs: 21, page: 2)));
      when(() => list(const ListReservationsParams(query: 'GK 318'))).thenAnswer((_) async => Right(ReservationPageModel(docs: [booking], totalDocs: 1)));
      final b = ProReservationsBloc(list)..add(const ProReservationsStarted());
      await settle();
      expect(b.state.viewState, ViewState.success);
      expect(b.state.total, 21);
      b.add(const ProReservationsMoreRequested());
      await settle();
      expect(b.state.items.map((r) => r.id), ['r1', 'r2']);
      expect(b.state.hasMore, isFalse);
      b.add(const ProReservationsSearched('GK 318'));
      await settle();
      expect(b.state.items, hasLength(1));
      b.add(ProReservationsUpdated(booking.copyWith(status: 'arrived')));
      await settle();
      expect(b.state.items.single.status, 'arrived');
    });
  });

  group('fiche', () {
    test('changement de statut, et erreur traduite', () async {
      final get = MockGet();
      final status = MockStatus();
      when(() => get('r1')).thenAnswer((_) async => Right(booking));
      when(() => status(const ChangeStatusParams(id: 'r1', status: 'arrived'))).thenAnswer((_) async => Right(booking.copyWith(status: 'arrived')));
      when(() => status(const ChangeStatusParams(id: 'r1', status: 'returned'))).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'invalid_transition')));
      final b = ProReservationBloc(get, status)..add(const ProReservationStarted('r1'));
      await settle();
      expect(b.state.reservation?.reference, 'RABC12');
      b.add(const ProReservationStatusChanged('arrived'));
      await settle();
      expect(b.state.reservation?.status, 'arrived');
      expect(b.state.notice, 'arrived');
      b.add(const ProReservationStatusChanged('returned'));
      await settle();
      expect(b.state.errorCode, 'invalid_transition');
      expect(statusTransitions['arrived'], contains('shuttled_out'));
    });
  });

  group('formulaire', () {
    test('vérifie la capacité quand le séjour change, bloque si complet, enregistre', () async {
      final save = MockSave();
      final capacity = MockCapacity();
      when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 7, fullNights: ['2026-10-06'], canForce: true)));
      when(() => save(any())).thenAnswer((_) async => Right(booking));
      final b = ProReservationFormBloc(save, capacity, initial: const ReservationInput(arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-12T18:00'));
      await settle();
      expect(b.state.capacity?.nights, 7);
      expect(b.state.full, isTrue);
      b.add(ProReservationFormChanged(b.state.input.copyWith(customerName: 'Mme Laurent', plate: 'GK-318-PX', customerPhone: '0612345678')));
      await settle();
      verify(() => capacity(any())).called(1); // same stay: no second check
      b.add(ProReservationFormChanged(b.state.input.copyWith(force: true)));
      await settle();
      expect(b.state.full, isFalse);
      b.add(const ProReservationFormSubmitted());
      await settle();
      final params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
      expect(params.id, isNull);
      expect(params.input.toBody(), containsPair('force', true));
      expect(params.input.toBody().containsKey('customerEmail'), isFalse);
      expect(b.state.saved?.reference, 'RABC12');
    });

    test('les erreurs de champs du serveur sont attachées au champ', () async {
      final save = MockSave();
      final capacity = MockCapacity();
      when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 1)));
      when(() => save(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation', fields: {'plate': 'invalid_plate'})));
      final b = ProReservationFormBloc(save, capacity, id: 'r1', initial: const ReservationInput(arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00'));
      await settle();
      b.add(const ProReservationFormSubmitted());
      await settle();
      expect(b.state.fieldErrors, {'plate': 'invalid_plate'});
      expect(b.state.errorCode, isNull);
    });
  });

  group('import', () {
    test('un mail lu devient les valeurs du formulaire ; un mail inconnu remonte son code', () async {
      final parse = MockParse();
      when(() => parse('bonjour')).thenAnswer((_) async => const Left(ServerFailure(statusCode: 422, code: 'unrecognised_email')));
      when(() => parse('mail allopark')).thenAnswer(
        (_) async => const Right(
          ParsedEmailModel(
            parsed: ParsedBookingModel(provider: 'Allopark', externalReference: 'AL-1', arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-12T18:00', customerName: 'M. Petit', plate: 'AB-123-CD', passengers: 3),
            missing: ['customerPhone'],
          ),
        ),
      );
      final b = ProImportBloc(parse)..add(const ProImportParsed('bonjour'));
      await settle();
      expect(b.state.errorCode, 'unrecognised_email');
      b.add(const ProImportParsed('mail allopark'));
      await settle();
      final input = b.state.input!;
      expect(input.channel, 'aggregator');
      expect(input.channelDetail, 'Allopark');
      expect(input.passengers, 3);
      expect(input.customerPhone, '');
      expect(input.externalReference, 'AL-1');
    });
  });
}
