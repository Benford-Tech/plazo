import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../repositories/booking_repository.dart';

/// References of the bookings opened on this phone (newest first).
class SavedBookingsUseCase with UseCase<List<String>, NoParams> {
  SavedBookingsUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, List<String>>> call(NoParams params) => _repository.savedReferences();
}
