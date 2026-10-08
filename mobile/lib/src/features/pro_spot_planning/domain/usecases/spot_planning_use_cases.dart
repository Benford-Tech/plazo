import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/files_planning_models.dart';
import '../../data/models/spot_planning_models.dart';
import '../repositories/spot_planning_repository.dart';

class SpotPlanningParams extends Equatable {
  const SpotPlanningParams({required this.parkingId, required this.from, this.days = 7});
  final String parkingId;

  /// Local date "YYYY-MM-DD" of the first day.
  final String from;
  final int days;
  @override
  List<Object?> get props => [parkingId, from, days];
}

class GetSpotPlanningUseCase with UseCase<SpotPlanningModel, SpotPlanningParams> {
  GetSpotPlanningUseCase(this._repository);
  final SpotPlanningRepository _repository;
  @override
  Future<Either<Failure, SpotPlanningModel>> call(SpotPlanningParams params) => _repository.get(params.parkingId, params.from, params.days);
}

class PreassignSpotsUseCase with UseCase<PreassignResultModel, SpotPlanningParams> {
  PreassignSpotsUseCase(this._repository);
  final SpotPlanningRepository _repository;
  @override
  Future<Either<Failure, PreassignResultModel>> call(SpotPlanningParams params) => _repository.preassign(params.parkingId, params.from, params.days);
}

// ---- Planning des files (08/10/2026) -----------------------------------------------------------

class GetFilesPlanningUseCase with UseCase<FilesPlanningModel, SpotPlanningParams> {
  GetFilesPlanningUseCase(this._repository);
  final SpotPlanningRepository _repository;
  @override
  Future<Either<Failure, FilesPlanningModel>> call(SpotPlanningParams params) => _repository.filesPlanning(params.parkingId, params.from, params.days);
}

class KeepFileParams extends Equatable {
  const KeepFileParams({required this.parkingId, required this.fileId, required this.day});
  final String parkingId;
  final String fileId;

  /// The return day "YYYY-MM-DD" the empty file is kept for; null frees it.
  final String? day;
  @override
  List<Object?> get props => [parkingId, fileId, day];
}

class KeepFileUseCase with UseCase<KeptFileModel, KeepFileParams> {
  KeepFileUseCase(this._repository);
  final SpotPlanningRepository _repository;
  @override
  Future<Either<Failure, KeptFileModel>> call(KeepFileParams params) => _repository.keepFile(params.parkingId, params.fileId, params.day);
}
