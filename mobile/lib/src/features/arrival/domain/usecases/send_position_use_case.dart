import 'package:equatable/equatable.dart';

import '../../../../core/error/failure.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/utils/use_case.dart';
import '../../../../services/location_service.dart';
import '../../data/models/arrival_model.dart';
import '../repositories/arrival_repository.dart';

class SendPositionParams extends Equatable {
  const SendPositionParams({required this.reference, required this.position});
  final String reference;
  final GeoPosition position;
  @override
  List<Object?> get props => [reference, position];
}

/// Sends the latest position (the server keeps only that one).
class SendPositionUseCase with UseCase<ArrivalModel, SendPositionParams> {
  SendPositionUseCase(this._repository);

  final ArrivalRepository _repository;

  @override
  Future<Either<Failure, ArrivalModel>> call(SendPositionParams params) => _repository.sendPosition(params.reference, params.position);
}
