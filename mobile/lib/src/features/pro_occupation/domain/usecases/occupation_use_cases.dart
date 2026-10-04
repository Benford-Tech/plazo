import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/occupation_models.dart';
import '../repositories/occupation_repository.dart';

class GetOccupationUseCase with UseCase<OccupationBoardModel, String> {
  GetOccupationUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, OccupationBoardModel>> call(String parkingId) => _repository.board(parkingId);
}

class SearchVehiclesParams extends Equatable {
  const SearchVehiclesParams({required this.parkingId, required this.query});
  final String parkingId;
  final String query;
  @override
  List<Object?> get props => [parkingId, query];
}

class SearchVehiclesUseCase with UseCase<List<OccupantModel>, SearchVehiclesParams> {
  SearchVehiclesUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, List<OccupantModel>>> call(SearchVehiclesParams params) => _repository.search(params.parkingId, params.query);
}

class AssignSpotParams extends Equatable {
  const AssignSpotParams({required this.reservationId, required this.spotId, this.keyHook, this.keysOnly = false});
  final String reservationId;
  final String? spotId;
  final String? keyHook;

  /// Only the key hook changes (the spot stays as it is).
  final bool keysOnly;
  @override
  List<Object?> get props => [reservationId, spotId, keyHook, keysOnly];
}

class AssignSpotUseCase with UseCase<OccupantModel, AssignSpotParams> {
  AssignSpotUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, OccupantModel>> call(AssignSpotParams params) =>
      _repository.assign(params.reservationId, spotId: params.spotId, keyHook: params.keyHook, keysOnly: params.keysOnly);
}
