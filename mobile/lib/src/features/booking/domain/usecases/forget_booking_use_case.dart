import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../repositories/booking_repository.dart';

/// Removes a booking (and its token) from this phone.
class ForgetBookingUseCase with UseCase<void, String> {
  ForgetBookingUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, void>> call(String params) => _repository.forget(reference: params);
}
