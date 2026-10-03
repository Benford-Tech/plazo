import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/models/return_model.dart';
import '../repositories/return_repository.dart';

/// The return day of a booking (flight, meeting point, shuttle).
class GetReturnUseCase with UseCase<TravellerReturnModel, String> {
  GetReturnUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, TravellerReturnModel>> call(String reference) => _repository.getReturn(reference);
}

/// "J'ai atterri".
class DeclareLandedUseCase with UseCase<TravellerReturnModel, String> {
  DeclareLandedUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, TravellerReturnModel>> call(String reference) => _repository.landed(reference);
}

class WalkingRouteParams extends Equatable {
  const WalkingRouteParams({required this.reference, this.from});
  final String reference;
  final GeoPosition? from;
  @override
  List<Object?> get props => [reference, from];
}

/// The walking route to the meeting point (computed by the API).
class GetWalkingRouteUseCase with UseCase<WalkingRouteModel, WalkingRouteParams> {
  GetWalkingRouteUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, WalkingRouteModel>> call(WalkingRouteParams params) => _repository.route(params.reference, params.from);
}

/// The shuttle coming for the traveller (polled).
class GetShuttleStatusUseCase with UseCase<ShuttleStatusModel, String> {
  GetShuttleStatusUseCase(this._repository);
  final ReturnRepository _repository;

  @override
  Future<Either<Failure, ShuttleStatusModel>> call(String reference) => _repository.shuttle(reference);
}
