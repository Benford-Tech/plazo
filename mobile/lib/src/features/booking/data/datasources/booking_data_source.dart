import '../../../../core/error/exceptions.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/booking_client.dart';
import '../models/public_booking_model.dart';

abstract class BookingDataSource {
  Future<CreatedBookingModel> create(BookingInput input);
  Future<BookingAccessModel> lookup({required String reference, required String email});
  Future<PublicBookingModel> getBooking({required String reference});
  Future<PublicBookingModel> updateFlight({required String reference, required String? flight});
  Future<PaymentIntentModel> paymentIntent({required String reference});
  Future<CheckoutModel> checkout({required String reference});
  Future<PublicBookingModel> release({required String reference});
  Future<PublicBookingModel> cancel({required String reference});
  Future<void> saveAccess({required String reference, required String token});
  Future<List<String>> savedReferences();
  Future<void> forget({required String reference});
}

class BookingDataSourceImpl implements BookingDataSource {
  BookingDataSourceImpl(this.client, this.storage);

  final BookingClient client;
  final SecureStorageService storage;

  /// The booking's manage token kept on this phone; "not_found" without it (as the API answers).
  Future<String> _token(String reference) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return token;
  }

  @override
  Future<CreatedBookingModel> create(BookingInput input) async {
    final created = await client.create(body: input.toJson());
    // No traveller account: the booking lives on this phone through its manage token.
    await storage.saveBookingToken(created.reference, created.manageToken);
    return created;
  }

  @override
  Future<BookingAccessModel> lookup({required String reference, required String email}) async {
    final access = await client.lookup(body: {'reference': reference.trim().toUpperCase(), 'email': email.trim()});
    await storage.saveBookingToken(access.reference, access.manageToken);
    return access;
  }

  @override
  Future<PublicBookingModel> getBooking({required String reference}) async =>
      client.getBooking(reference: reference.toUpperCase(), token: await _token(reference));

  @override
  Future<PublicBookingModel> updateFlight({required String reference, required String? flight}) async => client.updateFlight(
    reference: reference.toUpperCase(),
    token: await _token(reference),
    body: {'returnFlight': (flight == null || flight.trim().isEmpty) ? null : flight.trim().toUpperCase()},
  );

  @override
  Future<PaymentIntentModel> paymentIntent({required String reference}) async =>
      client.paymentIntent(reference: reference.toUpperCase(), token: await _token(reference));

  @override
  Future<CheckoutModel> checkout({required String reference}) async =>
      client.checkout(reference: reference.toUpperCase(), token: await _token(reference));

  @override
  Future<PublicBookingModel> release({required String reference}) async =>
      client.release(reference: reference.toUpperCase(), token: await _token(reference));

  @override
  Future<PublicBookingModel> cancel({required String reference}) async =>
      client.cancel(reference: reference.toUpperCase(), token: await _token(reference));

  @override
  Future<void> saveAccess({required String reference, required String token}) => storage.saveBookingToken(reference, token);

  @override
  Future<List<String>> savedReferences() => storage.bookingReferences();

  @override
  Future<void> forget({required String reference}) => storage.forgetBooking(reference);
}
