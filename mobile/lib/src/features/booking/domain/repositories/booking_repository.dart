import '../../../../core/error/failure.dart';
import '../../../../core/extensions/repositories_extensions.dart';
import '../../../../core/utils/either.dart';
import '../../../../services/location_service.dart';
import '../../data/datasources/booking_data_source.dart';
import '../../data/models/public_booking_model.dart';

abstract class BookingRepository {
  Future<Either<Failure, CreatedBookingModel>> create(BookingInput input);
  Future<Either<Failure, BookingAccessModel>> lookup({required String reference, required String email});
  Future<Either<Failure, PublicBookingModel>> getBooking({required String reference});
  Future<Either<Failure, PublicBookingModel>> updateFlight({required String reference, required String? flight});
  Future<Either<Failure, PublicBookingModel>> locateCar({required String reference, required GeoPosition position, String? note});
  Future<Either<Failure, PublicBookingModel>> clearCar({required String reference});
  Future<Either<Failure, PaymentIntentModel>> paymentIntent({required String reference});
  Future<Either<Failure, CheckoutModel>> checkout({required String reference});
  Future<Either<Failure, PublicBookingModel>> release({required String reference});
  Future<Either<Failure, PublicBookingModel>> cancel({required String reference});
  Future<Either<Failure, void>> saveAccess({required String reference, required String token});
  Future<Either<Failure, List<String>>> savedReferences();
  Future<Either<Failure, void>> forget({required String reference});
}

class BookingRepositoryImpl implements BookingRepository {
  BookingRepositoryImpl(this._dataSource);

  final BookingDataSource _dataSource;

  @override
  Future<Either<Failure, CreatedBookingModel>> create(BookingInput input) => _dataSource.create(input).makeRequest();

  @override
  Future<Either<Failure, BookingAccessModel>> lookup({required String reference, required String email}) =>
      _dataSource.lookup(reference: reference, email: email).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> getBooking({required String reference}) => _dataSource.getBooking(reference: reference).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> updateFlight({required String reference, required String? flight}) =>
      _dataSource.updateFlight(reference: reference, flight: flight).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> locateCar({required String reference, required GeoPosition position, String? note}) =>
      _dataSource.locateCar(reference: reference, position: position, note: note).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> clearCar({required String reference}) => _dataSource.clearCar(reference: reference).makeRequest();

  @override
  Future<Either<Failure, PaymentIntentModel>> paymentIntent({required String reference}) =>
      _dataSource.paymentIntent(reference: reference).makeRequest();

  @override
  Future<Either<Failure, CheckoutModel>> checkout({required String reference}) => _dataSource.checkout(reference: reference).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> release({required String reference}) => _dataSource.release(reference: reference).makeRequest();

  @override
  Future<Either<Failure, PublicBookingModel>> cancel({required String reference}) => _dataSource.cancel(reference: reference).makeRequest();

  @override
  Future<Either<Failure, void>> saveAccess({required String reference, required String token}) =>
      _dataSource.saveAccess(reference: reference, token: token).makeRequest();

  @override
  Future<Either<Failure, List<String>>> savedReferences() => _dataSource.savedReferences().makeRequest();

  @override
  Future<Either<Failure, void>> forget({required String reference}) => _dataSource.forget(reference: reference).makeRequest();
}
