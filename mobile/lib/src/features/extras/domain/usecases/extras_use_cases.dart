import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../data/models/extras_models.dart';
import '../repositories/extras_repository.dart';

/// Services for the car (21/10/2026): the traveller's offer and orders (Plazo).
class TravellerExtrasUseCases {
  TravellerExtrasUseCases(this._repository);
  final ExtrasRepository _repository;

  Future<Either<Failure, TravellerExtrasModel>> load(String reference) => _repository.traveller(reference);
  Future<Either<Failure, ExtraOrderResponseModel>> order(String reference, String kind) => _repository.order(reference, kind);
  Future<Either<Failure, TravellerExtrasModel>> sync(String reference, String extraId) => _repository.sync(reference, extraId);
  Future<Either<Failure, TravellerExtrasModel>> abandon(String reference, String extraId) => _repository.abandon(reference, extraId);
}

/// The services ordered on a booking, for the team (Plazo Pro): « Fait », « Pas possible ».
class StaffExtrasUseCases {
  StaffExtrasUseCases(this._repository);
  final ExtrasRepository _repository;

  Future<Either<Failure, StaffExtrasModel>> load(String reservationId) => _repository.staff(reservationId);
  Future<Either<Failure, StaffExtrasModel>> accept(String reservationId, String extraId) => _repository.accept(reservationId, extraId);
  Future<Either<Failure, StaffExtrasModel>> done(String reservationId, String extraId) => _repository.done(reservationId, extraId);
  Future<Either<Failure, StaffExtrasModel>> refuse(String reservationId, String extraId, String? reason) =>
      _repository.refuse(reservationId, extraId, reason);
}

/// The parking's services and prices (managers, Plazo Pro).
class ExtraSettingsUseCases {
  ExtraSettingsUseCases(this._repository);
  final ExtrasRepository _repository;

  Future<Either<Failure, ExtraSettingsModel>> load(String parkingId) => _repository.settings(parkingId);
  Future<Either<Failure, ExtraSettingsModel>> save(String parkingId, {required int leadHours, required List<ExtraSettingModel> offers}) =>
      _repository.updateSettings(parkingId, leadHours: leadHours, offers: offers);
}
