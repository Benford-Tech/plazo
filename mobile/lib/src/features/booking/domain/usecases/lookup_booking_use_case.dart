import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_booking_model.dart';
import '../repositories/booking_repository.dart';

class LookupBookingParams extends Equatable {
  const LookupBookingParams({required this.reference, required this.email});
  final String reference;
  final String email;
  @override
  List<Object?> get props => [reference, email];
}

/// Manual entry: reference + email (the site's "Ma réservation" form). Saves the manage token.
class LookupBookingUseCase with UseCase<BookingAccessModel, LookupBookingParams> {
  LookupBookingUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, BookingAccessModel>> call(LookupBookingParams params) =>
      _repository.lookup(reference: params.reference, email: params.email);
}
