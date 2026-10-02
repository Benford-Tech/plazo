import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_booking_model.dart';
import '../repositories/booking_repository.dart';

class GetBookingUseCase with UseCase<PublicBookingModel, String> {
  GetBookingUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, PublicBookingModel>> call(String params) => _repository.getBooking(reference: params);
}
