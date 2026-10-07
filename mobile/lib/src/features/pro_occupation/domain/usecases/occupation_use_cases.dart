import 'package:equatable/equatable.dart';
import '../../../../services/location_service.dart';

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
  const AssignSpotParams({required this.reservationId, required this.spotId, this.keyHook, this.keysOnly = false, this.car});
  final String reservationId;
  final String? spotId;
  final String? keyHook;

  /// Only the key hook changes (the spot stays as it is).
  final bool keysOnly;

  /// The valet's GPS fix where the car stands (06/10/2026), taken as the spot is assigned.
  final GeoPosition? car;
  @override
  List<Object?> get props => [reservationId, spotId, keyHook, keysOnly, car];
}

class AssignSpotUseCase with UseCase<OccupantModel, AssignSpotParams> {
  AssignSpotUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, OccupantModel>> call(AssignSpotParams params) =>
      _repository.assign(params.reservationId, spotId: params.spotId, keyHook: params.keyHook, keysOnly: params.keysOnly, car: params.car);
}

// ---- S-C (07/10/2026): files as the unit of storage -------------------------------------------

class GetFilesUseCase with UseCase<FileBoardModel, String> {
  GetFilesUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, FileBoardModel>> call(String parkingId) => _repository.files(parkingId);
}

class AssignFileParams extends Equatable {
  const AssignFileParams({required this.reservationId, required this.fileId, this.keyHook, this.keysOnly = false, this.car});
  final String reservationId;

  /// Null takes the car out of its file.
  final String? fileId;
  final String? keyHook;
  final bool keysOnly;
  final GeoPosition? car;
  @override
  List<Object?> get props => [reservationId, fileId, keyHook, keysOnly, car];
}

class AssignFileUseCase with UseCase<OccupantModel, AssignFileParams> {
  AssignFileUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, OccupantModel>> call(AssignFileParams params) =>
      _repository.assignFile(params.reservationId, fileId: params.fileId, keyHook: params.keyHook, keysOnly: params.keysOnly, car: params.car);
}

class PrepareFilesUseCase with UseCase<FilesPreparedModel, String> {
  PrepareFilesUseCase(this._repository);
  final OccupationRepository _repository;
  @override
  Future<Either<Failure, FilesPreparedModel>> call(String parkingId) => _repository.prepareFiles(parkingId);
}
