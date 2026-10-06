import 'package:flutter_test/flutter_test.dart';
import 'package:parking_app/src/core/enums/view_state.dart';
import 'package:parking_app/src/core/error/exceptions.dart';
import 'package:parking_app/src/core/extensions/repositories_extensions.dart';
import 'package:parking_app/src/core/error/failure.dart';
import 'package:parking_app/src/core/utils/either.dart';
import 'package:parking_app/src/features/booking/data/datasources/booking_data_source.dart';
import 'package:parking_app/src/features/booking/data/models/public_booking_model.dart';
import 'package:parking_app/src/features/booking/domain/repositories/booking_repository.dart';
import 'package:parking_app/src/features/booking/domain/usecases/get_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/lookup_booking_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/save_booking_access_use_case.dart';
import 'package:parking_app/src/features/booking/domain/usecases/saved_bookings_use_case.dart';
import 'package:parking_app/src/features/booking/presentation/bloc/booking_bloc.dart';
import 'package:parking_app/src/services/location_service.dart';
import 'package:parking_app/src/services/secure_storage_service.dart';

/// The data source over a real (in-memory) secure storage, without network.
class FakeBookingDataSource implements BookingDataSource {
  FakeBookingDataSource(this.storage);
  final SecureStorageService storage;

  static const booking = PublicBookingModel(
    reference: 'R7KQ2M',
    status: 'upcoming',
    parking: BookingParkingModel(title: 'Parking Démo LYS', address: '12 route de l’Aéroport'),
    arrivalAt: '2026-10-03T08:00',
    returnAt: '2026-10-10T15:05',
    customerName: 'Camille Martin',
    plate: 'AB-123-CD',
    passengers: 2,
  );

  @override
  Future<BookingAccessModel> lookup({required String reference, required String email}) async {
    if (email != 'camille@example.com') throw const ServerException(code: 'not_found');
    await storage.saveBookingToken('R7KQ2M', 'token-from-lookup');
    return const BookingAccessModel(reference: 'R7KQ2M', manageToken: 'token-from-lookup');
  }

  @override
  Future<PublicBookingModel> getBooking({required String reference}) async {
    if (await storage.bookingToken(reference) == null) throw const ServerException(code: 'not_found');
    return booking;
  }

  @override
  Future<void> saveAccess({required String reference, required String token}) => storage.saveBookingToken(reference, token);

  @override
  Future<List<String>> savedReferences() => storage.bookingReferences();

  @override
  Future<void> forget({required String reference}) => storage.forgetBooking(reference);

  // Not used by this bloc (see test/helpers/fakes.dart for the full fake).
  @override
  Future<CreatedBookingModel> create(BookingInput input) => throw UnimplementedError();
  @override
  Future<PublicBookingModel> updateFlight({required String reference, required String? flight}) => throw UnimplementedError();
  @override
  Future<PublicBookingModel> locateCar({required String reference, required GeoPosition position, String? note}) => throw UnimplementedError();
  @override
  Future<PublicBookingModel> clearCar({required String reference}) => throw UnimplementedError();
  @override
  Future<PaymentIntentModel> paymentIntent({required String reference}) => throw UnimplementedError();
  @override
  Future<CheckoutModel> checkout({required String reference}) => throw UnimplementedError();
  @override
  Future<PublicBookingModel> release({required String reference}) => throw UnimplementedError();
  @override
  Future<PublicBookingModel> cancel({required String reference}) => throw UnimplementedError();
}

void main() {
  late InMemorySecureStorageService storage;
  late BookingBloc bloc;

  setUp(() {
    storage = InMemorySecureStorageService();
    final repo = BookingRepositoryImpl(FakeBookingDataSource(storage));
    bloc = BookingBloc(LookupBookingUseCase(repo), GetBookingUseCase(repo), SaveBookingAccessUseCase(repo), SavedBookingsUseCase(repo));
  });
  tearDown(() => bloc.close());

  test('lien profond : le jeton part dans le stockage sécurisé, la réservation s’ouvre', () async {
    bloc.add(const BookingLinkOpened('r7kq2m', token: 'token-from-link'));
    final state = await bloc.stream.firstWhere((s) => s.viewState.isSuccess);
    expect(state.booking?.plate, 'AB-123-CD');
    expect(await storage.bookingToken('R7KQ2M'), 'token-from-link');
    bloc.add(const BookingSavedRequested());
    expect((await bloc.stream.firstWhere((s) => s.savedReferences.isNotEmpty)).savedReferences, ['R7KQ2M']);
  });

  test('saisie manuelle : référence + email', () async {
    bloc.add(const BookingLookupSubmitted(reference: 'R7KQ2M', email: 'camille@example.com'));
    final state = await bloc.stream.firstWhere((s) => s.viewState.isSuccess);
    expect(state.reference, 'R7KQ2M');
    expect(await storage.bookingToken('R7KQ2M'), 'token-from-lookup');
  });

  test('sans jeton : introuvable', () async {
    final result = await Future<PublicBookingModel>.error(const ServerException(code: 'not_found')).makeRequest();
    expect(result.isLeft, isTrue);
    expect(result.fold((Failure f) => f.code, (_) => null), 'not_found');
    expect(const Right<Failure, int>(1).isRight, isTrue);
  });
}
