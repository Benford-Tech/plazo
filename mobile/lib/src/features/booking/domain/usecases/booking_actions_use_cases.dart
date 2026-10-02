import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/public_booking_model.dart';
import '../repositories/booking_repository.dart';

/// "Confirmer la réservation" / "Continuer vers le paiement": the API checks every rule and
/// computes the price; the manage token is kept on the phone.
class CreateBookingUseCase with UseCase<CreatedBookingModel, BookingInput> {
  CreateBookingUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, CreatedBookingModel>> call(BookingInput params) => _repository.create(params);
}

class UpdateFlightParams extends Equatable {
  const UpdateFlightParams({required this.reference, required this.flight});
  final String reference;
  final String? flight;
  @override
  List<Object?> get props => [reference, flight];
}

/// "Modifier le vol": set or clear the return flight followed by the shuttle.
class UpdateFlightUseCase with UseCase<PublicBookingModel, UpdateFlightParams> {
  UpdateFlightUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, PublicBookingModel>> call(UpdateFlightParams params) =>
      _repository.updateFlight(reference: params.reference, flight: params.flight);
}

/// Cancel online, within the booking's terms (refunded in full when paid online).
class CancelBookingUseCase with UseCase<PublicBookingModel, String> {
  CancelBookingUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, PublicBookingModel>> call(String params) => _repository.cancel(reference: params);
}

/// The PaymentIntent of a held booking, for the native payment sheet.
class CreatePaymentIntentUseCase with UseCase<PaymentIntentModel, String> {
  CreatePaymentIntentUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, PaymentIntentModel>> call(String params) => _repository.paymentIntent(reference: params);
}

/// Stripe's payment page (web builds, where the native sheet does not exist).
class CheckoutUseCase with UseCase<CheckoutModel, String> {
  CheckoutUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, CheckoutModel>> call(String params) => _repository.checkout(reference: params);
}

/// "Modifier" / "Recommencer": the place is released, the form opens again.
class ReleaseHoldUseCase with UseCase<PublicBookingModel, String> {
  ReleaseHoldUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, PublicBookingModel>> call(String params) => _repository.release(reference: params);
}

/// The bookings kept on this phone, read again from the API. A booking the API no longer knows
/// (link expired 30 days after the return, or revoked) is removed from the phone.
class LoadSavedBookingsUseCase with UseCase<List<PublicBookingModel>, NoParams> {
  LoadSavedBookingsUseCase(this._repository);
  final BookingRepository _repository;

  @override
  Future<Either<Failure, List<PublicBookingModel>>> call(NoParams params) async {
    final refs = await _repository.savedReferences();
    if (refs.isLeft) return Left(refs.fold((f) => f, (_) => throw StateError('unreachable')));
    final references = refs.fold((_) => <String>[], (r) => r);
    final results = await Future.wait(references.map((ref) => _repository.getBooking(reference: ref)));
    final bookings = <PublicBookingModel>[];
    Failure? firstFailure;
    for (var i = 0; i < results.length; i++) {
      final result = results[i];
      if (result.isRight) {
        bookings.add(result.fold((_) => throw StateError('unreachable'), (b) => b));
        continue;
      }
      final failure = result.fold((f) => f, (_) => throw StateError('unreachable'));
      if (failure.code == 'not_found') {
        await _repository.forget(reference: references[i]);
      } else {
        firstFailure ??= failure;
      }
    }
    // Nothing could be read (offline): say so rather than showing an empty list.
    if (bookings.isEmpty && firstFailure != null) return Left(firstFailure);
    return Right(bookings);
  }
}
