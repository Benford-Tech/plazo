import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../repositories/booking_repository.dart';

class SaveBookingAccessParams extends Equatable {
  const SaveBookingAccessParams({required this.reference, required this.token});
  final String reference;
  final String token;
  @override
  List<Object?> get props => [reference];
}

/// Deep link /ma-reservation/REF?cle=TOKEN: the token goes to the secure storage.
class SaveBookingAccessUseCase with UseCase<void, SaveBookingAccessParams> {
  SaveBookingAccessUseCase(this._repository);

  final BookingRepository _repository;

  @override
  Future<Either<Failure, void>> call(SaveBookingAccessParams params) => _repository.saveAccess(reference: params.reference, token: params.token);
}
