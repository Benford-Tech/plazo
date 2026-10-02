import '../../../../core/error/exceptions.dart';
import '../../../../services/secure_storage_service.dart';
import '../client/booking_client.dart';
import '../models/public_booking_model.dart';

abstract class BookingDataSource {
  Future<BookingAccessModel> lookup({required String reference, required String email});
  Future<PublicBookingModel> getBooking({required String reference});
  Future<void> saveAccess({required String reference, required String token});
  Future<List<String>> savedReferences();
  Future<void> forget({required String reference});
}

class BookingDataSourceImpl implements BookingDataSource {
  BookingDataSourceImpl(this.client, this.storage);

  final BookingClient client;
  final SecureStorageService storage;

  @override
  Future<BookingAccessModel> lookup({required String reference, required String email}) async {
    final access = await client.lookup(body: {'reference': reference.trim().toUpperCase(), 'email': email.trim()});
    await storage.saveBookingToken(access.reference, access.manageToken);
    return access;
  }

  @override
  Future<PublicBookingModel> getBooking({required String reference}) async {
    final token = await storage.bookingToken(reference);
    if (token == null) throw const ServerException(code: 'not_found');
    return client.getBooking(reference: reference.toUpperCase(), token: token);
  }

  @override
  Future<void> saveAccess({required String reference, required String token}) => storage.saveBookingToken(reference, token);

  @override
  Future<List<String>> savedReferences() => storage.bookingReferences();

  @override
  Future<void> forget({required String reference}) => storage.forgetBooking(reference);
}
