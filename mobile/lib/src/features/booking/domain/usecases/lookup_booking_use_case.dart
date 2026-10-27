import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_booking_model.dart';
import '../repositories/booking_repository.dart';

class LookupBookingParams extends Equatable {
  const LookupBookingParams({required this.reference, required this.contact});
  final String reference;
  final String contact;
  @override
  List<Object?> get props => [reference, contact];
}

/// Manual entry: reference + email (the site's "Ma réservation" form). Saves the manage token.
class LookupBookingUseCase with UseCase<BookingAccessModel, LookupBookingParams> {
  LookupBookingUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, BookingAccessModel>> call(LookupBookingParams params) =>
      _repository.lookup(reference: params.reference, contact: params.contact);
}
