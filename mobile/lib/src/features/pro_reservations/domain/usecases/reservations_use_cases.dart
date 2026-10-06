import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/reservation_models.dart';
import '../repositories/reservations_repository.dart';

class ListReservationsParams extends Equatable {
  const ListReservationsParams({this.query, this.page = 1});
  final String? query;
  final int page;
  @override
  List<Object?> get props => [query, page];
}

class ListReservationsUseCase with UseCase<ReservationPageModel, ListReservationsParams> {
  ListReservationsUseCase(this._repository);
  final ReservationsRepository _repository;
  @override
  Future<Either<Failure, ReservationPageModel>> call(ListReservationsParams params) => _repository.list(query: params.query, page: params.page);
}

class GetReservationUseCase with UseCase<ReservationModel, String> {
  GetReservationUseCase(this._repository);
  final ReservationsRepository _repository;
  @override
  Future<Either<Failure, ReservationModel>> call(String id) => _repository.get(id);
}

class SaveReservationParams extends Equatable {
  const SaveReservationParams({this.id, required this.input});

  /// Null: a new booking.
  final String? id;
  final ReservationInput input;
  @override
  List<Object?> get props => [id, input];
}

class SaveReservationUseCase with UseCase<ReservationModel, SaveReservationParams> {
  SaveReservationUseCase(this._repository);
  final ReservationsRepository _repository;
  @override
  Future<Either<Failure, ReservationModel>> call(SaveReservationParams params) =>
      params.id == null ? _repository.create(params.input) : _repository.update(params.id!, params.input);
}

class ChangeStatusParams extends Equatable {
  const ChangeStatusParams({required this.id, required this.status});
  final String id;
  final String status;
  @override
  List<Object?> get props => [id, status];
}

class ChangeReservationStatusUseCase with UseCase<ReservationModel, ChangeStatusParams> {
  ChangeReservationStatusUseCase(this._repository);
  final ReservationsRepository _repository;
  @override
  Future<Either<Failure, ReservationModel>> call(ChangeStatusParams params) => _repository.changeStatus(params.id, params.status);
}

class CapacityParams extends Equatable {
  const CapacityParams({required this.arrivalAt, required this.returnAt, this.excludeId});
  final String arrivalAt;
  final String returnAt;
  final String? excludeId;
  @override
  List<Object?> get props => [arrivalAt, returnAt, excludeId];
}

class PreviewCapacityUseCase with UseCase<CapacityPreviewModel, CapacityParams> {
  PreviewCapacityUseCase(this._repository);
  final ReservationsRepository _repository;
  @override
  Future<Either<Failure, CapacityPreviewModel>> call(CapacityParams params) =>
      _repository.capacity(params.arrivalAt, params.returnAt, excludeId: params.excludeId);
}
