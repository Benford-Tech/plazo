import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../data/models/plan_models.dart';
import '../repositories/plan_repository.dart';

class GetProParkingUseCase with UseCase<ParkingSummaryModel, NoParams> {
  GetProParkingUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, ParkingSummaryModel>> call(NoParams params) => _repository.getParking();
}

class GetPlanUseCase with UseCase<ParkingPlanViewModel, String> {
  GetPlanUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, ParkingPlanViewModel>> call(String parkingId) => _repository.getPlan(parkingId);
}

class SaveOutlineParams extends Equatable {
  const SaveOutlineParams({required this.parkingId, required this.ring});
  final String parkingId;
  final List<List<double>> ring;
  @override
  List<Object?> get props => [parkingId, ring];
}

class SaveOutlineUseCase with UseCase<ParkingPlanViewModel, SaveOutlineParams> {
  SaveOutlineUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, ParkingPlanViewModel>> call(SaveOutlineParams params) => _repository.saveOutline(params.parkingId, params.ring);
}

class EstimatePlanUseCase with UseCase<PlanEstimateModel, String> {
  EstimatePlanUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, PlanEstimateModel>> call(String parkingId) => _repository.estimate(parkingId);
}

class GeneratePlanParams extends Equatable {
  const GeneratePlanParams({required this.parkingId, required this.layout});
  final String parkingId;
  final String layout;
  @override
  List<Object?> get props => [parkingId, layout];
}

class GeneratePlanUseCase with UseCase<ParkingPlanViewModel, GeneratePlanParams> {
  GeneratePlanUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, ParkingPlanViewModel>> call(GeneratePlanParams params) => _repository.generate(params.parkingId, params.layout);
}

class GeocodeUseCase with UseCase<List<GeocodeResultModel>, String> {
  GeocodeUseCase(this._repository);
  final PlanRepository _repository;
  @override
  Future<Either<Failure, List<GeocodeResultModel>>> call(String query) => _repository.geocode(query);
}
