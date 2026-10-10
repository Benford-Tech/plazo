import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/pro_reservations/data/models/reservation_models.dart';
import 'package:parking_app/src/features/pro_reservations/domain/usecases/reservations_use_cases.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservation_form_bloc.dart';
import 'package:parking_app/src/features/pro_reservations/presentation/bloc/pro_reservations_bloc.dart';

class MockList extends Mock implements ListReservationsUseCase {}

class MockGet extends Mock implements GetReservationUseCase {}

class MockSave extends Mock implements SaveReservationUseCase {}

class MockStatus extends Mock implements ChangeReservationStatusUseCase {}

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
  customerName: 'Camille Laurent',
  customerFirstName: 'Camille',
  customerLastName: 'Laurent',
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

  group('liste chronologique (10/10/2026)', () {
    test('ouvre sur aujourd’hui, ajoute les réservations précédentes en tête, range une nouvelle par arrivée', () async {
      final list = MockList();
      final today = booking.copyWith(id: 'today', arrivalAt: DateTime.utc(2026, 10, 10, 8));
      final later = booking.copyWith(id: 'later', arrivalAt: DateTime.utc(2026, 10, 14, 8));
      final before = booking.copyWith(id: 'before', arrivalAt: DateTime.utc(2026, 10, 3, 8));
      when(() => list(const ListReservationsParams())).thenAnswer((_) async => Right(ReservationPageModel(docs: [today, later], totalDocs: 3, hasPrevPage: true)));
      when(() => list(const ListReservationsParams(page: 0))).thenAnswer((_) async => Right(ReservationPageModel(docs: [before], totalDocs: 3, page: 0, hasNextPage: true)));
      final b = ProReservationsBloc(list)..add(const ProReservationsStarted());
      await settle();
      expect(b.state.items.map((r) => r.id), ['today', 'later']);
      expect(b.state.hasEarlier, isTrue);
      b.add(const ProReservationsEarlierRequested());
      await settle();
      expect(b.state.items.map((r) => r.id), ['before', 'today', 'later']);
      expect(b.state.firstPage, 0);
      expect(b.state.hasEarlier, isFalse);
      b.add(const ProReservationsEarlierRequested()); // nothing before: no call
      await settle();
      verify(() => list(const ListReservationsParams(page: 0))).called(1);
      // A booking made in the app takes its place by arrival.
      b.add(ProReservationsUpdated(booking.copyWith(id: 'new', arrivalAt: DateTime.utc(2026, 10, 12, 8))));
      await settle();
      expect(b.state.items.map((r) => r.id), ['before', 'today', 'new', 'later']);
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
      // The handover (C-B, 06/10/2026): the remark travels with the status.
      when(() => status(const ChangeStatusParams(id: 'r1', status: 'returned', note: 'Rayure aile avant'))).thenAnswer((_) async => Right(booking.copyWith(status: 'returned', keyHook: null)));
      b.add(const ProReservationStatusChanged('returned', note: 'Rayure aile avant'));
      await settle();
      expect(b.state.reservation?.status, 'returned');
      expect(b.state.reservation?.keyHook, isNull);
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
      b.add(ProReservationFormChanged(b.state.input.copyWith(customerFirstName: 'Camille', customerLastName: 'Laurent', plate: 'GK-318-PX', customerPhone: '0612345678')));
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
      // 09/10/2026: first and last name apart; the server builds "Camille Laurent".
      expect(params.names, isTrue);
      expect(params.input.toBody(), allOf(containsPair('customerFirstName', 'Camille'), containsPair('customerLastName', 'Laurent')));
      expect(params.input.toBody().containsKey('customerName'), isFalse);
      expect(b.state.saved?.reference, 'RABC12');
    });

    test('nouvelle réservation : un prénom ou un nom vide part quand même, pour que le serveur nomme le champ', () {
      const input = ReservationInput(arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00', customerFirstName: 'Camille');
      expect(input.toBody(), allOf(containsPair('customerFirstName', 'Camille'), containsPair('customerLastName', '')));
    });

    test('modification : le nom ne part que s’il a changé (un nom d’un seul mot reste enregistrable)', () async {
      final save = MockSave();
      final capacity = MockCapacity();
      when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 1)));
      when(() => save(any())).thenAnswer((_) async => Right(booking));
      // An imported booking, "Dupont" alone: stored as the first name, the last name empty.
      const initial = ReservationInput(arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00', customerFirstName: 'Dupont', plate: 'GK-318-PX');
      final b = ProReservationFormBloc(save, capacity, id: 'r1', initial: initial);
      await settle();
      b.add(ProReservationFormChanged(b.state.input.copyWith(plate: 'AB-123-CD')));
      await settle();
      b.add(const ProReservationFormSubmitted());
      await settle();
      var params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
      expect(params.names, isFalse);
      final unchanged = params.input.toBody(patch: true, names: params.names);
      expect(unchanged, containsPair('plate', 'AB-123-CD'));
      expect(unchanged.keys, isNot(anyOf(contains('customerFirstName'), contains('customerLastName'), contains('customerName'))));
      // Spaces around do not count as a change.
      b.add(ProReservationFormChanged(b.state.input.copyWith(customerFirstName: ' Dupont ')));
      await settle();
      b.add(const ProReservationFormSubmitted());
      await settle();
      params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
      expect(params.names, isFalse);
      // Corrected: both are sent.
      b.add(ProReservationFormChanged(b.state.input.copyWith(customerFirstName: 'Jean', customerLastName: 'Dupont')));
      await settle();
      b.add(const ProReservationFormSubmitted());
      await settle();
      params = verify(() => save(captureAny())).captured.single as SaveReservationParams;
      expect(params.names, isTrue);
      expect(params.input.toBody(patch: true, names: params.names), allOf(containsPair('customerFirstName', 'Jean'), containsPair('customerLastName', 'Dupont')));
    });

    test('le serveur refuse un nom vide : l’erreur va sous « Nom »', () async {
      final save = MockSave();
      final capacity = MockCapacity();
      when(() => capacity(any())).thenAnswer((_) async => const Right(CapacityPreviewModel(nights: 1)));
      when(() => save(any())).thenAnswer((_) async => const Left(ServerFailure(statusCode: 400, code: 'validation_failed', fields: {'customerLastName': 'required'})));
      final b = ProReservationFormBloc(save, capacity, initial: const ReservationInput(arrivalAt: '2026-10-05T06:30', returnAt: '2026-10-06T18:00', customerFirstName: 'Camille'));
      await settle();
      b.add(const ProReservationFormSubmitted());
      await settle();
      expect(b.state.fieldErrors, {'customerLastName': 'required'});
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

}
